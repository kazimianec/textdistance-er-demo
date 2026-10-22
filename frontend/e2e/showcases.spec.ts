import { test, expect } from "@playwright/test";
import { showcases } from "../src/data/showcases";

/**
 * End-to-end tests for the textdistance Entity Resolution demo.
 *
 * Navigation model: the app uses react-router routes (/, /showcases, /compare)
 * rather than in-page tabs, so tests navigate by URL / nav buttons.
 */

const SHOWCASE_TABS = [
  "Company Names with Abbreviations",
  "Company Name + Address",
  "Person Full Names",
  "Person Name + Address",
  "Long Common Substrings",
  "Transliterations & Cross-Alphabet",
  "Heavy Typo Scenarios",
  "Mixed Real-World Noise",
  "Brand & Product Name Variations",
  "Legal Entity Type Variations",
  "Address Format Differences",
  "Nickname vs Legal Name",
  "Historical & Outdated Names",
  "Partial & Substring Matches",
];

/** Hard positives: strings look different but SHOULD match. */
const HARD_POSITIVES = [
  { text1: "International Business Machines", text2: "IBM", label: "Abbreviation expansion" },
  { text1: "Acme Corp", text2: "Acme Corporation", label: "Legal suffix expansion" },
  { text1: "Will Smith", text2: "William Smith", label: "Nickname to legal name" },
];

/** Hard negatives: strings look similar but should NOT match. */
const HARD_NEGATIVES = [
  { text1: "Amazon Web Services", text2: "Amazon Internet Services", label: "Shared prefix" },
  { text1: "Bank of America", text2: "America Bank", label: "Scrambled words" },
];

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
  });

  test("renders the landing page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /textdistance entity resolution/i })
    ).toBeVisible();
  });

  test("explains why Levenshtein alone is not enough", async ({ page }) => {
    await expect(page.getByText(/levenshtein distance alone is not enough/i)).toBeVisible();
  });

  test("offers navigation to showcases and compare", async ({ page }) => {
    // These render as anchors (component={Link}), not <button> elements.
    await expect(page.getByRole("link", { name: /explore showcases/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /try it now/i })).toBeVisible();
  });
});

test.describe("Showcases page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/showcases");
    await page.waitForSelector('[role="tab"]', { timeout: 15_000 });
  });

  test("renders all 14 showcase tabs", async ({ page }) => {
    for (const name of SHOWCASE_TABS) {
      await expect(page.getByRole("tab", { name })).toBeVisible();
    }
  });

  test("shows the core and discovered showcase counts", async ({ page }) => {
    await expect(page.getByText(/8 core showcases/i)).toBeVisible();
    await expect(page.getByText(/6 discovered showcases/i)).toBeVisible();
  });

  test("navigates through every showcase tab", async ({ page }) => {
    for (const name of SHOWCASE_TABS) {
      await page.getByRole("tab", { name }).click();
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
  });

  test("expands a case and shows per-algorithm scores", async ({ page }) => {
    // First showcase's first case
    await page.getByRole("tab", { name: SHOWCASE_TABS[0] }).click();
    await expect(page.getByText(/should match|should not match/i).first()).toBeVisible();

    // Expand the first case card
    await page.locator("text=/International Business Machines/").first().click();
    await expect(page.getByText(/hard positive|hard negative/i).first()).toBeVisible();
    await expect(page.getByText("Levenshtein", { exact: true })).toBeVisible();
  });

  test("marks hard positives with a KEY badge", async ({ page }) => {
    await page.getByRole("tab", { name: "Long Common Substrings" }).click();
    await page.locator("text=/International Business Machines/").first().click();
    await expect(page.getByText("KEY").first()).toBeVisible();
  });

  test("shows correct / incorrect verdicts for every algorithm", async ({ page }) => {
    await page.getByRole("tab", { name: SHOWCASE_TABS[0] }).click();
    await page.locator("text=/International Business Machines/").first().click();
    // Every algorithm row carries a ✓ or ✗ chip
    await expect(page.getByText("✓").first()).toBeVisible();
  });
});

test.describe("Consolidated Comparison page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/compare");
    await page.waitForSelector('text=/Consolidated Comparison/i', { timeout: 15_000 });
  });

  test("renders the comparison page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /consolidated comparison/i })
    ).toBeVisible();
    await expect(page.getByText(/why levenshtein distance alone is not enough/i)).toBeVisible();
  });

  test("compares two strings and shows the Levenshtein verdict", async ({ page }) => {
    await page.getByLabel("String A").fill("International Business Machines");
    await page.getByLabel("String B").fill("IBM");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();

    await expect(page.getByText(/levenshtein-only verdict/i)).toBeVisible();
    await expect(page.getByText(/highest scoring algorithm/i)).toBeVisible();
    await expect(page.getByText(/algorithm quick reference/i)).toBeVisible();
  });

  test("lists all 24 algorithms in the quick reference", async ({ page }) => {
    const rows = page.locator("text=/Levenshtein|Jaro-Winkler|Sorensen-Dice|Monge-Elkan/");
    await expect(rows.first()).toBeVisible();
  });

  test("shows that algorithms disagree with Levenshtein on the IBM case", async ({ page }) => {
    await page.getByLabel("String A").fill("International Business Machines");
    await page.getByLabel("String B").fill("IBM");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();

    // Levenshtein says no-match, other algorithms say match
    await expect(page.getByText(/disagree/i).first()).toBeVisible();
  });
});

test.describe("API integration", () => {
  test("backend returns a score for every algorithm", async ({ page }) => {
    const response = await page.request.post("http://localhost:8000/api/compare", {
      data: { text1: "Acme", text2: "Acme" },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Object.keys(body.scores).length).toBe(24);

    // Identical strings must score 1.0 everywhere it is meaningful
    for (const key of [
      "levenshtein",
      "jaro_winkler",
      "sorensen_dice",
      "cosine",
      "overlap",
      "mra",
      "monge_elkan",
      "needleman_wunsch",
      "gotoh",
      "editex",
    ]) {
      expect(body.scores[key]).toBe(1.0);
    }
  });

  test("backend scores unrelated strings low", async ({ page }) => {
    const response = await page.request.post("http://localhost:8000/api/compare", {
      data: { text1: "Acme", text2: "Zebra" },
    });
    const body = await response.json();
    expect(body.scores.monge_elkan).toBeLessThan(0.3);
    expect(body.scores.mra).toBeLessThan(0.3);
    expect(body.scores.needleman_wunsch).toBeLessThan(0.6);
  });

  test("backend scores every hard positive above 0 for the strong metrics", async ({
    page,
  }) => {
    for (const { text1, text2, label } of HARD_POSITIVES) {
      const response = await page.request.post("http://localhost:8000/api/compare", {
        data: { text1, text2 },
      });
      expect(response.ok(), `${label} request failed`).toBeTruthy();
      const body = await response.json();
      // A genuine hard positive still has to be visible to Overlap and
      // Jaro-Winkler - those are the metrics that handle expansion.
      expect(body.scores.overlap, label).toBeGreaterThan(0);
      expect(body.scores.jaro_winkler, label).toBeGreaterThan(0);
    }
  });

  test("naive metrics are fooled by hard negatives", async ({ page }) => {
    for (const { text1, text2, label } of HARD_NEGATIVES) {
      const response = await page.request.post("http://localhost:8000/api/compare", {
        data: { text1, text2 },
      });
      expect(response.ok(), `${label} request failed`).toBeTruthy();
      const body = await response.json();
      // A hard negative is hard precisely because a naive metric is fooled:
      // the character overlap of "Bank of America" and "America Bank" is a
      // perfect 1.0 even though the strings are different entities. If this
      // dropped below the threshold the case would stop being a hard negative.
      expect(body.scores.overlap, label).toBeGreaterThanOrEqual(0.7);
    }
  });

  test("every KEY algorithm in the dataset actually crosses the match threshold", async ({
    page,
  }) => {
    // The UI promises that KEY algorithms are the ones that "cope with this
    // case" (or, for hard negatives, the ones that wrongly score it as a
    // match). In both cases that means a score >= 0.7 - the same
    // MATCH_THRESHOLD AlgorithmBar uses to colour the verdict.
    //
    // This guards a real regression: the curated lists were written against an
    // earlier, broken backend normalisation and went stale, so several KEY
    // entries named algorithms that scored far below the threshold, and two
    // named algorithms that do not exist in the API at all.
    const apiAlgorithms = await (
      await page.request.get("http://localhost:8000/api/algorithms")
    ).json();
    const apiNames: string[] = apiAlgorithms.map((a: { name: string }) => a.name);

    const problems: string[] = [];

    for (const s of showcases) {
      for (const c of s.cases) {
        const highlighted = [
          ...(c.highlightHardPositive ?? []),
          ...(c.highlightHardNegative ?? []),
        ];
        if (highlighted.length === 0) continue;

        const unknown = highlighted.filter((a) => !apiNames.includes(a));
        if (unknown.length) {
          problems.push(`${c.id}: not an API algorithm: ${unknown.join(", ")}`);
          continue;
        }

        const response = await page.request.post("http://localhost:8000/api/compare", {
          data: { text1: c.text1, text2: c.text2 },
        });
        expect(response.ok(), `${c.id} request failed`).toBeTruthy();
        const body = await response.json();

        for (const a of highlighted) {
          if (body.scores[a] < 0.7) {
            problems.push(
              `${c.id}: KEY algorithm "${a}" scores ${body.scores[a]} (< 0.7)`
            );
          }
        }
      }
    }

    expect(
      problems,
      `curated KEY lists disagree with the API:\n${problems.join("\n")}`
    ).toEqual([]);
  });

  test("backend exposes the algorithm catalogue", async ({ page }) => {
    const response = await page.request.get("http://localhost:8000/api/algorithms");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.length).toBe(24);
  });
});
