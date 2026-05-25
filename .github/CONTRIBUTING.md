# Contributing to WebFlexi Solutions

## Before You Start

Read `CLAUDE.md` in the project root. It has the full architecture, conventions, and scope. If you're using an AI coding agent (Claude Code, Cursor, Codex, Copilot), point it at `CLAUDE.md` — it's written for that purpose.

## What We're Building

An open-source mentor marketplace. Junior devs get help from seniors via live code editor + video calls. No payments. No subscriptions. Local-first.

See [README.md](../README.md) for full setup.

## Out of Scope (don't build these without discussion)

- Payment / Stripe integration
- Mobile apps
- Code execution sandbox
- Email notification service
- OAuth (Google/GitHub)
- Admin dashboard

## Setup

```bash
docker-compose up -d
cd backend && npm install && npm run db:setup && npm run dev
cd frontend && npm install && npm run dev
```

## Making Changes

### Branch naming
```
feat/short-description
fix/short-description
docs/short-description
```

### Before submitting a PR
```bash
# Backend — must pass
cd backend && npx tsc --noEmit

# Frontend — must pass
cd frontend && npx tsc --noEmit
```

### PR checklist
- [ ] TypeScript: 0 errors in both backend and frontend
- [ ] New API endpoints documented in CLAUDE.md
- [ ] New DB models have a migration + seed entry
- [ ] No payment/subscription code added
- [ ] Tested locally end-to-end

## How to Add a Feature

**New API endpoint:**
1. `backend/src/services/*.service.ts` — business logic
2. `backend/src/controllers/*.controller.ts` — validate + respond
3. `backend/src/routes/*.routes.ts` — register route
4. Register in `backend/src/app.ts` if new resource

**New frontend page:**
1. `frontend/src/app/<path>/page.tsx`
2. Hook in `frontend/src/hooks/`
3. Link from dashboard

**New DB model:**
1. Add to `backend/prisma/schema.prisma`
2. `npx prisma migrate dev --name <name>`
3. `npx prisma generate`
4. Add seed data in `backend/prisma/seed.ts`

## Report a Bug

Use the Bug Report issue template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS if frontend
- Error message / stack trace

## Questions

Open a Discussion (not an Issue) for questions about architecture or direction.
