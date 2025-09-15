import { test } from '@playwright/test'
import TasksPage from './pages/TasksPage.js'

const uniq = () => Date.now().toString().slice(-6)

const APP_LOGIN = process.env.APP_LOGIN ?? 'demo'
const APP_PASSWORD = process.env.APP_PASSWORD ?? 'demo'

let tasks

test.describe('Tasks • канбан-доска', () => {
  test.beforeEach(async ({ page }) => {
    tasks = new TasksPage(page)

    await tasks.goto()

    const username = page.getByLabel(/^username$/i)
    const password = page.getByLabel(/^password$/i)
    if (await username.isVisible().catch(() => false)) {
      await username.fill(APP_LOGIN)
      await password.fill(APP_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await page.waitForLoadState('domcontentloaded')
    }

    await tasks.ensureBoard()
  })

  test('создание и отображение задачи в нужной колонке', async () => {
    const title = `Task ${uniq()}`
    await tasks.createInColumn('To Do', title, 'autotest')
    await tasks.assertCardVisible('To Do', title)
  })

  test('редактирование задачи (смена заголовка)', async () => {
    const original = `Task ${uniq()}`
    const updated = `${original} — edited`
    await tasks.createInColumn('To Do', original)
    await tasks.editTitle(original, updated)
    await tasks.assertCardVisible('To Do', updated)
  })

  test('перемещение задачи между колонками (To Do → In Progress → Done)', async () => {
    const title = `Task ${uniq()}`
    await tasks.createInColumn('To Do', title)
    await tasks.move(title, 'In Progress')
    await tasks.assertCardVisible('In Progress', title)
    await tasks.move(title, 'Done')
    await tasks.assertCardVisible('Done', title)
  })

  test('фильтрация задач по тексту', async () => {
    const title = `Task ${uniq()}`
    await tasks.createInColumn('To Do', title)
    await tasks.filterBy(title)
    await tasks.assertOnlyCards([title])
  })

  test('удаление одной задачи', async () => {
    const title = `Task ${uniq()}`
    await tasks.createInColumn('To Do', title)
    await tasks.delete(title)
    await tasks.assertCardNotVisible(title)
  })
})
