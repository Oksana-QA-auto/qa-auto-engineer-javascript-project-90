import { test, expect } from '@playwright/test'

test('приложение рендерится: виден экран логина', async ({ page }) => {
  await page.goto('/#/login')

  await expect(page.getByLabel(/username/i)).toBeVisible()
  await expect(page.getByLabel(/password/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})


