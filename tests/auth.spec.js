import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Header from './pages/Header'

test('авторизация с произвольными данными проходит', async ({ page }) => {
  const auth = new Auth(page)
  const header = new Header(page)

  await auth.goto()
  await auth.loginAs('qa_user', 'any_password')
  await expect(header.profileBtn).toBeVisible()
})

test('выход возвращает на экран входа', async ({ page }) => {
  const auth = new Auth(page)
  const header = new Header(page)

  await auth.goto()
  await auth.loginAs('qa_user', 'any_password')
  await header.signOut()

  await expect(auth.submit).toBeVisible()
})
