export class Header {
  constructor(page) {
    this.page = page
  }

  async openUserMenuIfAny() {
    const triggers = [
      this.page.getByRole('button', { name: /user menu|profile|account|menu/i }),
      this.page.getByLabel(/user menu|profile|account/i),
      this.page.locator('button[aria-label*="profile" i], button[title*="profile" i]'),
    ]
    for (const t of triggers) {
      if (await t.count()) { await t.first().click(); return true; }
    }
    return false
  }

  async logout() {
    await this.openUserMenuIfAny().catch(() => undefined)

    const candidates = [
      this.page.getByRole('menuitem', { name: /logout|sign out|выйти/i }),
      this.page.getByRole('button',   { name: /logout|sign out|выйти/i }),
      this.page.getByRole('link',     { name: /logout|sign out|выйти/i }),
      this.page.getByText(/^logout$|^sign out$|^выйти$/i),
    ]
    for (const c of candidates) {
      if (await c.count()) { await c.first().click(); return; }
    }

    await this.page.evaluate(() => {
      try { sessionStorage.clear(); } catch (e) { void e; }
      try { localStorage.clear(); } catch (e) { void e; }
    })
    await this.page.goto('/#/login')
  }
}



 
