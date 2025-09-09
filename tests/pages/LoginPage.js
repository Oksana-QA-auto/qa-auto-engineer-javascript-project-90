// tests/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;

    // Не привязываемся к точному совпадению имени.
    // Берём textbox по accessible name, допускаем "Username*", "Username *" и т.п.
    this.username = page.getByRole('textbox', { name: /username/i }).first();
    this.password = page.getByRole('textbox', { name: /password/i }).first();
    this.submit  = page.getByRole('button', { name: /sign in/i });
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });

    // Ждём, чтобы что-то «характерное» для логина стало видно:
    // либо поле username, либо кнопка Sign in.
    await Promise.race([
      this.username.waitFor({ state: 'visible' }),
      this.submit.waitFor({ state: 'visible' }),
    ]);
  }

  async loginAs(user, pass) {
    // На всякий случай — если редирект затянулся.
    await Promise.race([
      this.username.waitFor({ state: 'visible' }),
      this.submit.waitFor({ state: 'visible' }),
    ]);

    await this.username.fill(String(user));
    await this.password.fill(String(pass));

    // Клик + ожидание смены URL/роута SPA
    await Promise.all([
      this.page.waitForURL('**/*', { waitUntil: 'domcontentloaded' }),
      this.submit.click(),
    ]);
  }
}

export default LoginPage;
export { LoginPage };

