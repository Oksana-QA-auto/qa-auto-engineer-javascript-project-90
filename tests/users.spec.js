import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Users from './pages/Users.js'
import { usersFx } from './fixtures/users.js'

test.beforeEach(async ({ page }) => {
  const login = new Auth(page)
  await login.goto()
  await login.loginAs('qa_user', 'any_password')

  const users = new Users(page)
  await users.openUsersList()
})

test('создание пользователя и отображение в списке', async ({ page }) => {
  const users = new Users(page)
  const { email, firstName, lastName } = usersFx.create

  await users.removeUserIfExists(email)
  await users.createUser({ email, firstName, lastName })
  await users.assertUserVisible(email)
})

test('редактирование пользователя и валидация email', async ({ page }) => {
  const users = new Users(page)
  const data = usersFx.editEmail

  await users.removeUserIfExists(data.email)
  await users.removeUserIfExists(data.fixedEmail)

  await users.createUser({ email: data.email, firstName: data.firstName, lastName: data.lastName })
  await users.assertUserVisible(data.email)

  await users.openEditFormByEmail(data.email)
  await users.replaceEmail(data.invalidEmail)

  const saveBtn = await users.clickSave()

  await expect(saveBtn).toBeVisible()
  await users.assertUserHidden(data.invalidEmail)

  await users.updateEmailByEmail(data.email, data.fixedEmail)
  await users.assertUserVisible(data.fixedEmail)
})

test('удаление одного пользователя', async ({ page }) => {
  const users = new Users(page)
  const { email, firstName, lastName } = usersFx.deleteOne

  await users.removeUserIfExists(email)
  await users.createUser({ email, firstName, lastName })
  await users.assertUserVisible(email)

  await users.removeUserByEmail(email)
  await users.assertUserHidden(email)
})

test('массовое удаление пользователей (select all)', async ({ page }) => {
  const users = new Users(page)
  const { user1, user2 } = usersFx.bulk

  await users.removeUserIfExists(user1.email)
  await users.removeUserIfExists(user2.email)

  await users.createUser(user1)
  await users.createUser(user2)

  await users.removeAllUsers()

  await users.assertUserHidden(user1.email)
  await users.assertUserHidden(user2.email)
})
