// tests/tasks.spec.js
import { test } from '@playwright/test';
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage.js';

const uniq = () => Date.now().toString().slice(-6);

let tasks;

test.describe('Tasks • канбан-доска', () => {
  test.beforeEach(async ({ page }) => {
    // 1) Явный логин
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs('qa_user', 'any_password');

    // 2) Открываем доску и ждём колонки
    tasks = new TasksPage(page);
    await tasks.goto();
    await tasks.ensureBoard();
  });

  test('создание и отображение задачи в нужной колонке', async () => {
    const title = `Task ${uniq()}`;
    await tasks.createInColumn('Draft', title, 'autotest');
    await tasks.assertCardVisible('Draft', title);
  });

  test('редактирование задачи (смена заголовка)', async () => {
    const original = `Task ${uniq()}`;
    const updated = `${original} — edited`;
    await tasks.createInColumn('Draft', original);
    await tasks.editTitle(original, updated);
    await tasks.assertCardVisible('Draft', updated);
  });

  test('перемещение задачи между колонками (Draft → To Publish → Published)', async () => {
    const title = `Task ${uniq()}`;
    await tasks.createInColumn('Draft', title);
    await tasks.move(title, 'To Publish');
    await tasks.assertCardVisible('To Publish', title);
    await tasks.move(title, 'Published');
    await tasks.assertCardVisible('Published', title);
  });

  test('фильтрация задач по тексту', async () => {
    const title = `Task ${uniq()}`;
    await tasks.createInColumn('Draft', title);
    await tasks.filterBy(title);
    await tasks.assertOnlyCards([title]);
  });

  test('удаление одной задачи', async () => {
    const title = `Task ${uniq()}`;
    await tasks.createInColumn('Draft', title);
    await tasks.delete(title);
    await tasks.assertCardNotVisible(title);
  });
});
