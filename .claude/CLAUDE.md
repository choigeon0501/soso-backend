# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Development (local)
npm run start:local          # APP_ENV=local, watch mode

# Build
npm run build                # nest build → ./dist

# Lint & Format
npm run lint                 # ESLint with auto-fix
npm run format               # Prettier (150 printWidth, single quotes, trailing commas)

# Tests
npm run test                 # Unit tests (Jest, *.spec.ts in src/)
npm run test -- --testPathPattern=users  # Run single test file by pattern
npm run test:e2e             # E2E tests
```

## Architecture

NestJS monolith with three API domains, all under global prefix `octomo/v1`:

- **Internal API** (`/octomo/v1/internal/...`) — JWT-authenticated endpoints for dashboard users (auth, users, payments, mail)
- **Open API** (`/octomo/v1/public/...`) — API-key-authenticated endpoints for external consumers (message)
- **External** — Outbound service integrations (mo-queue for message queue)

### Databases

- **MongoDB** (primary) via Mongoose — user data, subscriptions, payments, applications
- **MySQL/PostgreSQL** (external, read-only) via TypeORM — named connection `externalDB`, pool limit 5

### Auth

- **Internal**: JWT access token (Bearer header, 1h) + refresh token (HTTP-only cookie, 72h). Guards: `JwtAuthGuard`, `JwtRefreshGuard`. Custom `@GetUserId()` decorator extracts user ID from JWT payload.
- **Open API**: API key in header (`Octomo {API_KEY}`). Guard: `OctomoApiKeyAuthGuard` — validates key, checks app status, enforces plan-based rate limits.
- **Rate limiting**: ThrottlerGuard globally — Internal: 100 req/10s, Open API: 10 req/10s.

### Module Pattern

Each domain module follows this structure:
```
module/
├── module.controller.ts
├── service/ or services/
├── repository/ or repositories/    # Mongoose InjectModel wrappers
├── dto/
│   ├── request/
│   └── response/
├── guard/
└── schema/                         # Mongoose schemas with @Schema/@Prop decorators
```

### Plan System

Users have plans (FREE/PRO/ENTERPRISE) that gate:
- Monthly API call limits (10k / 100k / unlimited)
- Application count limits (1 / 10 / unlimited)
- Service access (PHONE_AUTH, VOTE, SURVEY, CUSTOM)

### Key Globals

- **ExceptionFilter** (`src/common/filter/`) — global error handler, logs to Winston daily-rotate files
- **LoggerService** (`src/common/logger/`) — Winston with daily rotation, 30-day retention
- **SlackService** (`src/common/slack/`) — notification webhooks
- **ValidationPipe** — global, with `whitelist: true` and `transform: true`
- **Swagger** — served at `/octomo/docs`

### Config

Environment loaded from `.env.${APP_ENV}` via ConfigModule (global). Access values with `ConfigService.get()` / `getOrThrow()`.

### Payments

PortOne SDK integration for billing. Webhook handling for payment events. Subscription lifecycle management with plan downgrade on expiry.
