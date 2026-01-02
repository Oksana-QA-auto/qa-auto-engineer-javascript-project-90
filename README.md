[![hexlet-check](https://github.com/Oksana-QA-auto/qa-auto-engineer-javascript-project-90/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Oksana-QA-auto/qa-auto-engineer-javascript-project-90/actions/workflows/hexlet-check.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Oksana-QA-auto_qa-auto-engineer-javascript-project-90&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Oksana-QA-auto_qa-auto-engineer-javascript-project-90)

Тесты для приложения Kanban Board.

Цель — проверить ключевые пользовательские сценарии: авторизация, CRUD-операции над сущностями (Users, Statuses, Labels) и работу канбан-доски (Tasks).

## Что покрывают тесты:

### Авторизация
- Вход в приложение
- Выход из приложения (logout)

### Пользователи (Users)
- Создание пользователя (валидация, сохранение, отображение)
- Просмотр списка (полный рендер списка)
- Просмотр профиля
- Редактирование (изменение данных)
- Удаление одного пользователя
- Массовое удаление выбранных пользователей

### Статусы (Statuses)
- Создание
- Просмотр списка
- Редактирование
- Удаление одного статуса
- Массовое удаление статусов

### Метки (Labels)
- Создание
- Просмотр/отображение списка
- Редактирование
- Удаление одной метки
- Массовое удаление меток

### Канбан-доска (Tasks)
- Создание задачи и отображение в нужной колонке
- Редактирование (смена заголовка)
- Перемещение между колонками (например: *To Do → In Progress → Done*)
- Фильтрация задач по тексту
- Удаление одной задачи
## Что покрывают тесты

### Авторизация
- Вход в приложение
- Выход из приложения (logout)

### Пользователи (Users)
- Создание пользователя (валидация, сохранение, отображение)
- Просмотр списка (полный рендер списка)
- Просмотр профиля
- Редактирование (изменение данных)
- Удаление одного пользователя
- Массовое удаление выбранных пользователей

### Статусы (Statuses)
- Создание
- Просмотр списка
- Редактирование
- Удаление одного статуса
- Массовое удаление статусов

### Метки (Labels)
- Создание
- Просмотр/отображение списка
- Редактирование
- Удаление одной метки
- Массовое удаление меток

### Канбан-доска (Tasks)
- Создание задачи и отображение в нужной колонке
- Редактирование (смена заголовка)
- Перемещение между колонками (например: *To Do → In Progress → Done*)
- Фильтрация задач по тексту
- Удаление одной задачи


## Запуск

**Установить зависимости**
   ```bash
   npm ci
   ```
**Запуск всех тестов**
   ```bash
   npx playwright test
   ```
**Интерактивный просмотр**
   ```bash
   npx playwright test --ui
   ```
**HTML-отчет**
   ```bash
   npx playwright show-report
   ```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Список повторяющихся падений автотестов и соответствующие сценарии для ручной проверки:

Затронутые тесты:
Kanban Tasks › создание задачи + отображение,
… редактирование …, … перемещение …, … фильтрация …, … удаление …, … массовое удаление … — сыпятся каскадом из-за незавершённого создания.

Окружение: Playwright (Chromium/Firefox/WebKit), локально.
Пример запуска: npx playwright test tests/tasks.spec.js

Делаю это (шаги воспроизведения): 1) Открываю #/tasks/create. 2) Заполняю поля: Title: произвольный текст, Content: произвольный текст
(поля Status и Label не трогаю — по умолчанию пусто). 3) Нажимаю кнопку Save.

Ожидаю (ОП):

— Задача создаётся, происходит редирект на список #/tasks.
— На экране виден заголовок Tasks (role=heading, level=6) или контейнер доски data-testid="board".

Получаю (ФП)

— Остаюсь на странице Create Task.
— Возле полей Status и Label отображается метка Required.
— Редиректа на #/tasks нет, поэтому e2e падают на ожидании признаков страницы списка.

В отчёте Playwright: ошибка вида:

expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: /tasks/i, level: 6 }).or(getByTestId('board'))
Received: <element(s) not found>
Timeout: 10000ms


В page snapshot из трейса видно, что Status и Label помечены Required.
(скрины приложены в отчёте test-results/**/error-context.md и video.webm)

Комментарий/гипотеза причины:

Форма создания валидируется на обязательность Status и Label. Тест (и/или POM) эти поля не заполняет → сохранение не выполняется → нет редиректа, дальнейшие шаги ждут «Tasks/board» и падают.

Баг/флейк: подтверждение удаления (диалог) может отсутствовать

Затронутые тесты: удаление одной задачи, массовое удаление (select all).

Делаю это:

На странице #/tasks создаю одну или несколько задач. Жму Delete (или Delete selected). Ожидаю (ОП).

— Появляется диалог подтверждения (OK/Confirm/Delete).
— Нажимаю Confirm, диалог закрывается, карточка(и) исчезают.

Получаю (ФП):

— В некоторых прогоне диалога нет (или он закрывается слишком быстро), при этом тест пытается кликнуть по кнопке подтверждения и зависает/падает.
— В других прогонах диалог есть, но тест не ждёт его скрытия → следующая проверка стартует на фоне открытого диалога.

Доказательства — периодические падения на шагах confirmButton().click() или на ожидании исчезновения диалога (см. видео и error-context в test-results/**).

Что нужно для починки (в рамках проекта/тестов):

Создание: либо сделать поля Status и Label необязательными в UI, либо (проще для e2e) всегда выбирать значения по умолчанию при заполнении формы:

при отсутствии status в тесте — выбрать первую опцию в комбобоксе;

при отсутствии labels — выбрать первую метку.

Удаление: в тестах явно проверять наличие диалога перед кликом Confirm и ждать его закрытия только если он действительно появился.
Все способы починки не увенчались успехом.