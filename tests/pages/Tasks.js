import { expect } from '@playwright/test'

const escapeForRegex = (text = '') =>
  String(text).replace(/([.*+?^${}()|[\]\\])/g, '\\$&')

const exact = (text = '') => new RegExp(`^${escapeForRegex(text)}$`, 'i')

const LABEL = {
  title: /title|заголовок/i,
  description: /description|описание|content|контент/i,
  assignee: /assignee|исполнитель/i,
  status: /status|статус/i,
  label: /label|метка/i,
  search: /filter|поиск|search/i,
}

export default class Tasks {
  constructor(page) {
    this.page = page
  }

  submitButton() {
    return this.page
      .getByRole('toolbar')
      .getByRole('button', { name: /(create|save|сохранить)$/i })
  }

  confirmButton() {
    return this.page.getByRole('button', {
      name: /(ok|confirm|подтвердить|yes|да|delete|удалить)/i,
    })
  }

  async blurActiveField() {
  const clickTarget = this.page.locator('body, main').first()
  const isVisible = await clickTarget.isVisible().catch(() => false)
  if (isVisible) {
    await clickTarget.click({ position: { x: 1, y: 1 } })
  }
  await this.page.waitForTimeout(50)
}

  async closeOverlaysSoft() {
  const overlays = this.page
    .getByRole('listbox', { includeHidden: false })
    .or(this.page.getByRole('dialog', { includeHidden: false }))
    .or(this.page.locator('[aria-expanded="true"]'))

  for (let i = 0; i < 3; i += 1) {
    const openCount = await overlays.count()
    if (openCount === 0) break
    await this.page.keyboard.press('Escape')
    await this.page.waitForTimeout(50)
  }
}

  async ensureNoPopups() {
  await this.closeOverlaysSoft()
  for (let i = 0; i < 3; i += 1) {
    await this.page.keyboard.press('Escape')
    await this.page.waitForTimeout(50)
  }
  await this.blurActiveField()
}

  async open() {
    await this.page.goto('#/tasks', { waitUntil: 'domcontentloaded' })
    const headingList = this.page.getByRole('heading', { level: 6, name: /tasks/i })
    if ((await headingList.first().isVisible().catch(() => false)) === false) {
      const menuItemTasks = this.page.getByRole('menuitem', { name: /tasks/i })
      await menuItemTasks.first().click()
    }
    await this.page.waitForLoadState('domcontentloaded')
  }

  async openCreateForm() {
    await this.page.goto('#/tasks/create', { waitUntil: 'domcontentloaded' })
    await this.page
      .getByRole('textbox', { name: LABEL.title })
      .first()
      .waitFor({ state: 'visible' })
  }

  async submit() {
  await this.ensureNoPopups()

  const saveButton = this.submitButton().first()
  await expect(saveButton).toBeEnabled({ timeout: 15000 })

  await Promise.all([
    this.page.waitForURL(/#\/tasks(\/|\?|$)/, { timeout: 15000 }),
    saveButton.click(),
  ])

  await this.page.waitForLoadState('domcontentloaded')

  await expect(
    this.page.getByRole('heading', { level: 6, name: /tasks/i })
      .or(this.page.getByTestId('board'))
  ).toBeVisible({ timeout: 10000 })
}

  async fillForm({ title, description, assignee, status, labels } = {}) {
    if (title !== undefined) {
      await this.page.getByRole('textbox', { name: LABEL.title }).fill(String(title))
    }

    if (description !== undefined) {
      await this.page.getByRole('textbox', { name: LABEL.description }).fill(String(description))
    }

    if (assignee !== undefined) {
      const assigneeFilter = this.page.getByRole('combobox', { name: LABEL.assignee }).first()
      await assigneeFilter.selectOption({ label: String(assignee) }).catch(async () => {
        await assigneeFilter.fill(String(assignee))
        await this.page.keyboard.press('Enter')
      })
    }

if (status !== undefined) {
  const statusFilter = this.page
    .getByLabel(LABEL.status)
    .or(this.page.getByRole('combobox', { name: LABEL.status }))
    .first()

  await statusFilter.selectOption({ label: String(status) }).catch(async () => {
    await statusFilter.fill(String(status))
    await this.page.keyboard.press('Enter')
  })
} else {
  const statusFilter = this.page
    .getByLabel(LABEL.status)
    .or(this.page.getByRole('combobox', { name: LABEL.status }))
    .first()

  await statusFilter.click()
  await this.page.getByRole('option').first().click()
}

if (labels !== undefined) {
  const labelValues = Array.isArray(labels) ? labels : [labels]
  const labelCombobox = this.page.getByRole('combobox', { name: LABEL.label }).first()

  for (const singleLabel of labelValues) {
    await labelCombobox.click()
    const optionLocator = this.page.getByRole('option', { name: exact(String(singleLabel)) })
    await optionLocator.first().click().catch(async () => {
      await this.page.keyboard.type(String(singleLabel))
      await this.page.keyboard.press('Enter')
    })
  }
  await this.page.keyboard.press('Escape')
} else {
  const labelCombobox = this.page.getByRole('combobox', { name: LABEL.label }).first()
  await labelCombobox.click()
  await this.page.getByRole('option').first().click()
  await this.page.keyboard.press('Escape')
}

    await this.ensureNoPopups()
  }

  async create(data) {
    await this.openCreateForm()
    await this.fillForm(data)
    await this.submit()
  }

  columnContainer(columnName) {
    const headingLocator = this.page
      .getByRole('heading', { level: 6, name: exact(columnName) })
      .first()
    return headingLocator.locator('..')
  }

  cardByTitle(title) {
    const text = String(title)
    return this.page
      .getByRole('article', { name: new RegExp(escapeForRegex(text), 'i') })
      .or(this.page.getByTestId('card').filter({ hasText: text }))
      .or(this.page.locator('[role="article"]', { hasText: text }))
  }

  async openEdit(title) {
    const cardLocator = this.cardByTitle(title)
    await cardLocator.first().click()
    await this.page
      .getByRole('textbox', { name: LABEL.title })
      .first()
      .waitFor({ state: 'visible' })
  }

  async assertCardVisible(title) {
    await expect(this.cardByTitle(title)).toBeVisible()
  }

  async filterByText(searchText) {
    const filterInput = this.page
      .getByRole('textbox', { name: LABEL.search })
      .first()
      .or(this.page.getByPlaceholder(LABEL.search))

    await filterInput.fill(String(searchText))
  }

  async filterByStatus(statusName) {
    const statusFilter = this.page
      .getByLabel(LABEL.status)
      .or(this.page.getByRole('combobox', { name: LABEL.status }))

    await statusFilter.first().selectOption({ label: String(statusName) }).catch(async () => {
      await statusFilter.first().fill(String(statusName))
      await this.page.keyboard.press('Enter')
    })
  }

  async selectAll() {
    const allCheckboxes = this.page
      .getByRole('checkbox', { name: /select all|выбрать все/i })
      .or(this.page.locator('thead input[type="checkbox"]').first())
    await allCheckboxes.check()
  }

  async bulkDeleteSelected() {
    const deleteSelectedButton = this.page
      .getByRole('button', { name: /delete selected|удалить выбран/i })
      .first()

    await deleteSelectedButton.click()

    const dialog = this.page.getByRole('dialog').or(this.page.getByRole('alertdialog')).first()
    const dialogVisible = await dialog.isVisible().catch(() => false)

    if (dialogVisible) {
      const confirm = this.confirmButton().first()
      await expect(confirm).toBeEnabled({ timeout: 5000 })
      await confirm.click()
      await expect(dialog).toBeHidden({ timeout: 10000 })
    }
  }

  async delete(title) {
    const cardLocator = this.cardByTitle(title)
    await cardLocator.first().click()

    const deleteButton = this.page
      .getByRole('button', { name: /delete|удалить/i })
      .or(this.page.getByRole('button', { name: /delete|удалить/i }));
    await deleteButton.first().click()

    const dialog = this.page.getByRole('dialog').or(this.page.getByRole('alertdialog')).first()
    const dialogVisible = await dialog.isVisible().catch(() => false)

    if (dialogVisible) {
      const confirm = this.confirmButton().first()
      await expect(confirm).toBeEnabled({ timeout: 5000 })
      await confirm.click();
      await expect(dialog).toBeHidden({ timeout: 10000 })
    }

    await expect(this.cardByTitle(title)).toHaveCount(0)
  }

  async move(title, toColumnName) {
    const targetColumn = this.columnContainer(toColumnName)
    const sourceCard = this.cardByTitle(title)

    const canDragByApi = await sourceCard
      .dragTo(targetColumn)
      .then(() => true)
      .catch(() => false)

    if (canDragByApi) {
      await expect(
        targetColumn.locator('*:visible', { hasText: String(title) }).first()
      ).toBeVisible()
      return
    }

    const sourceCardBox = await sourceCard.boundingBox()
    const targetDropBox = await targetColumn.boundingBox()

    if (sourceCardBox && targetDropBox) {
      await this.page.mouse.move(
        sourceCardBox.x + sourceCardBox.width / 2,
        sourceCardBox.y + sourceCardBox.height / 2
      )
      await this.page.mouse.down()
      await this.page.mouse.move(
        targetDropBox.x + targetDropBox.width / 2,
        targetDropBox.y + 40,
        { steps: 8 }
      )
      await this.page.mouse.up()
    }

    await expect(
      targetColumn.locator('*:visible', { hasText: String(title) }).first()
    ).toBeVisible()
  }
}
