[![hexlet-check](https://github.com/Oksana-QA-auto/qa-auto-engineer-javascript-project-90/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Oksana-QA-auto/qa-auto-engineer-javascript-project-90/actions/workflows/hexlet-check.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Oksana-QA-auto_qa-auto-engineer-javascript-project-90&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Oksana-QA-auto_qa-auto-engineer-javascript-project-90)

Тесты для приложения Kanban Board.

Цель — проверить ключевые пользовательские сценарии: авторизация, CRUD-операции над сущностями (Users, Statuses, Labels) и работу канбан-доски (Tasks).

Что покрыто тестами:
1) Базовые тесты. Приложение успешно рендерится (страница открывается без ошибок, видна основная навигация/заголовок).
2) Аутентификация и авторизация. Вход в приложение (логин + пароль — бэкенд фиктивный, вход проходит по любым валидным полям). Выход из приложения (logout). Проверка, что после авторизации доступна рабочая область.
3) Пользователи (Users). Создание пользователя: форма открывается, валидация, сохранение и отображение новых данных. Просмотр списка: список полностью отрисован; у каждой строки видны основные поля (email, имя, фамилия). Редактирование: изменение данных пользователя, валидация и сохранение. Удаление: одиночное удаление выбранного пользователя. Массовое удаление: выделение всех записей и удаление пачкой.
4) Статусы (Statuses). Аналогичные сценарии: создание, просмотр списка, редактирование, удаление одного статуса, массовое удаление статусов.
5) Метки (Labels). Аналогичные сценарии (создание, просмотр/отображение, редактирование, удаление).
6) Канбан-доска (Tasks). Создание задачи и отображение в нужной колонке. Редактирование (смена заголовка). Перемещение между колонками (например: To Do → In Progress → Done). Фильтрация задач по тексту. Удаление одной задачи.

Запуск:

# установка зависимостей
npm ci

# запуск всех тестов
npx playwright test

# интерактивный просмотр
npx playwright test --ui

# HTML-отчет
npx playwright show-report

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Список повторяющихся падений автотестов и соответствующие сценарии для ручной проверки:

1) Канбан-доска не отображает колонки («колонки не найдены» / strict mode violation)

Что я делаю: логин (любой логин/пароль), переход на Tasks. Жду появления заголовков колонок («Draft», «To Review», «To Be Fixed», «To Publish», «Published»).

ОП (ожидаемое поведение): вижу на странице хотя бы один заголовок колонки (h6), доска отрендерилась.

ФП (фактическое поведение): таймаут ожидания заголовка - доска задач не отобразилась: колонки не найдены (ждём getByRole('heading', { level: 6 })...).

Либо «strict mode violation»: локатор для заголовков совпадает сразу с 5 элементами (x path возвращает несколько элементов, Playwright Strict Mode требует один). Ошибка валится в начале множества сценариев (создание/перемещение/удаление задач) и блокирует дальнейшие шаги.

2) Создание задачи: карточка «Task NNNNN» не появляется на доске.

Что я делаю: на странице Tasks жму Create. Заполняю поля (Title/Content/Status). Жму Save.

ОП: появляется карточка с заголовком Task <ид> в выбранной колонке.

ФП: таймаут: ожидание кнопки/карточки по роли getByRole('button', { name: /^Task \d+\b/i }) не срабатывает: «Карточка “Task NNNNN” не появилась на доске».

3) Перемещение задач между колонками (смена статуса) нестабильно падает.

Что я делаю: открываю существующую задачу (Edit). Меняю Status на другую колонку, Save.

ОП: карточка исчезает из старой колонки и появляется в новой.

ФП: часто воспроизводится проблема из п.1 («колонки не найдены»/strict mode). Реже — таймаут выбора опции статуса: ожидание getByRole('option', { name: /^To Do$/i }) или аналогичных значений.

4) Фильтрация задач по тексту.

Что я делаю: ввожу в поле фильтра текст, соответствующий созданной задаче. Жду появление искомой карточки.

ОП: вижу карточку «Task NNNNN», список отфильтрован.

ФП: таймаут: «Карточка “Task NNNNN” не появилась на доске» (ожидание той же кнопки/карточки по имени).

5) Users: валидация email на форме редактирования.

Что я делаю: открываю Users → Edit для любого пользователя. Делаю email заведомо некорректным (например, удаляю @ или ввожу invalid).

ОП: HTML5-валидация type="email" должна пометить поле как невалидное (el.checkValidity() === false), должна блокироваться отправка формы.

ФП: checkValidity() возвращает true (т.е. поле считается валидным), тесты падают на ожидании false.

6) Labels: список меток не отображается (таймаут ожидания table).

Что я делаю: переход в Labels. Жду отображение таблицы с метками.

ОП: вижу таблицу (role="table"/<table>), можно создавать/редактировать/удалять метки.

ФП: таймаут: waiting for locator('table').first() to be visible. Из-за этого цепочкой падают сценарии «создание и отображение в списке», «редактирование», «удаление одной метки», «массовое удаление».

7) Users: массовое удаление (select all).

Что я делаю: переход в Users. Жду список пользователей, выбираю Select all, подтверждаю удаление.

ОП: список отображён, пользователи выделяются и удаляются.

ФП: таймаут на предикате входа на список: ожидание getByRole('table').first() так и не становится visible.

Быстрый прогон проблемных тестов:

Канбан: npx playwright test tests/tasks.spec.js

Users: npx playwright test tests/users.spec.js

Labels: npx playwright test tests/labels.spec.js

В отчётах к каждому падению лежит видео: test-results/**/video.webm и error-context.md.