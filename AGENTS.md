# Repository Guidelines

## Project Structure & Module Organization

This is an Express 5 API using ES modules and Prisma with PostgreSQL. `server.js` starts the HTTP server and imports `src/app.js`, where middleware, API routes, static assets, and AdminJS are mounted. Keep feature code under `src/`: `routes/` defines endpoints, `controllers/` holds request handlers, `middlewares/` contains reusable Express middleware, `configs/` stores database/client setup, and `utils/` stores shared helpers. Prisma schema, migrations, and seed logic live in `prisma/`. Uploaded/runtime assets are expected under `src/uploads/`; generated Prisma client output under `src/generated/prisma/` is ignored.

## Build, Test, and Development Commands

- `npm install`: install dependencies and run `prisma generate` via `postinstall`.
- `npm run dev`: start the API with `nodemon server.js` for local development.
- `npm start`: run `server.js` with Node for production-like execution.
- `npx prisma generate`: refresh Prisma client after schema changes.
- `npx prisma migrate dev`: create/apply local database migrations.
- `npx prisma studio`: inspect and edit local database records.

There is currently no `npm test` or build script configured.

## Coding Style & Naming Conventions

Use modern ES module syntax (`import`/`export`) and include `.js` extensions in local imports. Follow the existing style: 4-space indentation, double quotes, semicolons, async controller functions, and JSON responses with clear `message` or `error` fields. Name route files by domain with `Routes.js` suffix, controllers with `Controller.js`, and middleware with `Middleware.js` (for example, `productRoutes.js`, `authController.js`). Keep Prisma model names singular and PascalCase.

## Testing Guidelines

No test framework is installed yet. When adding tests, prefer integration tests for Express routes and isolate database state with a dedicated test database. Place tests near the code they cover or under a top-level `tests/` directory, using names such as `auth.test.js` or `productRoutes.test.js`. Add an `npm test` script before relying on tests in CI.

## Commit & Pull Request Guidelines

The current history uses short, imperative summaries such as `Google Auth & RBAC` and `sync push`. Keep commits concise and focused on one change. Pull requests should include a short description, database or environment changes, manual test steps, linked issues when applicable, and screenshots only for AdminJS or other UI-facing changes.

## Security & Configuration Tips

Keep `.env` out of version control. Required secrets include database and authentication settings such as `DATABASE_URL`, JWT secrets, and `GOOGLE_CLIENT_ID`. Do not commit generated files, uploads, or local database artifacts unless explicitly required.
