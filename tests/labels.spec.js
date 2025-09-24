import { test, expect } from '@playwright/test';
import LoginPage from './pages/LoginPage';
import LabelsPage from './pages/LabelsPage';

// уникальные значения с учётом параллельности
function uniq(prefix = '') {
  const { workerIndex } = test.info();
  return `${prefix}${Date.now()}_${workerIndex}_${Math.floor(Math.random() * 1e6)}`;
}

test.beforeEach(async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs('qa_user', 'any_password');
});

test('Labels • создание и отображение в списке', async ({ page }) => {
  const labels = new LabelsPage(page);
  await labels.goto();

  const name = `Label ${uniq()}`;

  await labels.openCreate();
  await labels.fillLabel({ name });
  await labels.save();

  await labels.assertRowVisible(name);
});

test('Labels • редактирование информации', async ({ page }) => {
  const labels = new LabelsPage(page);
  await labels.goto();

  const name = `Label ${uniq()}`;
  await labels.openCreate();
  await labels.fillLabel({ name });
  await labels.save();
  await labels.assertRowVisible(name);

  const newName = `${name}_edited`;
  await labels.openEdit(name);
  await labels.fillLabel({ name: newName });
  await labels.save();

  await labels.assertRowVisible(newName);
});

test('Labels • удаление одной метки', async ({ page }) => {
  const labels = new LabelsPage(page);
  await labels.goto();

  const name = `Label ${uniq()}`;
  await labels.openCreate();
  await labels.fillLabel({ name });
  await labels.save();
  await labels.assertRowVisible(name);

  await labels.deleteOneByName(name);
  await expect(labels.rowByName(name)).toHaveCount(0);
});

test('Labels • массовое удаление (select all)', async ({ page }) => {
  const labels = new LabelsPage(page);
  await labels.goto();

  const created = [];
  for (const _ of [1, 2]) {
    const name = `Label ${uniq('bulk_')}`;
    await labels.openCreate();
    await labels.fillLabel({ name });
    await labels.save();
    created.push(name);
  }

  await labels.deleteAll();

  // таблица может скрываться, если список пуст — не ждём её,
  // просто проверяем, что наши метки исчезли
  for (const name of created) {
    await expect(labels.rowByName(name)).toHaveCount(0);
  }
});

