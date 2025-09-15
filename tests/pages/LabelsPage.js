import { expect } from '@playwright/test'

export default class LabelsPage {
  constructor(page) {
    this.page = page
    this.menuLabels = () =>
      this.page
        .getByRole('menuitem', { name: /labels/i })
        .or(this.page.getByRole('link', { name: /labels/i }))
        .or(this.page.locator('nav :is(a,button,div,span)', { hasText: /labels/i }).first())

    this.createTrigger = () =>
      this.page
        .getByRole('link', { name: /^(create|create label)$/i })
        .or(this.page.getByRole('button', { name: /^(create|create label)$/i }))
        .or(this.page.locator('a:has-text("Create")'))
        .or(this.page.locator('button:has-text("Create")'))

    this.inputName = () =>
      this.page.getByLabel(/^name$/i).or(this.page.getByRole('textbox', { name: /^name$/i }))
    this.inputSlug = () =>
      this.page.getByLabel(/^slug$/i).or(this.page.getByRole('textbox', { name: /^slug$/i }))

    this.buttonSave = () => this.page.getByRole('button', { name: /^save$/i })

    this.tableByRole = () => this.page.getByRole('table')
    this.tableByTag = () => this.page.locator('table')

    this.checkboxSelectAll = () => this.page.getByRole('checkbox', { name: /select all/i })
    this.buttonDelete = () => this.page.getByRole('button', { name: /^delete$/i })
  }

  async _firstExisting(factories, timeoutMs = 5000, mustBeVisible = false) {
    let lastCaught = null
    for (const factory of factories) {
      const loc = typeof factory === 'function' ? factory() : factory
      try {
        await loc.first().waitFor({
          state: mustBeVisible ? 'visible' : 'attached',
          timeout: timeoutMs,
        })
        return loc.first()
      } catch (caught) {
        lastCaught = caught
      }
    }
    const details = lastCaught ? ` Подробности: ${String(lastCaught)}` : ''
    throw new Error(`Не удалось найти ни один из ожидаемых локаторов.${details}`)
  }

  _escape(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  async table() {
    return this._firstExisting(
      [this.tableByRole.bind(this), this.tableByTag.bind(this)],
      8000,
      true
    )
  }

  async ensureOnList() {
    const table = await this.table()
    await expect(table).toBeVisible({ timeout: 10000 })
    return table;
  }

  async rowByName(visibleName) {
    const table = await this.table()
    const matcher = new RegExp(`\\b${this._escape(visibleName)}\\b`, 'i')
    return table.locator('tbody tr').filter({ has: this.page.getByRole('cell', { name: matcher }) }).first()
  }

  async checkboxByName(visibleName) {
    const row = await this.rowByName(visibleName)
    return row.getByRole('checkbox').first()
  }

  async assertRowVisible(visibleName, optionalSlug) {
    const row = await this.rowByName(visibleName)
    await expect(row).toBeVisible({ timeout: 10000 })
    if (optionalSlug !== undefined && optionalSlug !== null) {
      await expect(row).toContainText(String(optionalSlug))
    }
  }

  async goto() {
    const alreadyOnList =
      (await this.tableByRole().first().isVisible().catch(() => false)) ||
      (await this.tableByTag().first().isVisible().catch(() => false))
    if (alreadyOnList) return

    const navItem = await this.menuLabels()
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => this.menuLabels())
      .catch(() => null)
    if (navItem) {
      await navItem.click()
      await this.ensureOnList()
      return
    }

    await this.page.goto('/labels')
    await this.ensureOnList()
  }

  async openCreate() {
    await this.ensureOnList()
    const trigger = await this._firstExisting([this.createTrigger.bind(this)], 6000, true)
    await trigger.click()

    const anyField = await this._firstExisting(
      [this.inputName.bind(this), this.inputSlug.bind(this)],
      6000,
      true
    ).catch(() => null)

    if (!anyField) {
      await this.page.waitForTimeout(250)
      const secondTry = await this._firstExisting(
        [this.inputName.bind(this), this.inputSlug.bind(this)],
        6000,
        true
      ).catch(() => null)

      if (!secondTry) {
        throw new Error('Форма создания не открылась: поля Name/Slug не найдены.')
      }
    }
  }

  async fillLabel(nameValue, slugValue) {
    const primary = await this._firstExisting(
      [this.inputName.bind(this), this.inputSlug.bind(this)],
      5000,
      true
    )
    await primary.fill(String(nameValue))

    if (slugValue !== undefined && slugValue !== null) {
      const slugInput = await this._firstExisting([this.inputSlug.bind(this)], 3000, false).catch(
        () => null
      )
      if (slugInput) await slugInput.fill(String(slugValue))
    }
  }

  async save() {
    const saveBtn = this.buttonSave()
    await expect(saveBtn).toBeEnabled({ timeout: 10000 })
    await saveBtn.click()
    await this.ensureOnList()
  }

  async create(nameValue, slugValue) {
    await this.openCreate()
    await this.fillLabel(nameValue, slugValue)
    await this.save()
    await this.assertRowVisible(String(nameValue), slugValue)
  }

  async deleteOneBySelection(visibleName) {
    await this.ensureOnList()
    const checkbox = await this.checkboxByName(visibleName)
    await expect(checkbox).toBeVisible({ timeout: 10000 })
    await checkbox.check({ timeout: 10000 })

    const deleteBtn = this.buttonDelete()
    await expect(deleteBtn).toBeEnabled({ timeout: 10000 })
    await deleteBtn.click()
    await this.ensureOnList()
  }

  async deleteAll() {
    await this.ensureOnList()

    const selectAll = this.checkboxSelectAll()
    if (await selectAll.isVisible().catch(() => false)) {
      await selectAll.check()
    } else {
      const table = await this.table()
      const checkboxes = table.locator('tbody tr input[type="checkbox"]')
      const count = await checkboxes.count()
      for (let i = 0; i < count; i += 1) {
        await checkboxes.nth(i).check()
      }
    }

    const deleteBtn = this.buttonDelete()
    await expect(deleteBtn).toBeEnabled({ timeout: 10000 })
    await deleteBtn.click()
    await this.ensureOnList()
  }

  async _findRowAcrossPages(visibleName, maxJumps = 10) {
    const firstTry = await this.rowByName(visibleName)
    if (await firstTry.isVisible().catch(() => false)) return firstTry

    const next = this.page.getByRole('link', { name: /^next$/i }).or(
      this.page.getByRole('button', { name: /^next$/i })
    )

    for (let step = 0; step < maxJumps; step += 1) {
      if (!(await next.isVisible().catch(() => false))) break
      await next.click()
      const candidate = await this.rowByName(visibleName)
      if (await candidate.isVisible().catch(() => false)) return candidate
    }
    return null
  }
}
