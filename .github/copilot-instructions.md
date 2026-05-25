# Copilot Instructions — WebFlexi Solutions

Read CLAUDE.md in the project root for full architecture, conventions, and scope.

## Quick context

- Monorepo: `backend/` (Node.js/Express/Prisma) + `frontend/` (Next.js 14 App Router)
- Database: PostgreSQL via Prisma ORM. Client singleton at `backend/src/config/database.ts`
- Auth: JWT. Middleware at `backend/src/middlewares/auth.ts`. Zustand store at `frontend/src/lib/store.ts`
- Real-time: Socket.io server in `backend/src/app.ts`. Clients in CodeEditor, VideoCall, Chat components
- Video: PeerJS (WebRTC). Server on port 9000 (Docker). Client in `frontend/src/components/video-call/VideoCall.tsx`
- API calls: always use `frontend/src/lib/api.ts` (Axios instance), never raw fetch
- Server state: TanStack Query hooks in `frontend/src/hooks/`

## Conventions

- Services throw errors, controllers catch and map to HTTP status codes
- Zod validation in controllers only
- No `new PrismaClient()` outside `config/database.ts`
- No `new Redis()` outside `config/redis.ts`
- TypeScript strict — no implicit `any`

## Never add

- Stripe / payment code
- Subscription logic
- Code execution / sandboxing (Run button is intentionally a stub)
