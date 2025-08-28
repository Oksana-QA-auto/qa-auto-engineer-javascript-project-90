export class LoginPage {
  constructor(page) {
    this.page = page
    this.user = page.getByLabel(/username/i)
    this.pass = page.getByLabel(/password/i)
    this.submit = page.getByRole('button', { name: /sign in/i })
  }

  async goto() {
    await this.page.goto('/#/login')
  }

  async login(username = 'admin', password = 'admin') {
    await this.user.fill(username)
    await this.pass.fill(password)
    await this.submit.click()
  }

  async expectVisible() {
    await Promise.all([
      this.user.waitFor(),
      this.pass.waitFor(),
      this.submit.waitFor(),
    ])
  }
}

 
