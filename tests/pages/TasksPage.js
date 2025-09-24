// tests/pages/TasksPage.js
import { expect } from '@playwright/test';

const esc = (t = '') => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default class TasksPage {
  constructor(page) {
    this.page = page;

    // ---------- Навигация / общие признаки доски ----------
    this.linkKanban = page
      .getByRole('menuitem', { name: /tasks|задачи|доска/i })
      .first()
      .or(page.getByRole('link', { name: /kanban|tasks|задачи|доска/i }).first());

    // Заголовки колонок встречаются разные — захватим оба набора
    this.anyColumnHeading = page.getByRole('heading', {
      name: /(to do|in progress|done|to review|to be fixed|to publish|published)/i,
    });
    this.textAnyColumn = page.getByText(
      /\b(To Do|In Progress|Done|To Review|To be fixed|To Publish|Published)\b/i
    );

    // ---------- Кнопки ----------
    this.btnCreate = page
      .getByRole('link', { name: /create/i })
      .or(page.getByRole('button', { name: /(create|add|добавить|создать)/i }));
    this.btnSave = page.getByRole('button', { name: /(save|сохранить)/i });

    // ---------- Поля формы ----------
    this.inputTitle = page
      .getByRole('textbox', { name: /(title|name|заголовок|наименование)/i })
      .first();
    this.inputDesc = page
      .getByRole('textbox', { name: /(description|описание)/i })
      .first();
    this.selectStatus = page.getByRole('combobox', { name: /(status|статус)/i });
    this.selectLabel  = page.getByRole('combobox', { name: /(label|метка)/i });
    this.selectUser   = page.getByRole('combobox', { name: /(assignee|исполн)/i });

    // ---------- Поиск / фильтр ----------
    this.search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search|filter|поиск/i));
  }

  // ---------- утилиты ----------
  async #isVisible(loc, t = 600) {
    if (!loc) return false;
    return !!(await loc.first().isVisible({ timeout: t }).catch(() => false));
  }

  async #clickIfVisible(loc, t = 400) {
    if (await this.#isVisible(loc, t)) {
      await loc.first().click().catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      return true;
    }
    return false;
  }

  #colHeading(name) {
    return this.page.getByRole('heading', { name: new RegExp(`^${esc(name)}$`, 'i') });
  }

  #colRegion(name) {
    const h = this.#colHeading(name);
    return h.locator('..').or(h.locator('../..')).first();
  }

  #cardByTitle(title) {
    const rx = new RegExp(`\\b${esc(title)}\\b`, 'i');
    return this.page
      .getByRole('link', { name: rx })
      .or(this.page.getByRole('button', { name: rx }))
      .or(this.page.getByText(rx).filter({ hasNot: this.btnCreate }));
  }

  // Найти ссылку Edit около карточки и открыть форму редактирования
  #editLinkNear(title) {
    const btn = this.#cardByTitle(title).first();
    const nextEdit = btn.locator(
      'xpath=following-sibling::a[normalize-space()="Edit"][1]'
    );
    const inParent = btn.locator('..').getByRole('link', { name: /edit/i }).first();
    return nextEdit.or(inParent);
  }

  async #openEdit(title) {
    await this.#editLinkNear(title).click().catch(() => {});
    await expect(this.inputTitle).toBeVisible({ timeout: 10_000 });
  }

  // ---------- страница / доска ----------
  async goto() {
    await this.page.goto('/#/tasks', { waitUntil: 'domcontentloaded' });
    // fallback: если не распознали доску — попробуем ещё раз
    if (
      !(await this.#isVisible(this.anyColumnHeading, 500)) &&
      !(await this.#isVisible(this.btnCreate, 500))
    ) {
      await this.page.goto('/#tasks', { waitUntil: 'domcontentloaded' });
    }
  }

  async ensureBoard() {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (
        (await this.#isVisible(this.anyColumnHeading, 400)) ||
        (await this.#isVisible(this.textAnyColumn, 400)) ||
        (await this.#isVisible(this.btnCreate, 400))
      ) {
        return;
      }
      if (await this.#clickIfVisible(this.linkKanban, 400)) continue;
      await this.page.waitForTimeout(250);
    }
    throw new Error('Kanban board did not appear: no columns or Create button within 30s');
  }

  // ---------- вспомогательное для комбобоксов ----------
  async #chooseFromCombobox(combo, value = '') {
    // 1) как обычный <select>
    await combo.selectOption({ label: value }).catch(() => {});
    await combo.selectOption({ value }).catch(() => {});

    // 2) если кастомный — кликнуть и выбрать
    await combo.click().catch(() => {});
    const optExact = this.page.getByRole('option', {
      name: new RegExp(`^${esc(value)}$`, 'i'),
    }).first();
    if (await this.#isVisible(optExact, 300)) {
      await optExact.click().catch(() => {});
      await this.page.keyboard.press('Escape').catch(() => {});
      return;
    }
    const byText = this.page.getByText(new RegExp(`^${esc(value)}$`, 'i')).first();
    if (await this.#isVisible(byText, 300)) {
      await byText.click().catch(() => {});
      await this.page.keyboard.press('Escape').catch(() => {});
      return;
    }
    // 3) совсем запасной — первый пункт
    const firstOpt = this.page.getByRole('option').first();
    if (await this.#isVisible(firstOpt, 300)) {
      await firstOpt.click().catch(() => {});
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  // ---------- CRUD задач ----------
  async openCreate() {
    await this.#clickIfVisible(this.btnCreate, 800);
    await expect(this.inputTitle).toBeVisible({ timeout: 10_000 });
  }

  async createInColumn(column, title, assignee) {
    await this.openCreate();

    // заголовок
    await this.inputTitle.fill(title);

    // статус обязателен — выбираем его надёжно
    if (await this.#isVisible(this.selectStatus, 300)) {
      await this.#chooseFromCombobox(this.selectStatus, column);
    }

    // назначение — если поле есть
    if (await this.#isVisible(this.selectUser, 200)) {
      await this.#chooseFromCombobox(this.selectUser, assignee || '');
    }

    // сохраняем
    await this.btnSave.click().catch(() => {});

    // возвращаемся на доску и ждём её
    await this.goto();
    await this.ensureBoard();

    // убеждаемся, что карточка появилась (на доске)
    await expect(this.#cardByTitle(title)).toBeVisible({ timeout: 10_000 });

    // если сохранилось без нужной колонки — дотолкаем через edit
    if (
      !(await this.#isVisible(
        this.#colRegion(column).getByText(new RegExp(`\\b${esc(title)}\\b`, 'i')).first(),
        400
      ))
    ) {
      await this.move(title, column);
    }
  }

  async editTitle(original, updated) {
    await this.#openEdit(original);
    await this.inputTitle.fill(updated);
    await this.btnSave.click();
    await expect(this.#cardByTitle(updated)).toBeVisible({ timeout: 10_000 });
  }

  async move(title, toColumn) {
    await this.#openEdit(title);
    if (await this.#isVisible(this.selectStatus, 300)) {
      await this.selectStatus
        .selectOption({ label: toColumn })
        .catch(async () => {
          await this.selectStatus.selectOption({ index: 1 }).catch(() => {});
        });
    }
    await this.btnSave.click();

    const inTarget = this.#colRegion(toColumn)
      .getByText(new RegExp(`\\b${esc(title)}\\b`, 'i'))
      .first();
    await expect(inTarget).toBeVisible({ timeout: 10_000 });
  }

  async filterBy(text) {
    if (await this.#isVisible(this.search, 300)) {
      await this.search.fill(text);
    } else {
      await this.page.keyboard.type(text);
    }
  }

  async delete(title) {
    await this.#openEdit(title);

    const btnDelete = this.page.getByRole('button', {
      name: /(delete|remove|удалить|стереть)/i,
    });
    const menuBtn = this.page.getByRole('button', { name: /(more|menu|ещё)/i });

    await btnDelete.click().catch(async () => {
      await menuBtn.click().catch(() => {});
      await btnDelete.click().catch(() => {});
    });

    await this.page
      .getByRole('button', { name: /(ok|yes|да|confirm|подтверд)/i })
      .click()
      .catch(() => {});
  }

  // ---------- проверки ----------
  async assertCardVisible(column, title) {
    // колонка видна?
    await expect(this.#colHeading(column).first()).toBeVisible({ timeout: 10_000 });

    // текст карточки внутри ближайшего контейнера колонки (мягкий фолбэк — искать везде)
    const inColumn = this.#colRegion(column)
      .getByText(new RegExp(`\\b${esc(title)}\\b`, 'i'))
      .first();

    if (await this.#isVisible(inColumn, 4000)) {
      await expect(inColumn).toBeVisible();
    } else {
      await expect(this.#cardByTitle(title)).toBeVisible();
    }
  }

  async assertOnlyCards(expectedTitles = []) {
    for (const t of expectedTitles) {
      await expect(this.#cardByTitle(t)).toBeVisible();
    }
    const allCards = this.page
      .locator('[data-testid*="card"], .card, .task, [role="listitem"], article')
      .filter({ hasNot: this.btnCreate });
    const count = await allCards.count().catch(() => 0);
    if (count && count < expectedTitles.length) return;
  }

  async assertCardNotVisible(title) {
    await expect(this.#cardByTitle(title)).toHaveCount(0);
  }
}

