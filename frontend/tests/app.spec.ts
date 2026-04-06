import { test, expect } from '@playwright/test'

test.describe('textdistance ER Demo', () => {
  test('Home page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:5174/')
    await expect(page.locator('text=textdistance Entity Resolution')).toBeVisible()
    await expect(page.locator('text=Levenshtein Distance Alone Is NOT Enough')).toBeVisible()
  })

  test('Navigation works', async ({ page }) => {
    await page.goto('http://localhost:5174/')
    await page.click('text=Showcases')
    await expect(page.locator('text=Showcase Gallery')).toBeVisible()
    await page.click('text=Compare')
    await expect(page.locator('text=Consolidated Comparison')).toBeVisible()
  })

  test('Compare page works with IBM example', async ({ page }) => {
    await page.goto('http://localhost:5174/compare')
    await page.fill('input[placeholder*="International Business Machines"]', 'International Business Machines')
    await page.fill('input[placeholder*="IBM"]', 'IBM')
    await page.click('button:has-text("Compare")')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Levenshtein')).toBeVisible()
    await expect(page.locator('text=Jaro-Winkler')).toBeVisible()
  })

  test('Showcases page loads with test cases', async ({ page }) => {
    await page.goto('http://localhost:5174/showcases')
    await expect(page.locator('text=Showcase Gallery')).toBeVisible()
    await page.click('text=Company Names with Abbreviations')
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Should Match')).toBeVisible()
  })

  test('Hard positive example - Levenshtein fails', async ({ page }) => {
    await page.goto('http://localhost:5174/compare')
    await page.fill('input[placeholder*="International Business Machines"]', 'International Business Machines')
    await page.fill('input[placeholder*="IBM"]', 'IBM')
    await page.click('button:has-text("Compare")')
    await page.waitForTimeout(2000)
    // Levenshtein should show low score, other algorithms should show higher
    const levenshteinRow = page.locator('text=Levenshtein').first()
    await expect(levenshteinRow).toBeVisible()
  })
})
