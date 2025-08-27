import { test, expect } from '@playwright/test'

test('логин открывает доску', async ({ page }) => {
  await page.goto('/#/login')

  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/#\/(?!login)/)
  await expect(page.getByText(/administration/i)).toBeVisible()
})


 
