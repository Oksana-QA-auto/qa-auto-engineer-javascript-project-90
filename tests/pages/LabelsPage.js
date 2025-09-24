import { expect } from '@playwright/test';

const esc = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default class LabelsPage {
  constructor(page) {
    this.page = page;

    // Навигация и основные элементы списка
    this.menuLabels = page.getByRole('menuitem', { name: /^labels$/i });
    this.headingLabels = page.getByRole('heading', { name: /^labels$/i });

    // Действия
    this.linkCreate = page.getByRole('link', { name: /^create$/i });
    this.saveBtn   = page.getByRole('button', { name: /^save$/i });
    this.deleteBtn = page.getByRole('button', { name: /^delete$/i });

    // Поля формы
    this.name = page.getByRole('textbox', { name: /^name$/i });

    // Таблица/чекбоксы (могут отсутствовать при пустом списке)
    this.table    = page.getByRole('table');
    this.selectAll = page.getByRole('checkbox', { name: /select all/i });
  }

  // ————————— Навигация / состояние списка —————————

  async ensureOnList() {
    await this.page.waitForLoadState('domcontentloaded');

    // Если заголовок не виден — пытаемся оказаться на странице labels
    if (!(await this.headingLabels.first().isVisible().catch(() => false))) {
      if (!/#\/labels/.test(this.page.url())) {
        await this.page.goto('/#/labels', { waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      // если есть пункт меню — попробуем кликнуть
      if (!(await this.headingLabels.first().isVisible().catch(() => false))) {
        await this.menuLabels.click().catch(() => {});
      }
    }

    // Ждём только заголовок. Таблица может отсутствовать при пустом списке.
    await this.headingLabels.first().waitFor({ state: 'visible' });
  }

  async goto() {
    if (!/#\/labels/.test(this.page.url())) {
      await this.page.goto('/#/labels', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    await this.ensureOnList();
  }

  // ————————— Формы —————————

  async openCreate() {
    await this.ensureOnList();
    await this.linkCreate.click();
    // Ждём поле формы — это стабильнее, чем ждать кнопку Save
    await this.name.waitFor({ state: 'visible' });
  }

  async openEdit(name) {
    // кликаем по строке с нужным именем, открываем форму
    const row = this.rowByName(name);
    await row.click();
    await this.name.waitFor({ state: 'visible' });
  }

  async fillLabel({ name }) {
    if (name !== undefined) await this.name.fill(name);
  }

  async save() {
    await this.saveBtn.click();
    await this.ensureOnList();
  }

  // ————————— Поиск строк и проверки —————————

  rowByName(name) {
    const nameRegex = new RegExp(`\\b${esc(name)}\\b`, 'i');
    return this.page.getByRole('row', { name: nameRegex });
  }

  async assertRowVisible(name) {
    const row = this.rowByName(name);
    await expect(row).toBeVisible();
  }

  // ————————— Удаления —————————

  async deleteOneByName(name) {
    const row = this.rowByName(name);
    await row.getByRole('checkbox').check();
    await this.deleteBtn.click();
    await this.ensureOnList();
  }

  async deleteAll() {
    // если чекбокс "select all" есть — делаем массовое удаление
    if (await this.selectAll.isVisible().catch(() => false)) {
      await this.selectAll.check();
      await this.deleteBtn.click();
    } else {
      // если таблицы/чекбоксов нет — уже пусто, ничего не делаем
    }
    await this.ensureOnList();
  }
}

export { LabelsPage };
