# Ledgerly expense platform

Ledgerly is an AI-assisted expense reimbursement platform with a React frontend, Node/Express API, PostgreSQL data store, and Python receipt-analysis service.

## Live website

The currently deployed Ledgerly interface is available at:

https://ledgerly-expense.bharadwajreddy1406.chatgpt.site

> The hosted interface is public. Running the complete expense workflow locally also requires the API, PostgreSQL, and AI service described below.

## Project status

- API: authentication, claims, receipt analysis, approval workflow, policy management, notifications, and payment recording.
- Web: API-backed sign-in, claim submission, receipt upload, manager review, finance review, and reimbursement actions.
- Deployment: the public interface is linked above; the complete workflow requires the accompanying API and database services.

## Local setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and replace the JWT secrets.
2. Start PostgreSQL and the AI service: `docker compose up -d postgres ai`.
3. With Node.js 22+ installed, run `npm install`, then `npm run prisma:generate --workspace=@expense/api` and `npm run prisma:migrate --workspace=@expense/api`.
4. Add demo users with `npm run prisma:seed --workspace=@expense/api`.
5. Start all services with `npm run dev`.

The web app runs on port 5173, the API on port 4000, and receipt intelligence on port 8000.

## Core API routes

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `GET|POST /expenses`, `GET|PUT|DELETE /expenses/:id`, `POST /expenses/:id/submit`
- `POST /receipts/items/:itemId` and `PUT /receipts/:id/correction`
- `POST /claims/:id/manager/{approve,reject,return,clarify}`
- `POST /claims/:id/finance/{approve,reject,return,override}`
- `POST /claims/:id/payment`
- `/management/policies`, `/management/departments`, `/management/notifications`, `/management/dashboard`, `/management/audit-logs`

All routes other than registration, login, refresh, and health require an `Authorization: Bearer <access-token>` header.

`GET /openapi.json` exposes a machine-readable API overview suitable for Swagger UI or an API client.
