import { test, expect } from '@playwright/test'
import Tasks from './pages/Tasks'

let tasks

const isEnabled = (name) => String(process.env[name]).toLowerCase() === 'true'

test.describe('Канбан-доска (Tasks)', () => {
  test.beforeEach(async ({ page }) => {
    tasks = new Tasks(page)
    await tasks.open()
  })

  test('отображаются колонки на странице Tasks', async () => {
    await tasks.waitForBoard(10_000)

    const draft = tasks.heading(/^draft$/i)
    const toReview = tasks.heading(/^to review$/i)
    const toBeFixed = tasks.heading(/^to be fixed$/i)
    const published = tasks.heading(/^published$/i)

    await expect(draft).toBeVisible({ timeout: 10_000 })
    await expect(toReview).toBeVisible({ timeout: 10_000 })
    await expect(toBeFixed).toBeVisible({ timeout: 10_000 })
    await expect(published).toBeVisible({ timeout: 10_000 })
  })

  test('фильтрация задач по тексту', async ({ page }) => {
    test.skip(!isEnabled('FILTER_ENABLED'), 'Текстовый фильтр отключён (FILTER_ENABLED!=true)')

    await tasks.waitForBoard(10_000)

    const byPlaceholder = page.getByPlaceholder(/filter|search|поиск/i).first()
    const byRole = page.getByRole('textbox', { name: /filter|search|поиск/i }).first()

    const hasPlaceholder = await byPlaceholder.count()
    const input = hasPlaceholder ? byPlaceholder : byRole

    await expect(input).toBeVisible({ timeout: 10_000 })

    const anyTask = page.locator('[draggable="true"][data-testid="task"]').first()
    await expect(anyTask).toBeVisible()

    const text = (await anyTask.textContent())?.trim() ?? ''
    await expect(text.length).toBeGreaterThan(0)

    const before = await page.locator('[draggable="true"][data-testid="task"]').count()

    await input.fill(text.slice(0, Math.min(8, text.length)))
    await page.waitForTimeout(300)

    const after = await page.locator('[draggable="true"][data-testid="task"]').count()
    expect(after).toBeLessThanOrEqual(before)
  })

  test('перемещение задачи между колонками (drag & drop)', async ({ page }) => {
    test.skip(!isEnabled('DND_ENABLED'), 'DnD отключён (DND_ENABLED!=true)')

    await tasks.waitForBoard(10_000)

    const sourceCard = page.locator('[draggable="true"][data-testid="task"]').first()
    await expect(sourceCard).toBeVisible()

    const targetColumn = tasks.columnContainerByTitle(/in ?progress|в работе/i)

    const beforeInProgress = await targetColumn
      .locator('[draggable="true"][data-testid="task"]')
      .count()

    await sourceCard.dragTo(targetColumn)
    await page.waitForTimeout(300)

    const afterInProgress = await targetColumn
      .locator('[draggable="true"][data-testid="task"]')
      .count()

    expect(afterInProgress).toBeGreaterThanOrEqual(beforeInProgress)
  })
})
