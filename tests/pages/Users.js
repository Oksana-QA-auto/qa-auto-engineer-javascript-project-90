import { expect } from '@playwright/test'

const esc = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default class Users {
  constructor(page) {
    this.page = page

    this.menuUsers = page.getByRole('menuitem', { name: /^users$/i })
    this.headingUsers = page.getByRole('heading', { name: /^users$/i })
    
    this.linkCreate = page.getByRole('link', { name: /^create$/i })
    this.saveBtn = page.getByRole('button', { name: /^save$/i })
    this.deleteBtn = page.getByRole('button', { name: /^delete$/i })

    this.email = page.getByRole('textbox', { name: /^email$/i })
    this.firstName = page.getByRole('textbox', { name: /^first name$/i })
    this.lastName = page.getByRole('textbox', { name: /^last name$/i })

    this.table = page.getByRole('table')
    this.selectAll = page.getByRole('checkbox', { name: /select all/i })
  }

  async ensureOnList() {
    await this.page.waitForLoadState('domcontentloaded')

    if (!(await this.headingUsers.first().isVisible().catch(() => false))) {
      if (!/#\/users/.test(this.page.url())) {
        await this.page.goto('/#/users', { waitUntil: 'domcontentloaded' }).catch(() => {})
      }
      if (!(await this.headingUsers.first().isVisible().catch(() => false))) {
        await this.menuUsers.click()
      }
    }

    await this.headingUsers.first().waitFor({ state: 'visible' })
    await this.table.first().waitFor({ state: 'visible' })
  }

  async goto() {
    if (!/#\/users/.test(this.page.url())) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' })
    }
    await this.ensureOnList()
  }

  async openCreate() {
    await this.ensureOnList()
    await this.linkCreate.click()
    await this.email.waitFor({ state: 'visible' })
  }

  async fillUser({ email, firstName, lastName }) {
    await this.email.fill(email)
    await this.firstName.fill(firstName)
    await this.lastName.fill(lastName)
  }

  async save() {
    await this.saveBtn.click()
    await this.ensureOnList()
  }

  rowByEmail(email) {
    const emailRegex = new RegExp(`\\b${esc(email)}\\b`, 'i')
    return this.page.getByRole('row', { name: emailRegex })
  }

  async assertRowVisible(email, firstName, lastName) {
    const row = this.rowByEmail(email)
    await expect(row).toBeVisible()
    if (firstName) await expect(row).toContainText(firstName)
    if (lastName)  await expect(row).toContainText(lastName)
  }

  async deleteOneByEmail(email) {
    const row = this.rowByEmail(email)
    await row.getByRole('checkbox').check()
    await this.deleteBtn.click()
    await this.ensureOnList()
  }

  async deleteAll() {
    await this.selectAll.check()
    await this.deleteBtn.click()
    await this.page.goto('/#/users', { waitUntil: 'domcontentloaded' })
    await this.headingUsers.first().waitFor({ state: 'visible', timeout: 30_000 })
  }

  async openEdit(email) {
    const row = this.rowByEmail(email)
    await row.click()
    await this.email.waitFor({ state: 'visible' })
  }

  async dataRowCount() {
    return await this.page.locator('table >> tbody >> tr').count().catch(() => 0)
  }
}

export { Users }
