import { expect } from '@playwright/test'

const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default class Statuses {
  constructor(page) {
    this.page = page

    this.menuStatuses = page.getByRole('menuitem', { name: /task statuses/i })
    this.headingStatuses = page.getByRole('heading',  { name: /task statuses/i })

    this.linkCreate = page.getByRole('link', { name: /^create$/i })
    this.deleteBtn = page.getByRole('button', { name: /^delete$/i })
    this.selectAll = page.getByRole('checkbox', { name: /select all/i })

    this.tables = page.getByRole('table')

    this.emptyHint = page.getByText(/no task statuses yet/i).first()

    this.inputName = page.getByRole('textbox', { name: /^name$/i })
    this.name = this.inputName
    this.inputSlug = page.getByRole('textbox', { name: /^slug$/i })
    this.slug = this.inputSlug
    this.saveBtn = page.getByRole('button',  { name: /^save$/i })
  }

  async goto() {
    await this.menuStatuses.click()
    await this.ensureOnList()
  }

  async ensureOnList() {
    const heading = this.headingStatuses.first()

    const seen = await heading.isVisible().catch(() => false)
    if (!seen) {
      await this.menuStatuses.click()
      await this.page.waitForLoadState('domcontentloaded')
    }

    await heading.waitFor({ state: 'visible' })

    for (let i = 0; i < 40; i++) {
      const count = await this.tables.count().catch(() => 0)

      if (count > 0) {
        const table = this.tables.first()
        if (await table.isVisible().catch(() => false)) return
      } else {
        if (await this.emptyHint.isVisible().catch(() => false)) return
      }
      await this.page.waitForTimeout(250)
    }
    const table = this.tables.first()
    await expect(table).toBeVisible({ timeout: 2000 })
  }

  async openCreate() {
    await this.linkCreate.click()
    await this.inputName.waitFor({ state: 'visible' })
  }

  async openEdit(name) {
    const row = this.rowByName(name)
    await row.click()
    await this.inputName.waitFor({ state: 'visible' })
  }

  async fillStatus({ name, slug }) {
    if (typeof name === 'string') await this.inputName.fill(name)
    if (typeof slug === 'string') await this.inputSlug.fill(slug)
  }

  async save() {
    await this.saveBtn.click()
    await this.ensureOnList()
  }

  async create(status) {
    await this.openCreate()
    await this.fillStatus(status)
    await this.save()
  }

  rowByName(name) {
    const nameRegex = new RegExp(`\\b${escapeRegExp(String(name))}\\b`, 'i')
    return this.page.getByRole('row', { name: nameRegex })
  }

  async assertRowVisible(name, slug) {
    const row = this.rowByName(name)
    await expect(row).toBeVisible()
    if (slug) await expect(row).toContainText(String(slug))
  }

  async deleteOneByName(name) {
    const row = this.rowByName(name)
    await row.getByRole('checkbox').check()
    await this.deleteBtn.click()
    await this.ensureOnList()
  }

  async deleteAll() {
    const count = await this.tables.count().catch(() => 0)
    if (count === 0) return

    await this.selectAll.check()
    await this.deleteBtn.click()
    await this.ensureOnList()
  }

  async dataRowCount() {
    return this.page.getByRole('row', { name: /select this row/i }).count()
  }
}

export { Statuses }
