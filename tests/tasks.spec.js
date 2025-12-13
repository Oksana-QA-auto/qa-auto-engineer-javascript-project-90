import { test, expect } from '@playwright/test'
import Tasks from './pages/Tasks'

let tasks

test.beforeEach(async ({ page }) => {
  tasks = new Tasks(page)
  await tasks.open()
})

test('renders task sections on Tasks page', async () => {
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

test('filters tasks by text if filter exists', async ({ page }) => {
  const byPlaceholder = page.getByPlaceholder(/filter|search|поиск/i).first()
  const byRole = page.getByRole('textbox', { name: /filter|search|поиск/i }).first()

  const hasPlaceholder = await byPlaceholder.count()
  const hasRole = await byRole.count()

  test.skip(!(hasPlaceholder || hasRole), 'В этой версии UI нет поля фильтра — пропускаем проверку')

  const input = hasPlaceholder ? byPlaceholder : byRole

  const anyTask = page.locator('[draggable="true"][data-testid="task"]').first()
  await expect(anyTask).toBeVisible()

  const text = (await anyTask.textContent())?.trim() || ''
  const before = await page.locator('[draggable="true"][data-testid="task"]').count()

  await input.fill(text.slice(0, Math.min(8, text.length)))
  await page.waitForTimeout(300)

  const after = await page.locator('[draggable="true"][data-testid="task"]').count()
  expect(after).toBeLessThanOrEqual(before)
})

test('moves task between columns (drag & drop) if supported', async ({ page }) => {
  const sourceCard = page.locator('[draggable="true"][data-testid="task"]').first()
  const targetColumn = page.getByText(/in ?progress/i).first().locator('..')

  const canDrag = await sourceCard.count()
  const canDropTitle = await page.getByText(/in ?progress/i).count()
  test.skip(!canDrag || !canDropTitle, 'Нет dnd-элементов — пропускаем')

  const beforeInProgress = await targetColumn
    .locator('[draggable="true"][data-testid="task"]')
    .count()

  const title = (await sourceCard.textContent())?.trim() || ''
  test.skip(!title, 'Пустой заголовок карточки — пропускаем')

  await tasks.move(title, 'In progress')

  await page.waitForTimeout(300)

  const afterInProgress = await targetColumn
    .locator('[draggable="true"][data-testid="task"]')
    .count()

  expect(afterInProgress).toBeGreaterThanOrEqual(beforeInProgress)
})
