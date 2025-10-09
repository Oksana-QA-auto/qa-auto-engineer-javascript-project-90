import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Users from './pages/Users.js'
import { uniqEmail } from './utils.js'

test.beforeEach(async ({ page }) => {
  const login = new Auth(page)
  await login.goto()
  await login.loginAs('qa_user', 'any_password')

  const users = new Users(page)
  await users.goto()
})

test('создание пользователя и отображение в списке', async ({ page }) => {
  const users = new Users(page)

  const email = uniqEmail(test.info())
  const first = 'Alice'
  const last = 'Smith'

  await users.openCreate()
  await users.fillUser({ email, firstName: first, lastName: last })
  await users.save()

  await users.assertRowVisible(email, first, last)
})

test('редактирование пользователя и валидация email', async ({ page }) => {
  const users = new Users(page)

  const email = uniqEmail(test.info())
  await users.openCreate()
  await users.fillUser({ email, firstName: 'Bob', lastName: 'Brown' })
  await users.save()
  await expect(users.rowByEmail(email)).toBeVisible()

  await users.openEdit(email)
  await users.email.fill('not-an-email')
  await users.saveBtn.click()
  await expect(users.saveBtn).toBeVisible()

  await expect(users.rowByEmail('not-an-email')).toHaveCount(0)

  const fixed = uniqEmail(test.info(), 'fixed')
  await users.email.fill(fixed)
  await users.save()
  await expect(users.rowByEmail(fixed)).toBeVisible()
})

test('удаление одного пользователя', async ({ page }) => {
  const users = new Users(page)

  const email = uniqEmail(test.info())
  await users.openCreate()
  await users.fillUser({ email, firstName: 'Carl', lastName: 'Stone' })
  await users.save()

  await expect(users.rowByEmail(email)).toBeVisible()
  await users.deleteOneByEmail(email)
  await expect(users.rowByEmail(email)).toHaveCount(0)
})

test('массовое удаление пользователей (select all)', async ({ page }) => {
  const users = new Users(page)

  const email1 = uniqEmail(test.info(), 'bulk1')
  await users.openCreate()
  await users.fillUser({ email: email1, firstName: 'Bulk1', lastName: 'Temp' })
  await users.save()

  const email2 = uniqEmail(test.info(), 'bulk2')
  await users.openCreate()
  await users.fillUser({ email: email2, firstName: 'Bulk2', lastName: 'Temp' })
  await users.save()

  await users.deleteAll()

  await expect(users.rowByEmail(email1)).toHaveCount(0)
  await expect(users.rowByEmail(email2)).toHaveCount(0)
})
