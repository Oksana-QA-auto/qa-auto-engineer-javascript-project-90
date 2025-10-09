import { expect } from '@playwright/test'

const esc = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default class Labels {
  constructor(page) {
    this.page = page

    this.menuLabels = page.getByRole('menuitem', { name: /^labels$/i })
    this.headingLabels = page.getByRole('heading', { name: /^labels$/i })

    this.linkCreate = page.getByRole('link', { name: /^create$/i })
    this.saveBtn = page.getByRole('button', { name: /^save$/i })
    this.deleteBtn = page.getByRole('button', { name: /^delete$/i })

    this.name = page.getByRole('textbox', { name: /^name$/i })

    this.table = page.getByRole('table')
    this.selectAll = page.getByRole('checkbox', { name: /select all/i })
  }

  async ensureOnList() {
    await this.page.waitForLoadState('domcontentloaded')

    if (!(await this.headingLabels.first().isVisible().catch(() => false))) {
      if (!/#\/labels/.test(this.page.url())) {
        await this.page.goto('/#/labels', { waitUntil: 'domcontentloaded' }).catch(() => {})
      }
      if (!(await this.headingLabels.first().isVisible().catch(() => false))) {
        await this.menuLabels.click().catch(() => {})
      }
    }

    await this.headingLabels.first().waitFor({ state: 'visible' })
  }

  async goto() {
    if (!/#\/labels/.test(this.page.url())) {
      await this.page.goto('/#/labels', { waitUntil: 'domcontentloaded' }).catch(() => {})
    }
    await this.ensureOnList()
  }

  async openCreate() {
    await this.ensureOnList()
    await this.linkCreate.click()
    await this.name.waitFor({ state: 'visible' })
  }

  async openEdit(name) {
    const row = this.rowByName(name)
    await row.click()
    await this.name.waitFor({ state: 'visible' })
  }

  async fillLabel({ name }) {
    if (name !== undefined) await this.name.fill(name)
  }

  async save() {
    await this.saveBtn.click()
    await this.ensureOnList()
  }

  rowByName(name) {
    const nameRegex = new RegExp(`\\b${esc(name)}\\b`, 'i')
    return this.page.getByRole('row', { name: nameRegex })
  }

  async assertRowVisible(name) {
    const row = this.rowByName(name)
    await expect(row).toBeVisible()
  }

  async deleteOneByName(name) {
    const row = this.rowByName(name)
    await row.getByRole('checkbox').check()
    await this.deleteBtn.click()
    await this.ensureOnList()
  }

  async deleteAll() {
    if (await this.selectAll.isVisible().catch(() => false)) {
      await this.selectAll.check()
      await this.deleteBtn.click()
    } 
    await this.ensureOnList()
  }
}

export { Labels }
