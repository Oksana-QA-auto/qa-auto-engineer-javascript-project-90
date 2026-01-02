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
