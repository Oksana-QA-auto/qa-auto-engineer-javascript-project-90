import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'

function uniq(prefix = 'u', info = test.info()) {
  return `${prefix}_${Date.now()}_${info.workerIndex}_${Math.floor(Math.random() * 1e6)}`
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
  const last = 'Smith'

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

  await expect(users.rowByEmail('not-an-email')).toHaveCount(0)

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

  const email1 = `${uniq('bulk1')}@example.com`
  const email2 = `${uniq('bulk2')}@example.com`

  for (const [e, i] of [[email1, 1], [email2, 2]]) {
    await users.openCreate()
    await users.fillUser({ email: e, firstName: `Bulk${i}`, lastName: 'Temp' })
    await users.save()
  }

  await users.deleteAll()

  await expect(users.rowByEmail(email1)).toHaveCount(0)
  await expect(users.rowByEmail(email2)).toHaveCount(0)
})
