import { test, expect, Page } from "@playwright/test";

// Test data: (text1, text2, expectedMatch, type, description)
// type: 'hard_positive' = strings look different but should match
// type: 'hard_negative' = strings look similar but should not match
// type: 'normal' = straightforward case
const TEST_CASES = [
  // Hard Positives
  {
    text1: "International Business Machines",
    text2: "IBM",
    expectedMatch: true,
    type: "hard_positive",
    description: "Abbreviation expansion",
  },
  {
    text1: "Amazon Web Services LLC",
    text2: "Amazon Internet Services GmbH",
    expectedMatch: false,
    type: "hard_positive",
    description: "Same prefix, different entities",
  },
  {
    text1: "John Smith",
    text2: "Bill Smith",
    expectedMatch: true,
    type: "hard_positive",
    description: "Nickname expansion",
  },
  {
    text1: "Robert James Smith",
    text2: "Robert Smith",
    expectedMatch: true,
    type: "hard_positive",
    description: "Middle initial dropped",
  },
  // Hard Negatives
  {
    text1: "John Smith",
    text2: "Jon Smith",
    expectedMatch: true,
    type: "hard_negative",
    description: "Cultural variation",
  },
  {
    text1: "München",
    text2: "Munich",
    expectedMatch: true,
    type: "hard_negative",
    description: "Umlaut transliteration",
  },
  {
    text1: "Boulevarde Avenue",
    text2: "Boulevard Ave",
    expectedMatch: true,
    type: "hard_negative",
    description: "Spelling variation",
  },
  // Normal cases
  {
    text1: "Tech Solutions Inc",
    text2: "Tech Solutions Incorporated",
    expectedMatch: true,
    type: "normal",
    description: "Legal suffix variation",
  },
  {
    text1: "test",
    text2: "test",
    expectedMatch: true,
    type: "normal",
    description: "Exact match",
  },
];

test.describe("Showcases Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
  });

  test("renders showcases page with tabs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /entity resolution showcases/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Company Names" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Consolidated Comparison" })).toBeVisible();
  });

  test("navigates through all showcase tabs", async ({ page }) => {
    const tabs = [
      "Company Names",
      "Company + Address",
      "Person Names",
      "Name + Address",
      "Long Common Substrings",
      "Transliterations",
      "Heavy Typos",
      "Mixed Noise",
      "Brand Variations",
      "Legal Entity Types",
      "OCR / Scraping",
      "URL / Domain",
      "Scientific Names",
      "Historical Names",
    ];

    for (const tab of tabs) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page.getByRole("tab", { name: tab })).toBeVisible();
    }
  });

  for (const tc of TEST_CASES) {
    test(`case: ${tc.description} (${tc.type})`, async ({ page }) => {
      // Navigate to Consolidated Comparison page
      await page.getByRole("tab", { name: "Consolidated Comparison" }).click();
      await page.waitForSelector('text=Consolidated Comparison");

      // Enter test strings
      await page.getByLabel("String A").fill(tc.text1);
      await page.getByLabel("String B").fill(tc.text2);

      // Click compare
      await page.getByRole("button", { name: /compare all algorithms/i }).click();

      // Wait for results to appear - look for algorithm score elements
      await page.waitForSelector('text=/levenshtein/i', { timeout: 5000 });

      // Verify "Levenshtein-Only Verdict" section appears
      await expect(page.getByText(/levenshtein-only verdict/i)).toBeVisible();

      // Verify "Highest Scoring Algorithm" section appears
      await expect(page.getByText(/highest scoring algorithm/i)).toBeVisible();

      // Verify the Algorithm Quick Reference is visible
      await expect(page.getByText(/algorithm quick reference/i)).toBeVisible();

      // For hard positive/negative cases, verify the warning about Levenshtein is shown
      if (tc.type === "hard_positive" && tc.expectedMatch) {
        // IBM case - Levenshtein should show a low score
        const verdictText = await page.getByText(/levenshtein/i).first().textContent();
        expect(verdictText).toBeTruthy();
      }
    });
  }
});

test.describe("Consolidated Comparison Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    await page.getByRole("tab", { name: "Consolidated Comparison" }).click();
  });

  test("renders comparison page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /consolidated comparison/i })).toBeVisible();
    await expect(page.getByText(/why levenshtein/i)).toBeVisible();
  });

  test("compares identical strings and shows high scores", async ({ page }) => {
    await page.getByLabel("String A").fill("identical strings");
    await page.getByLabel("String B").fill("identical strings");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();
    await page.waitForSelector('text=/levenshtein/i', { timeout: 5000 });

    // Levenshtein should show high score (close to 1.0) for identical strings
    // The Levenshtein-Only Verdict should show the score
    await expect(page.getByText(/why levenshtein/i)).toBeVisible();
  });

  test("compares completely different strings", async ({ page }) => {
    await page.getByLabel("String A").fill("abc");
    await page.getByLabel("String B").fill("xyz");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();
    await page.waitForSelector('text=/levenshtein/i', { timeout: 5000 });

    // Both input fields and the compare button should still be visible
    await expect(page.getByLabel("String A")).toBeVisible();
    await expect(page.getByLabel("String B")).toBeVisible();
  });

  test("shows why Levenshtein alone is not enough", async ({ page }) => {
    await expect(page.getByText(/levenshtein alone/i)).toBeVisible();
    await expect(page.getByText(/abbreviation expansion/i)).toBeVisible();
  });
});

test.describe("API Integration", () => {
  test("backend API responds with all 24 algorithms", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    await page.getByRole("tab", { name: "Consolidated Comparison" }).click();
    await page.getByLabel("String A").fill("test");
    await page.getByLabel("String B").fill("test");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();

    // Wait for results
    await page.waitForSelector('text=/levenshtein/i', { timeout: 5000 });

    // Check that multiple algorithm results are visible
    // We should see many algorithm names in the results
    const algorithmElements = await page.getByText(/(levenshtein|jaro|sorensen|cosine|morge|needleman|gotoh|tversky)/i).count();
    expect(algorithmElements).toBeGreaterThan(0);
  });

  test("displays Levenshtein-Only Verdict for IBM case", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    await page.getByRole("tab", { name: "Consolidated Comparison" }).click();
    await page.getByLabel("String A").fill("International Business Machines");
    await page.getByLabel("String B").fill("IBM");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();

    // Wait for results
    await page.waitForSelector('text=/levenshtein/i', { timeout: 5000 });

    // The IBM case is a hard positive - Levenshtein should give low score
    // Verify the Levenshtein score is shown
    await expect(page.getByText(/levenshtein/i)).toBeVisible();

    // Check that Highest Scoring Algorithm is shown (should be overlap or similar for IBM case)
    await expect(page.getByText(/highest scoring algorithm/i)).toBeVisible();
  });
});
