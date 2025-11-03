// tests/pages/Auth.js

export default class Auth {
  constructor(page) {
    this.page = page;

    this.username = page
      .getByRole('textbox', { name: /username|e-mail|email|логин/i })
      .first();

    this.password = page
      .getByRole('textbox', { name: /password|пароль/i })
      .first()
      .or(page.locator('input[type="password"]').first());

    this.submit = page
      .getByRole('button', { name: /sign in|log in|login|войти/i })
      .first()
      .or(page.locator('button[type="submit"]').first());
  }

  async goto() {
    await this.page.goto('/');
    await Promise.race([
      this.username.waitFor({ state: 'visible' }).catch(() => {}),
      this.submit.waitFor({ state: 'visible' }).catch(() => {}),
    ]);
  }

  async loginAs(email, password) {
    await this.goto();

    if (await this.username.isVisible().catch(() => false)) {
      await this.username.fill(String(email));
    }
    if (await this.password.isVisible().catch(() => false)) {
      await this.password.fill(String(password));
    }

    await this.submit.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

