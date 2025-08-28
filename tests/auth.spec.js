import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { Header } from './pages/Header'

test.describe('Аутентификация и выход', () => {
  test('пользователь может войти', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.expectVisible()
    await login.login('admin', 'admin')

    await expect(page).toHaveURL(/#\/(?!login)/)
    await expect(
      page.getByRole('heading', { name: /welcome to the administration/i })
).toBeVisible()
  })

  test('пользователь может выйти', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.login('admin', 'admin')

    const header = new Header(page)
    await header.logout()

    await expect(page).toHaveURL(/#\/login/)
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
})

 
