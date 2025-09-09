export class LoginPage {
  constructor(page) {
    this.page = page
    this.username = page.getByRole('textbox',  { name: /^username$/i })
    this.password = page.getByRole('textbox',  { name: /^password$/i })
    this.submit   = page.getByRole('button',   { name: /^sign in$/i })
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
  }

  async ensureForm() {
    await this.username.first().waitFor({ state: 'visible' })
  }

  async loginAs(user, pass) {
    await this.goto()
    await this.ensureForm()
    await this.username.fill(user)
    await this.password.fill(pass)

    await Promise.race([
      this.page.waitForURL('**/*', { waitUntil: 'domcontentloaded' }),
      this.submit.click().then(() => this.page.waitForTimeout(50)),
    ])
  }
}
