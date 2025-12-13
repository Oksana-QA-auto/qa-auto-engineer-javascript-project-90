import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Labels from './pages/Labels.js'

function uniq(prefix = '') {
  const { workerIndex } = test.info()
  return `${prefix}${Date.now()}_${workerIndex}_${Math.floor(Math.random() * 1e6)}`
}

test.beforeEach(async ({ page }) => {
  const login = new Auth(page)
  await login.goto()
  await login.loginAs('qa_user', 'any_password')
})

test('Labels • создание и отображение в списке', async ({ page }) => {
  const labels = new Labels(page)
  await labels.goto()

  const name = `Label ${uniq()}`

  await labels.openCreate()
  await labels.fillLabel({ name })
  await labels.save()

  await labels.assertRowVisible(name)
})

test('Labels • редактирование информации', async ({ page }) => {
  const labels = new Labels(page)
  await labels.goto()

  const name = `Label ${uniq()}`
  await labels.openCreate()
  await labels.fillLabel({ name })
  await labels.save()
  await labels.assertRowVisible(name)

  const newName = `${name}_edited`
  await labels.openEdit(name)
  await labels.fillLabel({ name: newName })
  await labels.save()

  await labels.assertRowVisible(newName)
})

test('Labels • удаление одной метки', async ({ page }) => {
  const labels = new Labels(page)
  await labels.goto()

  const name = `Label ${uniq()}`
  await labels.openCreate()
  await labels.fillLabel({ name })
  await labels.save()
  await labels.assertRowVisible(name)

  await labels.deleteOneByName(name)
  await expect(labels.rowByName(name)).toHaveCount(0)
})

test('Labels • массовое удаление (select all)', async ({ page }) => {
  const labels = new Labels(page)
  await labels.goto()

  const created = [];
  for (let i = 0; i < 2; i += 1) {
  const name = `Label ${uniq('bulk_')}_${i}`
  await labels.openCreate()
  await labels.fillLabel({ name })
  await labels.save()
  created.push(name)
}

  await labels.deleteAll()

  for (const name of created) {
    await expect(labels.rowByName(name)).toHaveCount(0)
  }
})
