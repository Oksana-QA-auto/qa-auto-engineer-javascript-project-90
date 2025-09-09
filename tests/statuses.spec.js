import { test, expect } from '@playwright/test'
import LoginPage from './pages/LoginPage'
import StatusesPage from './pages/StatusesPage'

const uniq = () => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

test.beforeEach(async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.loginAs('qa_user', 'any_password')
})

test('Statuses › создание и отображение в списке', async ({ page }) => {
  const statuses = new StatusesPage(page)
  await statuses.goto()

  const name = `Status s_${uniq()}`
  const slug = `slug-st_${uniq()}`

  await statuses.openCreate()
  await statuses.fillStatus({ name, slug })
  await statuses.save()

  await statuses.assertRowVisible(name, slug)
})

test('Statuses › редактирование информации', async ({ page }) => {
  const statuses = new StatusesPage(page)
  await statuses.goto()

  const name = `Status s_${uniq()}`
  const slug = `slug-st_${uniq()}`

  await statuses.openCreate()
  await statuses.fillStatus({ name, slug })
  await statuses.save()
  await statuses.assertRowVisible(name)

  await statuses.openEdit(name)
  const newSlug = `slug-st_${uniq()}`
  await statuses.slug.fill(newSlug)
  await statuses.save()

  await statuses.assertRowVisible(name, newSlug)
})

test('Statuses › удаление одного статуса', async ({ page }) => {
  const statuses = new StatusesPage(page)
  await statuses.goto()

  const name = `Status s_${uniq()}`
  const slug = `slug-st_${uniq()}`

  await statuses.openCreate()
  await statuses.fillStatus({ name, slug })
  await statuses.save()
  await statuses.assertRowVisible(name)

  await statuses.deleteOneByName(name)
  await expect(statuses.rowByName(name)).toHaveCount(0)
})

test('Statuses › массовое удаление (select all)', async ({ page }) => {
  const statuses = new StatusesPage(page)
  await statuses.goto()

  const created = []
  for (const _ of [1, 2]) {
    const name = `Bulk ${uniq()}`
    const slug = `bulk-${uniq()}`
    await statuses.openCreate()
    await statuses.fillStatus({ name, slug })
    await statuses.save()
    created.push(name)
  }

  await statuses.deleteAll()

  for (const name of created) {
    await expect(statuses.rowByName(name)).toHaveCount(0)
  }
})
