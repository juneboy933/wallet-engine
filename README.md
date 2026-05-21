# Wallet Engine

A Node.js wallet service for user registration, authentication, deposits, withdrawals, transfers, transaction history, and ledger-backed balance tracking.

The project is built as a backend API reference for financial systems. It uses PostgreSQL for durable state, Prisma for data access, Redis for cache/idempotency support, JWT for authentication, and Vitest/Supertest for integration testing.

## Features

- User registration and login
- JWT-protected wallet endpoints
- Automatic wallet creation on registration
- Deposits, withdrawals, and transfers
- Idempotency key support for money-movement endpoints
- Decimal-safe amount handling
- PostgreSQL transactions with row-level wallet locking
- Ledger entries with balance-before and balance-after snapshots
- Redis wallet cache invalidation
- Health check endpoint for database and Redis connectivity
- Integration test suite with isolated test database support

## Tech Stack

- Node.js
- Express 5
- PostgreSQL
- Prisma
- Redis / ioredis
- Zod
- Argon2
- JSON Web Tokens
- Winston
- Vitest
- Supertest

## Project Structure

```text
config/         Environment, Prisma, Redis, and logger configuration
middlewares/    Auth, async handling, errors, request logging, idempotency
modules/        Feature modules for auth, wallet, and transfers
prisma/         Prisma schema and migrations
scripts/        Utility scripts, including test database migration
tests/          Integration tests and test helpers
utils/          Shared utility classes and helpers
```

## Requirements

- Node.js 20 or newer
- PostgreSQL
- Redis
- npm

## Environment

Create a local `.env` file using `.env.example` as a reference:

```bash
cp .env.example .env
```

Required variables:

```text
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-at-least-32-characters
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
TRUST_PROXY=false
REDIS_URL=redis://localhost:6379
TEST_REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wallet_engine?schema=public
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wallet_engine_test?schema=public
```

Never commit real `.env` files. This repository intentionally tracks only `.env.example`.

## Installation

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

For local development, you can also use:

```bash
npx prisma migrate dev
```

## Running The App

Development:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

Health check:

```http
GET /health
```

## API Overview

Base path:

```text
/api/v1
```

Auth:

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Wallet:

```http
GET  /api/v1/wallet/details
GET  /api/v1/wallet/transactions
POST /api/v1/wallet/deposit
POST /api/v1/wallet/withdraw
```

Transfer:

```http
POST /api/v1/transfer
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

Money-movement endpoints also require:

```http
x-idempotency-key: <unique-key>
```

## Example Requests

Register:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Deposit:

```http
POST /api/v1/wallet/deposit
Authorization: Bearer <token>
x-idempotency-key: 7f48d078-ecb2-4ce3-a59a-7ffb6b21f9b9
Content-Type: application/json

{
  "amount": "1000.00"
}
```

Transfer:

```http
POST /api/v1/transfer
Authorization: Bearer <token>
x-idempotency-key: 5fb1a82f-6f5f-41a9-b4cf-f3ccb3391716
Content-Type: application/json

{
  "receiverEmail": "receiver@example.com",
  "amount": "250.00"
}
```

## Testing

The test command applies migrations to `TEST_DATABASE_URL` before running the integration suite:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

The tests clear wallet, transaction, ledger, user, and Redis state between cases. Use a dedicated test database only.

## CI / CD

This repo includes a GitHub Actions workflow at `.github/workflows/ci.yml`.
It runs on push and pull request events, and it:

- installs dependencies
- generates the Prisma client
- starts PostgreSQL and Redis services
- runs the integration tests

CI/CD means Continuous Integration / Continuous Delivery:

- Continuous Integration automatically builds and tests every change when code is pushed or reviewed.
- Continuous Delivery keeps the application deployable by validating code, migrations, and tests before merge.
- In this project, the workflow validates database migrations and runtime behavior so changes can be published safely.

## Financial Safety Notes

Implemented safeguards:

- Decimal-safe money amounts
- Positive amount validation with 2 decimal-place limit
- Database transactions around balance mutations
- Row-level wallet locking for deposits, withdrawals, and transfers
- Idempotency key requirement on money-movement endpoints
- Ledger entries for every completed wallet movement
- Cache invalidation after committed mutations

Known production hardening still recommended:

- Dedicated idempotency table with request hashing and replayed responses
- Scoped idempotency by user, route, and key
- `409 Conflict` on reused idempotency keys with different request bodies
- Double-entry accounting model with system accounts
- Ledger-derived balance reconciliation
- Concurrency stress tests for simultaneous withdrawals/transfers
- Rate limiting for auth and money-movement endpoints
- Request IDs and structured error codes
- Security headers and explicit CORS policy
- Refresh-token rotation and token revocation strategy
- CI pipeline with migrations, tests, and linting

## Development Principles

This service treats wallet mutation as a critical path:

- Validate input before service execution
- Use database transactions for state changes
- Lock wallet rows before balance updates
- Write transaction and ledger records together
- Keep external side effects outside the database transaction
- Use integration tests for behavior that matters to money movement

## License

ISC
