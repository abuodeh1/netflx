# 3-Tier Todo App

| Tier     | Tech                       | Port |
|----------|----------------------------|------|
| Frontend | React (Vite) + nginx       | 3000 |
| Auth API | Java 17 / Spring Boot      | 8081 |
| Todo API | .NET 7 minimal API/EF Core | 8082 |
| Database | PostgreSQL 16 (Docker volume `pgdata`) | 5432 |

## Run

```bash
docker compose up -d --build
```

Open http://localhost:3000

## How it works

- **auth-service** – `POST /api/auth/signup` (username, password, confirmPassword) and
  `POST /api/auth/login`. Passwords are BCrypt-hashed. Returns a JWT.
- **todo-service** – `GET/POST /api/todos`, `PUT/DELETE /api/todos/{id}`. Requires the JWT
  (`Authorization: Bearer <token>`); validated with the same shared `JWT_SECRET`.
- **Code first** – no SQL scripts. Hibernate (`ddl-auto=update`) creates the `users` table in
  `authdb`; EF Core `EnsureCreated()` creates the `todosdb` database and `todos` table.
- nginx in the frontend container routes `/api/auth/*` → Java and `/api/todos*` → .NET.

## Local frontend dev

```bash
docker compose up -d postgres auth-service todo-service
cd frontend && npm install && npm run dev   # http://localhost:3000, proxies to 8081/8082
```

## Config

Set `JWT_SECRET` (min 32 chars) in a `.env` file next to `docker-compose.yml` to override the dev default.
Reset all data: `docker compose down -v`.
