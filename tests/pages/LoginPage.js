export class LoginPage {
  constructor(page) {
    this.page = page
    this.username = page.getByLabel(/username/i)
    this.password = page.getByLabel(/password/i)
    this.submit   = page.getByRole('button', { name: /sign in|войти|login|log in/i })
  }

  async goto() {
    await this.page.goto('/')
  }

  async loginAs(user = 'qa_user', pass = 'any_password') {
    await this.page.evaluate(() => localStorage.clear())
    await this.page.reload()

    await this.username.fill(user)
    await this.password.fill(pass)
    await this.submit.click()
  }
}
