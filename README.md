# Backend EduPlatform

Backend-система для образовательной платформы. Проект состоит из следующих компонентов:

- **Main API** — основной сервис на NestJS с MongoDB/Mongoose, JWT-авторизацией, кэшированием в Redis и интеграцией с Kafka.
- **Image Worker** — сервис на Express, который получает сообщения из Kafka и обрабатывает изображения с помощью Sharp.
- **Инфраструктура** — MongoDB, Redis, Kafka и ZooKeeper, запускаемые через Docker Compose.

## Требования

Для запуска необходимы:

- Docker Desktop;
- Docker Compose.

Локальная установка Node.js не требуется, если проект запускается через Docker.

## Настройка переменных окружения

В корне проекта должен находиться файл `.env`:

```env
JWT_SECRET=длинный-случайный-секретный-ключ
```

Если файла `.env` ещё нет, создайте его на основе примера:

```bash
cp .env.example .env
```

Для генерации безопасного ключа можно использовать команду:

```bash
openssl rand -hex 32
```

Полученное значение необходимо записать в `JWT_SECRET`. Файл `.env` не следует добавлять в Git или передавать другим пользователям.

## Запуск проекта

Выполните из корневой директории:

```bash
docker compose up -d --build
```

При первом запуске Docker загрузит необходимые образы и установит зависимости, поэтому процесс может занять несколько минут.

После запуска доступны:

- Main API: `http://localhost:3000`;
- проверка Main API: `http://localhost:3000/health`;
- проверка Image Worker: `http://localhost:3001/health`.

Корневой адрес `http://localhost:3000/` возвращает `404`, поскольку проект является REST API и не содержит пользовательского веб-интерфейса.

Проверить состояние контейнеров:

```bash
docker compose ps
```

Остановить проект:

```bash
docker compose down
```

Остановить проект и удалить базу данных вместе с загруженными изображениями:

```bash
docker compose down -v
```

## API

Все тела запросов передаются в формате JSON, кроме загрузки изображений.

Для защищённых маршрутов необходимо передавать JWT:

```text
Authorization: Bearer <access_token>
```

| Метод | Маршрут | Доступ |
| --- | --- | --- |
| POST | `/auth/register` | Открытый |
| POST | `/auth/login` | Открытый |
| GET | `/courses` | Открытый, кэшируется в Redis |
| GET | `/courses/:id` | Открытый, кэшируется в Redis |
| POST | `/courses` | Преподаватель |
| PATCH | `/courses/:id` | Преподаватель-владелец курса |
| DELETE | `/courses/:id` | Преподаватель-владелец курса |
| POST | `/courses/:id/enroll` | Студент |
| GET | `/courses/:courseId/lessons` | Открытый |
| POST | `/courses/:courseId/lessons` | Преподаватель-владелец курса |
| PATCH | `/lessons/:id` | Преподаватель-владелец курса |
| DELETE | `/lessons/:id` | Преподаватель-владелец курса |
| POST | `/upload/courses/:courseId/cover` | Владелец курса, multipart-поле `file` |
| POST | `/upload/lessons/:lessonId/image` | Владелец курса, multipart-поле `file` |
| GET | `/upload/images/:filename` | Открытый |

Размер загружаемого файла ограничен 10 МБ. Разрешена загрузка только изображений.

## Проверка основного сценария

### 1. Регистрация преподавателя

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Преподаватель","email":"teacher@example.com","password":"secret123","role":"teacher"}'
```

### 2. Вход преподавателя

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"teacher@example.com","password":"secret123"}'
```

Скопируйте значение `access_token` из ответа и используйте его вместо `<teacher-token>`.

### 3. Создание курса

```bash
curl -X POST http://localhost:3000/courses \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <teacher-token>' \
  -d '{"title":"Backend-разработка","description":"NestJS и микросервисы"}'
```

Скопируйте значение `_id` созданного курса и используйте его вместо `<course-id>`.

### 4. Добавление урока

```bash
curl -X POST http://localhost:3000/courses/<course-id>/lessons \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <teacher-token>' \
  -d '{"title":"Введение","content":"Первый урок","order":1}'
```

### 5. Загрузка обложки курса

```bash
curl -X POST http://localhost:3000/upload/courses/<course-id>/cover \
  -H 'Authorization: Bearer <teacher-token>' \
  -F 'file=@/абсолютный/путь/к/image.jpg'
```

Сразу после загрузки изображение имеет статус `processing`.

Далее выполняется асинхронный процесс:

1. Main API сохраняет оригинал изображения.
2. Main API отправляет сообщение в топик Kafka `image.uploaded`.
3. Image Worker получает сообщение.
4. Sharp изменяет размер изображения, конвертирует его в WebP и добавляет водяной знак `EDU PLATFORM`.
5. Image Worker устанавливает статус `ready` в MongoDB.
6. Image Worker отправляет сообщение в топик `image.processed`.
7. Main API инвалидирует соответствующий кэш Redis.

Для проверки результата повторно запросите курс:

```bash
curl http://localhost:3000/courses/<course-id>
```

### 6. Регистрация студента

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Студент","email":"student@example.com","password":"secret123","role":"student"}'
```

### 7. Вход студента

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@example.com","password":"secret123"}'
```

Скопируйте полученный токен и используйте его вместо `<student-token>`.

### 8. Запись студента на курс

```bash
curl -X POST http://localhost:3000/courses/<course-id>/enroll \
  -H 'Authorization: Bearer <student-token>'
```

Повторный запрос не увеличивает количество студентов, поскольку запись выполняется атомарно.

## Архитектура

```text
Клиент
  |
  v
NestJS Main API ---- Redis
  |       |
  |       +---- image.uploaded ----+
  v                               |
MongoDB                     Express Image Worker
  ^                               |
  |       +---- image.processed ---+
  |       |
  +-------+---- обновление статуса

Main API и Image Worker используют общий Docker-том
для оригинальных и обработанных изображений.
```

## Принятые решения

- JWT содержит идентификатор пользователя и его роль.
- Guards ограничивают операции по ролям `student` и `teacher`.
- Дополнительные проверки в сервисах разрешают изменение курса и его уроков только преподавателю-владельцу.
- Список курсов и сведения о курсе кэшируются в Redis на 60 секунд.
- Кэш инвалидируется при изменении курса, записи студента, изменении уроков и завершении обработки изображения.
- Запись студента выполняется атомарно, поэтому повторный запрос не увеличивает `studentsCount`.
- Изображения обрабатываются асинхронно, а в MongoDB хранятся их URL и статус.
- При удалении курса удаляются его уроки и ссылки на курс из профилей студентов.
- При временной недоступности Redis API продолжает получать данные из MongoDB.
- Если Kafka недоступна, загрузка изображения возвращает HTTP-статус `503`.

## Локальная разработка

При наличии Node.js версии 20 или новее:

```bash
npm install
npm run build
npm test
```

Проверка сборки через Docker:

```bash
docker compose build main-api image-worker
docker compose config
```

## Диагностика

Состояние контейнеров:

```bash
docker compose ps
```

Логи Main API и Image Worker:

```bash
docker compose logs -f main-api image-worker
```

Логи всех сервисов:

```bash
docker compose logs -f
```

Проверка health-эндпоинтов:

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```
