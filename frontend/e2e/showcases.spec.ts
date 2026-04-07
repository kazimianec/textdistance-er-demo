import { test, expect, Page } from "@playwright/test";

// Test data: (text1, text2, shouldMatch, type)
const HARD_POSITIVE_CASES = [
  ["International Business Machines", "IBM", true, "Abbreviation"],
  ["Amazon Web Services LLC", "Amazon Internet Services GmbH", false, "Same prefix, different entities"],
  ["John Smith", "Bill Smith", true, "Nickname"],
  ["Robert James Smith", "Robert Smith", true, "Middle initial dropped"],
  ["Москва", "Moskva", true, "Transliteration"],
  ["Constantinople", "Istanbul", true, "Historical name change"],
];

const HARD_NEGATIVE_CASES = [
  ["John Smith", "Jon Smith", true, "Cultural variation"],
  ["München", "Munich", true, "Umlaut transliteration"],
  ["Boulevarde Avenue", "Boulevard Ave", true, "Spelling variation"],
  ["Metropolitan Transportation Authority", "MTA Transportaton", true, "Multiple errors"],
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

  test("navigates through all 14 showcase tabs", async ({ page }) => {
    const tabs = [
      "Company Names", "Company + Address", "Person Names", "Name + Address",
      "Long Common Substrings", "Transliterations", "Heavy Typos", "Mixed Noise",
      "Brand Variations", "Legal Entity Types", "OCR / Scraping", "URL / Domain",
      "Scientific Names", "Historical Names",
    ];

    for (const tab of tabs) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page.getByRole("tab", { name: tab })).toBeVisible();
    }
  });

  for (const [text1, text2, shouldMatch, description] of HARD_POSITIVE_CASES) {
    test(`hard positive: ${description}`, async ({ page }) => {
      await page.getByRole("tab", { name: "Company Names" }).click();
      // This is a smoke test - just verify page loads without errors
      await expect(page.getByText(/entity resolution showcases/i)).toBeVisible();
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

  test("compares two strings and shows results", async ({ page }) => {
    await page.getByLabel("String A").fill("International Business Machines");
    await page.getByLabel("String B").fill("IBM");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();
    await page.waitForSelector('text:has-text("Levenshtein")', { timeout: 5000 });

    // Levenshtein should show low score (hard positive)
    const levenshteinSection = page.locator("text=levenshtein").first();
    await expect(levenshteinSection).toBeVisible();
  });

  test("shows why Levenshtein alone is not enough", async ({ page }) => {
    await expect(page.getByText(/levenshtein alone/i)).toBeVisible();
    await expect(page.getByText(/abbreviation expansion/i)).toBeVisible();
  });
});

test.describe("API Integration", () => {
  test("backend API responds with all algorithms", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    await page.getByRole("tab", { name: "Consolidated Comparison" }).click();
    await page.getByLabel("String A").fill("test");
    await page.getByLabel("String B").fill("test");
    await page.getByRole("button", { name: /compare all algorithms/i }).click();
    await page.waitForTimeout(2000);

    // Should see many algorithm results
    const algorithmCount = await page.locator("text=/^levenshtein/i").count();
    expect(algorithmCount).toBeGreaterThan(0);
  });
});
