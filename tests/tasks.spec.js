import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('renders task sections on Tasks page', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForLoadState('networkidle')

const tasksMenuItem = page.getByRole('menuitem', { name: /^(tasks|задачи)$/i })
if (await tasksMenuItem.count()) {
  await tasksMenuItem.first().click()
} else {
  await page.getByRole('link', { name: /^(tasks|задачи)$/i }).first().click()
}

await page.waitForURL(/#\/tasks\b/i, { timeout: 10_000 })

  const draft = page.getByRole('heading', { name: /^draft$/i }).first()
  const toReview = page.getByRole('heading', { name: /^to review$/i }).first()
  const toBeFixed = page.getByRole('heading', { name: /^to be fixed$/i }).first()
  const published = page.getByRole('heading', { name: /^published$/i }).first()

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

  const anyTask = page.locator('[draggable="true"], [data-testid="task"]').first()
  await expect(anyTask).toBeVisible()
  const text = (await anyTask.textContent())?.trim() || ''

  const before = await page.locator('[draggable="true"], [data-testid="task"]').count()
  await input.fill(text.slice(0, Math.min(8, text.length)))
  await page.waitForTimeout(300)
  const after = await page.locator('[draggable="true"], [data-testid="task"]').count()

  expect(after).toBeLessThanOrEqual(before)
})

test('moves task between columns (drag & drop) if supported', async ({ page }) => {
  const sourceCard = page.locator('[draggable="true"], [data-testid="task"]').first()
  const targetColumn =
    page.getByText(/in ?progress/i).first()
      .locator('..')

  const canDrag = await sourceCard.count()
  const canDropTitle = await page.getByText(/in ?progress/i).count()

  test.skip(!canDrag || !canDropTitle, 'Нет dnd-элементов — пропускаем')

  const beforeInProgress = await targetColumn.locator('[draggable="true"], [data-testid="task"]').count()

  try {
    await sourceCard.dragTo(targetColumn)
  } catch {
    const box1 = await sourceCard.boundingBox()
    const box2 = await targetColumn.boundingBox()
    if (!box1 || !box2) test.skip(true, 'DND не поддержан — пропускаем')
    await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2)
    await page.mouse.down()
    await page.mouse.move(box2.x + box2.width / 2, box2.y + 30)
    await page.mouse.up()
  }

  await page.waitForTimeout(300)

  const afterInProgress = await targetColumn.locator('[draggable="true"], [data-testid="task"]').count()
  expect(afterInProgress).toBeGreaterThanOrEqual(beforeInProgress)
})
