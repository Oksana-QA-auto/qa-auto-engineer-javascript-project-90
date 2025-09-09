import { expect } from '@playwright/test'

const escapeRegExp = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export class UsersPage {
  constructor(page) {
    this.page = page

    this.headingUsers  = page.getByRole('heading', { name: /^users$/i })

    this.linkCreate    = page.getByRole('link',   { name: /^create$/i })
    this.saveBtn       = page.getByRole('button', { name: /^save$/i })
    this.deleteBtn     = page.getByRole('button', { name: /^delete$/i })

    this.email     = page.getByRole('textbox', { name: /^email$/i })
    this.firstName = page.getByRole('textbox', { name: /^first name$/i })
    this.lastName  = page.getByRole('textbox', { name: /^last name$/i })

    this.table     = page.getByRole('table')
    this.selectAll = page.getByRole('checkbox', { name: /select all/i })

    this.menuUsers = page.getByRole('menuitem', { name: /^users$/i })
  }

  async goto() {
    if (!/\/users(\/|$)/.test(this.page.url())) {
      await this.page.goto('/users', { waitUntil: 'domcontentloaded' })
    }
    await this.ensureOnList()
  }

  async ensureOnList() {
    await this.headingUsers.first().waitFor({ state: 'visible' })
    await this.table.first().waitFor({ state: 'visible' })
  }

  async openCreate() {
    await this.linkCreate.click()
    await this.email.first().waitFor({ state: 'visible' })
  }

  async fillUser({ email, firstName, lastName }) {
    if (email !== undefined)     await this.email.fill(String(email))
    if (firstName !== undefined) await this.firstName.fill(String(firstName))
    if (lastName !== undefined)  await this.lastName.fill(String(lastName))
  }

  async save() {
    await this.saveBtn.click()
    await this.page.goto('/users', { waitUntil: 'domcontentloaded' })
    await this.ensureOnList()
  }

  async create(user) {
    await this.openCreate()
    await this.fillUser(user)
    await this.save()
  }

  rowByEmail(email) {
    const rx = new RegExp(`\\b${escapeRegExp(email)}\\b`, 'i')
    return this.page.getByRole('row', { name: rx })
  }

  async assertRowVisible(email, firstName, lastName) {
    const row = this.rowByEmail(email)
    await expect(row).toBeVisible()
    if (firstName) await expect(row).toContainText(firstName)
    if (lastName)  await expect(row).toContainText(lastName)
  }

  async dataRowCount() {
    return await this.page.getByRole('row', { name: /select this row/i }).count()
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
    await this.ensureOnList()
  }

  async openEdit(email) {
    const row = this.rowByEmail(email)
    await row.click()
    await this.email.first().waitFor({ state: 'visible' })
  }
}
