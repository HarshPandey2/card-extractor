# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Google Gemini 2.5 Flash (via Replit AI Integrations)

## Project: Visiting Card Information Extractor

A web app where users upload or scan visiting cards and extract structured information using AI.

### Features
- Upload front/back of visiting cards (drag & drop or file browse)
- Live camera capture (WebRTC)
- Single-sided and double-sided card extraction
- AI extraction via Gemini 2.5 Flash
- Editable extracted data fields
- Download as JSON or CSV
- Admin portal with JWT auth
- Admin dashboard to view/search/delete card records

### Admin Credentials
- **Default admin**: username `admin`, password `admin123`
- **Default superadmin**: username `superadmin`, password `super456`
- Passwords can be overridden via `ADMIN_PASSWORD` and `SUPERADMIN_PASSWORD` env vars

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── card-extractor/     # React+Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-gemini-ai/  # Gemini AI integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/healthz | Health check | None |
| POST | /api/extract | Extract card info from image(s) | None |
| POST | /api/admin/login | Admin authentication | None |
| GET | /api/admin/cards | List all extracted cards | JWT |
| DELETE | /api/admin/cards/:id | Delete a card record | JWT |

## Database Schema

### `cards` table
- `id` — serial primary key
- `name`, `company`, `designation`, `address`, `website` — text fields
- `phones`, `emails` — jsonb arrays
- `front_image_base64`, `back_image_base64` — stored image data
- `created_at` — timestamp

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini API proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini API key (auto-provisioned)
- `SESSION_SECRET` — JWT signing secret
- `ADMIN_PASSWORD` — Override default admin password (optional)
- `SUPERADMIN_PASSWORD` — Override default superadmin password (optional)
- `PORT` — Server port (auto-assigned)

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for card extraction and admin management.

- Routes: `extract.ts`, `admin/login.ts`, `admin/cards.ts`
- Middleware: `auth.ts` — JWT verification
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-gemini-ai`

### `artifacts/card-extractor` (`@workspace/card-extractor`)

React+Vite frontend with pages: Home (extraction), AdminLogin, AdminDashboard.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/cards.ts` — cards table definition
- `drizzle.config.ts` — Drizzle Kit config

Run migrations: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/integrations-gemini-ai` (`@workspace/integrations-gemini-ai`)

Gemini AI SDK client + batch utilities + image generation.
