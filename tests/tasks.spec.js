import { test, expect } from '@playwright/test'
import Auth from './pages/Auth.js'
import Tasks from './pages/Tasks.js'

const makeUnique = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}`

test.describe('Kanban Tasks', () => {
  test.beforeEach(async ({ page }) => {
    const login = new Auth(page)
    await login.goto()
    await login.loginAs('tester@example.com', 'any')
  })

  test('создание задачи + отображение', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const title = `Task ${makeUnique('task')}`
    await tasks.create({
      title,
      description: 'Описание задачи',
    })

    await expect(tasks.cardByTitle(title)).toBeVisible()
  })

  test('редактирование задачи + проверка валидации заголовка', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const title = `EditMe ${makeUnique('task')}`
    await tasks.create({ title, description: 'before' })

    await tasks.openEdit(title)
    await tasks.fillForm({ title: '' })
    await tasks.submit()

    const titleError = page.getByText(/title.*(required|обязательн|не может быть пуст)/i)
      .or(page.locator('[name*="title" i][aria-invalid="true"]'))
    await expect(titleError.first()).toBeVisible()

    const newTitle = `Edited ${makeUnique('task')}`
    await tasks.fillForm({ title: newTitle, description: 'after' })
    await tasks.submit()

    await expect(tasks.cardByTitle(newTitle)).toBeVisible()
  })

  test('перемещение задачи между колонками', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const title = `Move ${makeUnique('task')}`
    await tasks.create({ title })

    await tasks.move(title, 'In Progress')
  })

  test('фильтрация: поиск по тексту и по статусу', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const filterTitleA = `FilterA ${makeUnique('task')}`
    const filterTitleB = `FilterB ${makeUnique('task')}`
    await tasks.create({ title: filterTitleA })
    await tasks.create({ title: filterTitleB })

    await tasks.filterByText('FilterA')
    await expect(tasks.cardByTitle(filterTitleA)).toBeVisible()
    await expect(tasks.cardByTitle(filterTitleB)).toHaveCount(0)

    await tasks.filterByText('')
    await tasks.filterByStatus('To Do')
  })

  test('удаление одной задачи', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const victim = `DelOne ${makeUnique('task')}`
    await tasks.create({ title: victim })
    await tasks.delete(victim)
  })

  test('массовое удаление задач (select all)', async ({ page }) => {
    const tasks = new Tasks(page)
    await tasks.open()

    const bulkTitleA = `BulkA ${makeUnique('task')}`
    const bulkTitleB = `BulkB ${makeUnique('task')}`
    await tasks.create({ title: bulkTitleA })
    await tasks.create({ title: bulkTitleB })

    await tasks.selectAll()
    await tasks.bulkDeleteSelected()

    await expect(tasks.cardByTitle(bulkTitleA)).toHaveCount(0)
    await expect(tasks.cardByTitle(bulkTitleB)).toHaveCount(0)
  })
})
