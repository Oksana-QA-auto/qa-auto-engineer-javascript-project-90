// tests/pages/UsersPage.js
import { expect } from '@playwright/test';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default class UsersPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Навигация/хедеры
    this.menuUsers     = page.getByRole('menuitem', { name: /^users$/i });
    this.headingUsers  = page.getByRole('heading',  { name: /^users$/i });

    // Кнопки/ссылки
    this.linkCreate = page.getByRole('link',   { name: /^create$/i });
    this.saveBtn    = page.getByRole('button', { name: /^save$/i });
    this.deleteBtn  = page.getByRole('button', { name: /^delete$/i });

    // Поля формы
    this.email     = page.getByRole('textbox', { name: /^email$/i });
    this.firstName = page.getByRole('textbox', { name: /^first name$/i });
    this.lastName  = page.getByRole('textbox', { name: /^last name$/i });

    // Таблица
    this.table    = page.getByRole('table');
    this.selectAll = page.getByRole('checkbox', { name: /select all/i });
  }

  // Гарантируем, что мы действительно на списке Users
  async ensureOnList() {
    await this.page.waitForLoadState('domcontentloaded');

    // Если заголовка не видно – пробуем все варианты добраться до списка
    if (!(await this.headingUsers.first().isVisible().catch(() => false))) {
      // 1) Пробуем перейти на адрес списка (хеш-роутер)
      if (!/#\/users/.test(this.page.url())) {
        await this.page.goto('/#/users', { waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      // 2) Если всё ещё нет — кликаем пункт меню Users
      if (!(await this.headingUsers.first().isVisible().catch(() => false))) {
        await this.menuUsers.click();
      }
    }

    // Итоговые ожидания (тут уже без fallback)
    await this.headingUsers.first().waitFor({ state: 'visible' });
    await this.table.first().waitFor({ state: 'visible' });
  }

  async goto() {
    // Всегда приходим в Users «без героизма»
    if (!/#\/users/.test(this.page.url())) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }
    await this.ensureOnList();
  }

  async openCreate() {
    await this.ensureOnList();
    await this.linkCreate.click();
    await this.email.waitFor({ state: 'visible' });
  }

  async fillUser({ email, firstName, lastName }) {
    await this.email.fill(email);
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
  }

  async save() {
    await this.saveBtn.click();
    await this.ensureOnList(); // после сохранения возвращаемся и ждём список
  }

  rowByEmail(email) {
    const rx = new RegExp(`\\b${esc(email)}\\b`, 'i');
    return this.page.getByRole('row', { name: rx });
  }

  async assertRowVisible(email, firstName, lastName) {
    const row = this.rowByEmail(email);
    await expect(row).toBeVisible();
    if (firstName) await expect(row).toContainText(firstName);
    if (lastName)  await expect(row).toContainText(lastName);
  }

  async deleteOneByEmail(email) {
    const row = this.rowByEmail(email);
    await row.getByRole('checkbox').check();
    await this.deleteBtn.click();
    await this.ensureOnList();
  }

  async deleteAll() {
    await this.selectAll.check();
    await this.deleteBtn.click();
    await this.ensureOnList();
  }

  async openEdit(email) {
    const row = this.rowByEmail(email);
    await row.click();
    await this.email.waitFor({ state: 'visible' });
  }

  async dataRowCount() {
    // Приблизительный счётчик строк данных
    return await this.page.locator('table >> tbody >> tr').count().catch(() => 0);
  }
}

export { UsersPage };
