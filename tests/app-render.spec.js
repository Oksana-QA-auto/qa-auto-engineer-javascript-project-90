import { test, expect } from '@playwright/test'

test('приложение успешно рендерится', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')

  const root = page.locator('#root')
  await expect(root).toBeVisible()

  const childCount = await root.evaluate((el) => el.childElementCount)
  expect(childCount).toBeGreaterThan(0)

  expect(consoleErrors, `Ошибки консоли: \n${consoleErrors.join('\n')}`).toHaveLength(0)
})
