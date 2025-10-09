import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import { Header } from './pages/Header'

test('авторизация с произвольными данными проходит', async ({ page }) => {
  const loginPage = new Auth(page)
  const header = new Header(page)

  await loginPage.goto()
  await loginPage.loginAs('qa_user', 'any_password')

  await expect(header.profileBtn).toBeVisible()
})

test('выход из приложения возвращает на экран входа', async ({ page }) => {
  const loginPage = new Auth(page)
  const header = new Header(page)

  await loginPage.goto()
  await loginPage.loginAs('qa_user', 'any_password')

  await header.signOut()

  await expect(loginPage.submit).toBeVisible()
})
