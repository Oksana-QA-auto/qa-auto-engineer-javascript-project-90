import { expect } from '@playwright/test'

export default class Users {
  constructor(page) {
    this.page = page

    this.headingUsers = this.page.getByRole('heading', {
      level: 6,
      name: /^(users|пользователи)$/i,
      }).first()

    this.usersTable = this.page.getByRole('table').first()

    this.createLink = this.page
      .getByRole('link', { name: /(create|создать)/i })
      .first()

    this.deleteBtn = this.page
      .getByRole('button', { name: /(delete|удалить)/i })
      .first()
  }

  getHeadingUsers() {
    return this.headingUsers
  }
  getUsersTable() {
    return this.usersTable
  }

  async ensureLoggedIn() {
    const signInBtn = this.page.getByRole('button', { name: /sign in/i }).first()

    if (await signInBtn.count()) {
      const user = this.page
        .getByRole('textbox', { name: /^username$/i })
        .first()
      const pass = this.page
        .getByRole('textbox', { name: /^password$/i })
        .first()

      await user.fill('admin')
      await pass.fill('admin')

      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        signInBtn.click(),
      ])

      await expect(signInBtn).toBeHidden({ timeout: 15000 })
      await expect(
        this.page.getByRole('menuitem', { name: /(users|пользователи)/i })
      ).toBeVisible({ timeout: 10000 })
    }
  }

  async openUsersList() {
    const usersMenuItem = this.page.getByRole('menuitem', { name: /(users|пользователи)/i }).first()
    let isMenuVisible = false
    try {
      isMenuVisible = await usersMenuItem.isVisible()
    } catch {
      isMenuVisible = false
    }

    if (isMenuVisible) {
      await usersMenuItem.click()
    } else {
      await this.page.goto('/#/users', { waitUntil: 'domcontentloaded' })
    }

    await expect(this.headingUsers).toBeVisible({ timeout: 15000 })

    const hasTable = await this.usersTable.isVisible().catch(() => false)
    if (!hasTable) {
    await expect(this.createLink).toBeVisible({ timeout: 5000 })
  }

    await this.usersTable.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
  }

  async navigateToUsersList() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
    await this.ensureLoggedIn()

    await this.page.goto('/#/users', { waitUntil: 'domcontentloaded' })
    await expect(this.headingUsers).toBeVisible({ timeout: 10000 })
    await expect(this.headingUsers).toBeVisible({ timeout: 10000 })
    await this.usersTable.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
  }

  rowByEmail(email) {
    const emailRowNamePattern = new RegExp(String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return this.usersTable.getByRole('row', { name: emailRowNamePattern }).first()
  }

  async createUser({ email, firstName, lastName }) {
    await this.openUsersList()

    await this.createLink.click()

    const emailInput = this.page.getByRole('textbox', { name: /^email$/i }).first()
    const firstInput = this.page.getByRole('textbox', { name: /(first name|имя)/i }).first()
    const lastInput = this.page.getByRole('textbox', { name: /(last name|фамилия)/i }).first()

    await expect(emailInput).toBeVisible()
    await emailInput.fill(String(email))
    if (firstName != null) await firstInput.fill(String(firstName))
    if (lastName != null) await lastInput.fill(String(lastName))

    const saveBtn = this.page
      .getByRole('button', { name: /(create|save|создать|сохранить)/i })
      .first()

    await saveBtn.scrollIntoViewIfNeeded()

  try {
    await expect(saveBtn).toBeEnabled({ timeout: 5000 })
    await saveBtn.click()
  } catch {
    await saveBtn.click({ force: true })

    await expect(
      this.page.getByRole('heading', { name: new RegExp(String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    ).toBeVisible({ timeout: 10000 })

    await this.openUsersList()
    await expect(this.rowByEmail(email)).toBeVisible({ timeout: 10000 })

    return saveBtn
    }
  }

  async openEditFormByEmail(email) {
    await this.openUsersList()

    const userRow = this.rowByEmail(email)
    await expect(userRow).toBeVisible({ timeout: 10000 })

    const userIdCell = userRow.getByRole('cell').nth(1)
    const userIdText = (await userIdCell.textContent())?.trim()

    if (!userIdText) {
      throw new Error(`Не нашли ID для пользователя: ${email}`)
  }

    await this.page.goto(`/#/users/${userIdText}/edit`, { waitUntil: 'domcontentloaded' })

    const emailTextbox = this.page.getByRole('textbox', { name: /^email$/i }).first()
    await expect(emailTextbox).toBeVisible({ timeout: 10000 })

    return userIdText
  }

  async replaceEmail(newEmail) {
    const emailInput = this.page.getByRole('textbox', { name: /^email$/i }).first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(String(newEmail))
  }

  async removeUserByEmail(email) {
    await this.openUsersList()

    const row = this.rowByEmail(email)
    await expect(row).toBeVisible({ timeout: 10000 })

    const rowCheckbox = row.getByRole('checkbox').first()
    await rowCheckbox.check()

    await expect(this.deleteBtn).toBeEnabled({ timeout: 5000 })
    await this.deleteBtn.click()

    const dialog =
      this.page.getByRole('dialog').first() ||
      this.page.getByRole('alertdialog').first()
    const visible = await dialog.isVisible().catch(() => false)

    if (visible) {
      const confirmBtn = this.page
        .getByRole('button', { name: /(ok|confirm|подтвердить|yes|да|delete|удалить)/i })
        .first()
      await expect(confirmBtn).toBeEnabled({ timeout: 5000 })
      await confirmBtn.click()
      await expect(dialog).toBeHidden({ timeout: 10000 })
    }

    await expect(this.rowByEmail(email)).toHaveCount(0, { timeout: 10000 })
  }

  async assertUserVisible(email) {
  await this.openUsersList()
  await expect(this.rowByEmail(email)).toBeVisible({ timeout: 10000 })
  }

  async assertUserHidden(email) {
    await this.openUsersList()
    await expect(this.rowByEmail(email)).toHaveCount(0, { timeout: 10000 })
  }

  async removeUserIfExists(email) {
    await this.navigateToUsersList()
    const count = await this.rowByEmail(email).count()
    if (count > 0) {
      await this.removeUserByEmail(email)
    }
  }

  async clickSave() {
  const saveButton = this.page
    .getByRole('button', { name: /(create|save|создать|сохранить)/i })
    .first()

  await expect(saveButton).toBeVisible({ timeout: 10000 })

  if (await saveButton.isDisabled()) {
    return saveButton
  }

    await saveButton.click()
    return saveButton
  }

  async updateEmailByEmail(currentEmail, newEmail) {
    await this.openEditFormByEmail(currentEmail)
    await this.replaceEmail(newEmail)

    const saveBtn = await this.clickSave()
    await this.openUsersList()

    return saveBtn
  }

  async removeAllUsers() {
    await this.navigateToUsersList()

    const selectAll = this.usersTable
      .getByRole('row')
      .first()
      .getByRole('checkbox')
      .first()

    await selectAll.check()

    await expect(this.deleteBtn).toBeEnabled({ timeout: 5000 })
    await this.deleteBtn.click()

    const dialog =
      this.page.getByRole('dialog').first() ||
      this.page.getByRole('alertdialog').first()

    const visible = await dialog.isVisible().catch(() => false)

    if (visible) {
      const confirmBtn = this.page
        .getByRole('button', { name: /(ok|confirm|подтвердить|yes|да|delete|удалить)/i })
        .first()

      await expect(confirmBtn).toBeEnabled({ timeout: 5000 })
      await confirmBtn.click()
      await expect(dialog).toBeHidden({ timeout: 10000 })
    }
  }
}
