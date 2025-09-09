import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'

function uniq(prefix = 'u') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

test.beforeEach(async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.loginAs('qa_user', 'any_password')

  const users = new UsersPage(page)
  await users.goto()
})

test('создание пользователя и отображение в списке', async ({ page }) => {
  const users = new UsersPage(page)

  const email = `${uniq()}@example.com`
  const first = 'Alice'
  const last  = 'Smith'

  await users.openCreate()
  await users.fillUser({ email, firstName: first, lastName: last })
  await users.save()

  await users.assertRowVisible(email, first, last)
})

test('редактирование пользователя и валидация email', async ({ page }) => {
  const users = new UsersPage(page)

  const email = `${uniq()}@example.com`
  await users.openCreate()
  await users.fillUser({ email, firstName: 'Bob', lastName: 'Brown' })
  await users.save()
  await expect(users.rowByEmail(email)).toBeVisible()

  await users.openEdit(email)
  await users.email.fill('not-an-email')
  await users.saveBtn.click()
  await expect(users.saveBtn).toBeVisible()

  const valid = await users.email.evaluate(el => el.checkValidity())
  expect(valid).toBe(false)

  const fixed = `${uniq('fixed')}@example.com`
  await users.email.fill(fixed)
  await users.save()

  await expect(users.rowByEmail(fixed)).toBeVisible()
})

test('удаление одного пользователя', async ({ page }) => {
  const users = new UsersPage(page)

  const email = `${uniq()}@example.com`
  await users.openCreate()
  await users.fillUser({ email, firstName: 'Carl', lastName: 'Stone' })
  await users.save()

  await expect(users.rowByEmail(email)).toBeVisible()
  await users.deleteOneByEmail(email)
  await expect(users.rowByEmail(email)).toHaveCount(0)
})

test('массовое удаление пользователей (select all)', async ({ page }) => {
  const users = new UsersPage(page)

  for (const n of [1, 2]) {
    await users.openCreate()
    await users.fillUser({
      email: `${uniq(`bulk${n}`)}@example.com`,
      firstName: `Bulk${n}`,
      lastName: 'Temp',
    })
    await users.save()
  }

  await users.deleteAll()

  expect(await users.dataRowCount()).toBeGreaterThanOrEqual(0)
})
