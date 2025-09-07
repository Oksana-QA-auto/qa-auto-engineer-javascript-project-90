export class Header {
  constructor(page) {
    this.page = page

    this.profileBtn = page.getByRole('button', { name: /profile/i })
    this.userMenuTrigger = this.profileBtn

    this.logoutMenuItem = page.getByRole('menuitem', { name: /logout|sign out|выход/i })
    this.logoutButton   = page.getByRole('button',   { name: /logout|sign out|выход/i })
  }

  async openUserMenu() {
    await this.profileBtn.waitFor({ state: 'visible' })
    await this.profileBtn.click()
    await this.page.getByRole('menu').waitFor({ state: 'visible' })
  }

  async signOut() {
    await this.openUserMenu()
    const hasMenuItem = await this.logoutMenuItem.count()
    const logout = hasMenuItem ? this.logoutMenuItem : this.logoutButton
    await logout.click()
  }
}
