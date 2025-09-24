import { expect } from '@playwright/test'

export class Header {
  constructor(page) {
    this.page = page

    this.profileBtn = page.getByRole('button', {
      name: /(profile|профиль|account|user|пользователь)/i,
    })

    this.logoutMenuItem = page.getByRole('menuitem', {
      name: /(logout|sign out|выход)/i,
    })
    this.logoutButton = page.getByRole('button', {
      name: /(logout|sign out|выход)/i,
    })
  }

  async openUserMenu() {
    await this.profileBtn.click()
    await this.logoutMenuItem.first().waitFor({ state: 'visible' }).catch(() => {})
  }

  async signOut() {
    await this.openUserMenu()

    const target = (await this.logoutMenuItem.count())
      ? this.logoutMenuItem.first()
      : this.logoutButton.first()

    await target.click()

    await expect(this.page).toHaveURL(/#\/login/)
  }
}

export default Header
