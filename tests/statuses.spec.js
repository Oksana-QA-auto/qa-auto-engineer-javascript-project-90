import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Statuses from './pages/Statuses.js'

function uniq(prefix = '') {
  const { workerIndex } = test.info()
  return `${prefix}${Date.now()}_${workerIndex}_${Math.floor(Math.random() * 1e6)}`
}

test.describe('Статусы', () => {
  test.beforeEach(async ({ page }) => {
    const login = new Auth(page)
    await login.goto()
    await login.loginAs('qa_user', 'any_password')
  })

  test('создание и отображение в списке', async ({ page }) => {
    const statuses = new Statuses(page)
    await statuses.goto()

    const name = `Status_${uniq()}`
    const slug = `slug-st_${uniq()}`

    await statuses.openCreate()
    await statuses.fillStatus({ name, slug })
    await statuses.save()

    await statuses.assertRowVisible(name, slug)
  })

  test('редактирование информации', async ({ page }) => {
    const statuses = new Statuses(page)
    await statuses.goto()

    const name = `Status_${uniq()}`
    const slug = `slug-st_${uniq()}`

    await statuses.openCreate()
    await statuses.fillStatus({ name, slug })
    await statuses.save()

    await statuses.assertRowVisible(name)

    const newSlug = `slug-st_${uniq()}`
    await statuses.openEdit(name)
    await statuses.fillStatus({ slug: newSlug })
    await statuses.save()

    await statuses.assertRowVisible(name, newSlug)
  })

  test('удаление одного статуса', async ({ page }) => {
    const statuses = new Statuses(page)
    await statuses.goto()

    const name = `Status_${uniq()}`
    const slug = `slug-st_${uniq()}`

    await statuses.openCreate()
    await statuses.fillStatus({ name, slug })
    await statuses.save()

    await statuses.assertRowVisible(name)

    await statuses.deleteOneByName(name)
    await expect(statuses.rowByName(name)).toHaveCount(0)
  })

  test('массовое удаление (select all)', async ({ page }) => {
    const statuses = new Statuses(page)
    await statuses.goto()

    const created = []

    for (let i = 0; i < 2; i += 1) {
      const name = `Status_${uniq('bulk_')}_${i}`
      const slug = `slug-st_${uniq('bulk_')}_${i}`

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
})
