import { test, expect } from '@playwright/test'
import LabelsPage from './pages/LabelsPage.js'

function uniq() {
  return Date.now().toString().slice(-9)
}

test.describe('Labels', () => {
  test('создание и отображение в списке', async ({ page }) => {
    const labels = new LabelsPage(page)
    await page.goto('/')
    await labels.goto()

    const name = `Label ${uniq()}`
    await labels.create(name)
    await labels.assertRowVisible(name)
  })

  test('редактирование информации', async ({ page }) => {
    const labels = new LabelsPage(page)
    await page.goto('/')
    await labels.goto()

    const name = `Label ${uniq()}`
    await labels.create(name)

    await labels.openCreate()
    const newName = `${name}_edited`
    await labels.fillLabel(newName)
    await labels.save()

    await labels.assertRowVisible(newName)
  })

  test('удаление одной метки', async ({ page }) => {
    const labels = new LabelsPage(page)
    await page.goto('/')
    await labels.goto()

    const name = `Label ${uniq()}`
    await labels.create(name)

    await labels.deleteOneBySelection(name)

    const table = await labels.ensureOnList()
    await expect(
      table
        .locator('tbody tr')
        .filter({ has: page.getByRole('cell', { name: new RegExp(`\\b${name}\\b`, 'i') }) })
        .first()
    ).toHaveCount(0)
  })

  test('массовое удаление (select all)', async ({ page }) => {
    const labels = new LabelsPage(page)
    await page.goto('/')
    await labels.goto()

    const first = `Label ${uniq()}`
    const second = `Label ${uniq()}`
    await labels.create(first)
    await labels.create(second)

    await labels.deleteAll()

    await labels.ensureOnList()
  })
})
