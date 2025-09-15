class LoginPage {
  constructor(page) {
    this.page = page
    this.username = page.getByRole('textbox', { name: /username/i }).first()
    this.password = page.getByRole('textbox', { name: /password/i }).first()
    this.submit = page.getByRole('button', { name: /sign in/i })
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })

    await Promise.race([
      this.username.waitFor({ state: 'visible' }),
      this.submit.waitFor({ state: 'visible' }),
    ])
  }

  async loginAs(user, pass) {
    await Promise.race([
      this.username.waitFor({ state: 'visible' }),
      this.submit.waitFor({ state: 'visible' }),
    ])

    await this.username.fill(String(user))
    await this.password.fill(String(pass))

    await Promise.all([
      this.page.waitForURL('**/*', { waitUntil: 'domcontentloaded' }),
      this.submit.click(),
    ])
  }
}

export default LoginPage
export { LoginPage }
