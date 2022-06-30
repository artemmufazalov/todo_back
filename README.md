# Бэкенд для таск-трекера

### Стек: 
* Node.js, Express
* MongoDB, mongoose
* JWT, nodemailer

## Endpoints:
### API задач:
* GET `/task/index` - получение задачи
* POST `/task/create` - создание задачи
* POST `/task/update` - изменение задачи
* POST `/task/delete` - удаление задачи

### API категорий:
* GET `/category/index` - получение категории
* POST `/category/create` - создание категории
* POST `/category/update` - изменение категории
* POST `/category/delete` - удаление категории

### API пользователя:
#### Авторизация и аутентификация:
* GET `/user/auth` - авторизация пользователя
* POST `/user/login` - аутентификация пользователя
* DELETE `/user/logout` - выход из приложения

#### Регистрация:
* POST `/user/register` - регистрация пользователя
* POST `/user/update/username` - обновление имени профиля
* DELETE `/user/delete` - удаление профиля пользователя

#### Подтверждение или отмена регистрации:
* GET `/user/verify` - подтверждение регистрации (через Email)
* DELETE `/user/verify` -  отмена регистрации (через Email подтверждения регистрации)

#### Изменение и восстановление пароля:
* POST `/user/password/change` - запрос на изменение пароля
* POST `/user/password/restore` - запрос на восстановление пароля
* PUT `/user/password/update` - изменение пароля

## Скрипты:
### `npm run dev`
Для запуска приложения локально с nodemon

### `npm run start`
Для запуска приложения в production режиме
