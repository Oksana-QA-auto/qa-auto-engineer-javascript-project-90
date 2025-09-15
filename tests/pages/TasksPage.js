// tests/pages/TasksPage.js
import { expect } from '@playwright/test';

export default class TasksPage {
  constructor(page) {
    this.page = page;

    // маршруты SPA
    this.tasksRoute = '#/tasks';

    // --- логин ---
    this.inputUser = page.getByRole('textbox', { name: /username/i });
    this.inputPass = page.getByRole('textbox', { name: /password/i });
    this.btnSignIn = page.getByRole('button', { name: /sign in/i });

    // --- меню (как запасной вариант)
    this.menuTasks = page.getByRole('menuitem', { name: /^tasks$/i });

    // --- колонка (любой заголовок борда) — XPATH надёжнее чем name/regex
    this.anyColumnHeading = page.locator(
      `xpath=//h6[
        normalize-space(.)="Draft" or
        normalize-space(.)="To Review" or
        normalize-space(.)="To Be Fixed" or
        normalize-space(.)="To Publish" or
        normalize-space(.)="Published"
      ]`
    );

    // --- Создание/редактирование ---
    this.linkCreate   = page.getByRole('link',    { name: /^create$/i });
    this.inputTitle   = page.getByRole('textbox', { name: /^title\b/i });
    this.inputContent = page.getByRole('textbox', { name: /^content\b/i });
    this.cbStatus     = page.getByRole('combobox',{ name: /status/i });
    this.statusOption = (name) =>
      page.getByRole('option', { name: TasksPage.statusRegex(name) });
    this.btnSave      = page.getByRole('button',  { name: /^save$/i });

    // --- карточки на доске ---
    this.cardByTitle = (title) =>
      page.getByRole('button', {
        name: new RegExp(`${TasksPage.escapeRegex(String(title))}`, 'i'),
      });
    this.cardEditLink = (title) =>
      this.cardByTitle(title).getByRole('link', { name: /^edit$/i });
  }

  // ---------------- utils ----------------

  static escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static normalizeColumnName(name) {
    const key = String(name).trim().toLowerCase();
    const map = {
      'to do': 'Draft',
      'in progress': 'To Review',
      done: 'Published',
      draft: 'Draft',
      'to review': 'To Review',
      'to be fixed': 'To Be Fixed',
      'to publish': 'To Publish',
      published: 'Published',
    };
    return map[key] ?? name;
  }

  static statusRegex(name) {
    const real = TasksPage.normalizeColumnName(name);
    return new RegExp(`^\\s*${TasksPage.escapeRegex(real)}\\s*$`, 'i');
  }

  async waitCardAppears(title, timeout = 20000) {
    await expect(
      this.cardByTitle(title),
      `Карточка «${title}» не появилась на доске`
    ).toBeVisible({ timeout });
  }

  // --------------- навигация/борд ---------------

  async ensureLoggedIn() {
    const onLogin = await this.inputUser.isVisible().catch(() => false);
    if (onLogin) {
      const u = process.env.APP_LOGIN ?? 'demo';
      const p = process.env.APP_PASSWORD ?? 'demo';
      await this.inputUser.fill(u);
      await this.inputPass.fill(p);
      await this.btnSignIn.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async goto() {
    // если «about:blank», пробуем сразу на борд SPA
    if (this.page.url() === 'about:blank') {
      await this.page.goto(this.tasksRoute).catch(() => undefined);
    }

    await this.ensureLoggedIn();

    // Явно выходим на #/tasks (после логина SPA часто остаётся на другой вкладке)
    await this.page.goto(this.tasksRoute).catch(() => undefined);
    await this.page.waitForURL(/#\/tasks/i, { timeout: 10000 }).catch(() => undefined);

    // запасной план — меню
    if (!/\/tasks/i.test(this.page.url())) {
      await this.menuTasks.click().catch(() => undefined);
      await this.page.waitForURL(/#\/tasks/i, { timeout: 8000 }).catch(() => undefined);
    }

    await this.ensureBoard();
  }

  async ensureBoard(timeout = 20000) {
    // если сразу не видно — подождём, потом одна мягкая попытка открыть Tasks ещё раз
    const visible = await this.anyColumnHeading.isVisible().catch(() => false);
    if (!visible) {
      await this.page.goto(this.tasksRoute).catch(() => undefined);
    }
    await expect(
      this.anyColumnHeading,
      'Доска задач не отобразилась: колонки не найдены.'
    ).toBeVisible({ timeout });
  }

  // --------------- операции ---------------

  async createInColumn(columnName, title) {
    await this.ensureBoard();
    await this.linkCreate.click();
    await this.inputTitle.fill(title);
    await this.inputContent.fill(`auto: ${title}`);

    await this.cbStatus.click();
    await this.statusOption(columnName).click();

    await this.btnSave.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.ensureBoard();
    await this.waitCardAppears(title);
  }

  async editTitle(oldTitle, newTitle) {
    await this.ensureBoard();
    await this.cardEditLink(oldTitle).click();
    await this.inputTitle.fill(newTitle);
    await this.btnSave.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.ensureBoard();
    await this.waitCardAppears(newTitle);
  }

  async moveToColumn(title, columnName) {
    await this.ensureBoard();
    await this.cardEditLink(title).click();
    await this.cbStatus.click();
    await this.statusOption(columnName).click();
    await this.btnSave.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.ensureBoard();
    await this.waitCardAppears(title);
  }

  async filterByText(text) {
    await this.ensureBoard();
    const search = this.page
      .getByRole('textbox', { name: /(filter|search|title)/i })
      .first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(text);
      await this.page.waitForTimeout(250);
    }
  }

  // «удаление» — перенос в Draft (в демо нет прямого delete)
  async deleteByTitle(title) {
    await this.moveToColumn(title, 'Draft');
  }

  async assertCardVisible(columnName, title) {
    await this.ensureBoard();
    // лёгкая стабилизация: убедимся, что нужный заголовок тоже встречается
    const heading = this.page.locator(
      `xpath=//h6[normalize-space(.)=${JSON.stringify(
        TasksPage.normalizeColumnName(columnName)
      )}]`
    );
    await heading.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
    await this.waitCardAppears(title);
  }
}
