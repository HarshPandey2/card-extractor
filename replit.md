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
- **Auth**: JWT (jsonwebtoken) + bcryptjs, role-based (user/admin)

## Project: Visiting Card Information Extractor

A web app where users upload or scan visiting cards and extract structured information using AI.

### Features
- Upload front/back of visiting cards (drag & drop or file browse)
- Live camera capture (WebRTC)
- Single-sided and double-sided card extraction
- AI extraction via Gemini 2.5 Flash
- Editable extracted data fields
- Download as JSON or CSV
- User authentication (signup/login via email+password)
- Protected routes — unauthenticated users redirected to login
- Admin dashboard: view/search/delete all cards + manage users
- Role-based access control (user vs admin)

### Auth System
- **Token key**: `authToken` in localStorage
- **JWT payload**: `{ id, email, role }`
- **Admin credentials**: `admin@cardextractor.com` / `admin123` (role = admin in DB)
- **Regular users**: self-register at `/signup`
- **Routes**: `/login`, `/signup`, `/` (protected), `/admin` (admin-only)

### Frontend Pages
- `/login` — Login with email + password
- `/signup` — Create new account
- `/` — Card extraction (protected, any auth user)
- `/admin` — Admin dashboard with Cards + Users tabs (admin-only)

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
| POST | /api/auth/signup | Register new user | None |
| POST | /api/auth/login | Login, returns JWT | None |
| GET | /api/auth/me | Get current user profile | JWT |
| POST | /api/extract | Extract card info from image(s) | JWT |
| GET | /api/cards | List user's own extracted cards | JWT |
| DELETE | /api/cards/:id | Delete user's own card | JWT |
| GET | /api/admin/cards | List all cards (all users) | JWT+Admin |
| DELETE | /api/admin/cards/:id | Delete any card | JWT+Admin |
| GET | /api/admin/users | List all users with card counts | JWT+Admin |

## Database Schema

### `users` table
- `id` — serial primary key
- `name` — text
- `email` — text unique
- `password_hash` — text (bcryptjs)
- `role` — text ('user' | 'admin'), default 'user'
- `created_at` — timestamp

### `cards` table
- `id` — serial primary key
- `user_id` — FK → users.id (nullable for legacy)
- `data` — jsonb (CardData: name, phones, emails, company, designation, address, website)
- `front_image_base64`, `back_image_base64` — stored image data
- `created_at` — timestamp

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini API proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini API key (auto-provisioned)
- `SESSION_SECRET` — JWT signing secret
- `PORT` — Server port (auto-assigned)

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for card extraction and admin management.

- Routes: `auth.ts`, `cards.ts`, `extract.ts`, `admin/cards.ts`, `admin/users.ts`
- Middleware: `auth.ts` — `requireAuth` (any JWT), `requireAdmin` (admin role)
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-gemini-ai`

### `artifacts/card-extractor` (`@workspace/card-extractor`)

React+Vite frontend.

- Pages: `Login.tsx`, `Signup.tsx`, `Home.tsx` (extraction), `AdminDashboard.tsx`
- Context: `AuthContext.tsx` — user/token state + login/logout helpers
- Hooks: `use-admin.ts` — admin card/user data with auth headers

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/users.ts` — users table
- `src/schema/cards.ts` — cards table with userId FK
- `drizzle.config.ts` — Drizzle Kit config

Run migrations: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/integrations-gemini-ai` (`@workspace/integrations-gemini-ai`)

Gemini AI SDK client + batch utilities + image generation.
