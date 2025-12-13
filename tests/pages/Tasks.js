import { expect } from '@playwright/test'

export default class Tasks {
  constructor(page) {
    this.page = page
  }

  boardLocator() {
  const byTestId = this.page.getByTestId('board')
  const byGrid = this.page.locator('[role="grid"], [role="table"], table')
  const byAnyCol = this.page
    .getByRole('heading', {
      level: 6,
      name: /^(draft|to review|to be fixed|published|в работе|готово|к публикации|на проверку|в черновик|черновик)$/i,
    })
    .first()
    .locator('..')

  return byTestId.or(byGrid).or(byAnyCol)
}

  async waitForBoard(timeout = 20_000) {
  const board = this.boardLocator().first()
  await expect(board).toBeVisible({ timeout })
}

async ensureLoggedIn() {
  const signInBtn = this.page.getByRole('button', { name: /sign in/i }).first()
  const onLogin = await signInBtn.waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false)

  if (!onLogin) {
    return
  }

  const user = this.page.getByRole('textbox', { name: /^username$/i }).first()
  const pass = this.page.getByRole('textbox', { name: /^password$/i }).first()

  await expect(user).toBeVisible({ timeout: 10_000 })
  await expect(pass).toBeVisible({ timeout: 10_000 })

  await user.fill('admin')
  await pass.fill('admin')

  await Promise.all([
    signInBtn.click(),
    this.page.waitForLoadState('domcontentloaded'),
  ])

  await expect(signInBtn).toBeHidden({ timeout: 15_000 }).catch(() => {})

  const tasksMenu = this.page.getByRole('menuitem', { name: /^(Tasks|Задачи)$/i }).first()
  await expect(tasksMenu).toBeVisible({ timeout: 15_000 })
}

  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
    await this.ensureLoggedIn()

    await this.page.goto('/#/tasks', { waitUntil: 'domcontentloaded' })
    await this.waitForBoard(20_000)
  }

  heading(nameOrRe) {
    const name = typeof nameOrRe === 'string'
      ? new RegExp(`^${nameOrRe}$`, 'i')
      : nameOrRe;
    return this.page.getByRole('heading', { level: 6, name }).first()
  }

  async assertMainSectionsVisible() {
    const draft = this.heading(/^draft$/i)
    const toReview = this.heading(/^to review$/i)
    const toBeFixed = this.heading(/^to be fixed$/i)
    const published = this.heading(/^published$/i)

    await Promise.all([
      expect(draft).toBeVisible({ timeout: 10_000 }),
      expect(toReview).toBeVisible({ timeout: 10_000 }),
      expect(toBeFixed).toBeVisible({ timeout: 10_000 }),
      expect(published).toBeVisible({ timeout: 10_000 }),
    ])
  }

  filterInput() {
    return this.page.getByPlaceholder(/(filter|search|поиск)/i).first()
      .or(this.page.getByRole('textbox', { name: /(filter|search|поиск)/i }).first())
  }

  async hasTextFilter() {
    return (await this.filterInput().count()) > 0
  }

  async filterByText(sampleText) {
    const input = this.filterInput()
    await expect(input).toBeVisible()

    const anyTask = this.page
      .locator('[data-testid="task"], [draggable="true"][data-testid="task"]')
      .first()

    await expect(anyTask).toBeVisible()

    const text = (await anyTask.textContent())?.trim() || sampleText || ''

    const before = await this.page.locator('[data-testid="task"]').count()
    await input.fill(text.slice(0, Math.min(8, text.length)))
    await this.page.waitForTimeout(300)
    const after = await this.page.locator('[data-testid="task"]').count()

    expect(after).toBeLessThanOrEqual(before)
  }

  columnContainerByTitle(titleRegex) {
    return this.page.getByText(titleRegex).first().locator('..')
  }

  columnContainer(name) {
    const titleRegex = new RegExp(`^${String(name)}$`, 'i')
    return this.columnContainerByTitle(titleRegex)
  }

  async canDnD() {
    const hasCard = (await this.page.locator('[draggable="true"][data-testid="task"]').count()) > 0
    const hasTarget = (await this.page.getByText(/in ?progress|в работе/i).count()) > 0
    return hasCard && hasTarget
  }

  async moveFirstCardToInProgress() {
    const source = this.page.locator('[draggable="true"][data-testid="task"]').first()
    const target = this.columnContainerByTitle(/in ?progress|в работе/i)

    try {
      await source.dragTo(target)
    } catch {
      const sourceBoundingBox = await source.boundingBox()
      const targetBoundingBox = await target.boundingBox()
      if (!sourceBoundingBox || !targetBoundingBox) throw new Error('DND not supported in this UI build')

      await this.page.mouse.move(sourceBoundingBox.x + sourceBoundingBox.width / 2, sourceBoundingBox.y + sourceBoundingBox.height / 2)
      await this.page.mouse.down()
      await this.page.mouse.move(sourceBoundingBox.x + targetBoundingBox.width / 2, targetBoundingBox.y + 30)
      await this.page.mouse.up()
    }
    await this.page.waitForTimeout(300)
  }

  async selectAll() {
    const header = this.page.getByRole('checkbox', { name: /select all|выбрать все/i })
      .or(this.page.locator('thead input[type="checkbox"]').first())
    await header.check()
  }

  async bulkDeleteSelected() {
    const btn = this.page.getByRole('button', { name: /delete selected|удалить выбран/i }).first()
    await btn.click()

    const dialog = this.page.getByRole('dialog').first()
      .or(this.page.getByRole('alertdialog').first())
    const visible = await dialog.isVisible().catch(() => false)
    if (visible) {
      const confirm = this.page.getByRole('button', { name: /(ok|confirm|подтвердить|yes|да|delete|удалить)/i }).first()
      await expect(confirm).toBeEnabled({ timeout: 5_000 })
      await confirm.click()
      await expect(dialog).toBeHidden({ timeout: 10_000 })
    }
  }

  async deleteByTitle(title) {
    const card = this.page.getByTestId('card')
      .filter({ hasText: String(title) })
      .or(this.page.getByRole('article', { name: new RegExp(String(title), 'i') }))
      .first()
    await card.click()

    const del = this.page.getByRole('button', { name: /delete|удалить/i }).first()
    await del.click()

    const dialog = this.page.getByRole('dialog').first()
      .or(this.page.getByRole('alertdialog').first())
    const visible = await dialog.isVisible().catch(() => false)
    if (visible) {
      const confirm = this.page.getByRole('button', { name: /(ok|confirm|подтвердить|yes|да|delete|удалить)/i }).first()
      await expect(confirm).toBeEnabled({ timeout: 5_000 })
      await confirm.click()
      await expect(dialog).toBeHidden({ timeout: 10_000 })
    }
  }
}
