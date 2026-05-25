# WebFlexi Solutions — AI Agent Context

This file is auto-loaded by Claude Code and read by other AI coding agents (Codex, Cursor, Copilot, etc.).
Read this before touching any code.

---

## What This Project Is

Open-source mentor marketplace. Junior developers request help from senior developers.
They meet in a session room with:
- Live collaborative code editor (Monaco + Socket.io)
- Video call (PeerJS/WebRTC)
- Real-time chat (Socket.io)

No payment system. No subscriptions. 100% free stack. Local-first.

---

## Monorepo Layout

```
webflexi/
├── backend/          Node.js + Express + TypeScript API
├── frontend/         Next.js 14 App Router
├── docker-compose.yml
├── CLAUDE.md         ← you are here
└── README.md
```

---

## Running Locally

```bash
# 1. Start infrastructure (PostgreSQL, Redis, PeerJS)
docker-compose up -d

# 2. Backend (terminal 1)
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed      # loads test accounts + sample data
npm run dev              # http://localhost:5000

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

Test accounts (password: `password123`):
- Junior: `jay@webflexi.dev`, `mia@webflexi.dev`
- Senior: `alice@webflexi.dev`, `bob@webflexi.dev`, `carol@webflexi.dev`, `dave@webflexi.dev`
- Admin:  `admin@webflexi.dev`

---

## Backend Architecture

```
backend/src/
├── server.ts              Entry point. Connects DB + Redis, starts HTTP server.
├── app.ts                 Express app + Socket.io setup + all route registration.
├── config/
│   ├── database.ts        Prisma client singleton.
│   └── redis.ts           ioredis client singleton.
├── middlewares/
│   ├── auth.ts            JWT authenticate() + authorize(...roles) middleware.
│   ├── rateLimit.ts       express-rate-limit: apiLimiter + authLimiter.
│   └── errorHandler.ts    Global error handler + 404 handler.
├── services/              Pure business logic. No req/res. Throw errors for bad states.
│   ├── auth.service.ts
│   ├── session.service.ts
│   ├── codeSubmission.service.ts
│   └── review.service.ts
├── controllers/           Validates input (Zod), calls service, sends response.
│   ├── auth.controller.ts
│   ├── session.controller.ts
│   ├── codeSubmission.controller.ts
│   └── review.controller.ts
├── routes/                Express routers. Auth middleware applied here.
│   ├── auth.routes.ts
│   ├── session.routes.ts
│   ├── codeSubmission.routes.ts
│   └── review.routes.ts
├── types/index.ts         AuthRequest, JWTPayload, shared interfaces.
└── utils/
    ├── jwt.ts             generateAccessToken/RefreshToken, verifyAccessToken/RefreshToken.
    └── password.ts        hashPassword, comparePassword (bcrypt).
```

### API Routes

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile          [auth]
PUT    /api/auth/profile          [auth]
POST   /api/auth/logout           [auth]

GET    /api/sessions/my-sessions  [auth]
GET    /api/sessions/my-stats     [auth]
GET    /api/sessions/mentors      [auth] ?search=
GET    /api/sessions/my-earnings  [auth, SENIOR]
GET    /api/sessions/my-requests  [auth, SENIOR]
POST   /api/sessions              [auth, JUNIOR]
GET    /api/sessions/:id          [auth]
POST   /api/sessions/:id/accept   [auth, SENIOR]
POST   /api/sessions/:id/reject   [auth, SENIOR]
POST   /api/sessions/:id/start    [auth]
POST   /api/sessions/:id/end      [auth]

POST   /api/submissions           [auth]
GET    /api/submissions           [auth] ?language= ?status=
GET    /api/submissions/mine      [auth]
GET    /api/submissions/:id       [auth]
PATCH  /api/submissions/:id/status [auth, owner]
DELETE /api/submissions/:id       [auth, owner]

POST   /api/reviews               [auth, JUNIOR only]
GET    /api/reviews/mentor/:id    [auth]
GET    /api/reviews/session/:id   [auth]
```

### Socket.io Events

Emit from client:
- `join-room` — payload: `{ roomId: string, peerId?: string }` — join session room; peerId triggers `user-joined` to others
- `leave-room` — payload: `roomId`
- `send-message` — payload: `{ roomId, message }` — broadcasts to room
- `code-change` — payload: `{ roomId, code }` — broadcasts to others in room
- `typing` — payload: `{ roomId, isTyping }` — typing indicator
- `call-user` — payload: `{ to: socketId, signalData }` — WebRTC signaling
- `accept-call` — payload: `{ to: socketId, signalData }` — WebRTC signaling

Listen on client:
- `user-joined` — `{ peerId }` — fires when other user joins with a peerId
- `receive-message` — incoming chat message
- `code-update` — `{ code }` — remote code edit
- `user-typing` — `{ userId, isTyping }`
- `incoming-call` — `{ from, signalData }`
- `call-accepted` — `{ signalData }`

### Database Schema (Prisma)

Models: `User`, `Session`, `CodeSubmission`, `Message`, `Review`, `Transaction`, `Notification`

Key enums:
- `UserRole`: JUNIOR | SENIOR | ADMIN
- `SessionStatus`: PENDING | SCHEDULED | ACTIVE | COMPLETED | CANCELLED
- `CodeSubmissionStatus`: OPEN | IN_PROGRESS | RESOLVED | CLOSED

Session lifecycle: PENDING → SCHEDULED (mentor accepts) → ACTIVE (start) → COMPLETED (end)

---

## Frontend Architecture

```
frontend/src/
├── app/                           Next.js App Router pages
│   ├── page.tsx                   Landing page
│   ├── layout.tsx                 Root layout (QueryProvider + Toaster)
│   ├── auth/login/page.tsx        Login form → POST /api/auth/login
│   ├── auth/register/page.tsx     Register form → POST /api/auth/register
│   ├── dashboard/page.tsx         Role-based: renders JuniorDashboard or SeniorDashboard
│   ├── session/room/[id]/page.tsx Session room page → renders SessionRoom component
│   ├── submissions/new/page.tsx   Submit code for help form
│   └── profile/page.tsx           Edit profile (bio, skills, links, hourly rate)
├── components/
│   ├── code-editor/CodeEditor.tsx Monaco editor + Socket.io code-change sync
│   ├── video-call/VideoCall.tsx   PeerJS video + Socket.io signaling
│   ├── chat/Chat.tsx              Socket.io real-time chat
│   ├── session/SessionRoom.tsx    Layout: CodeEditor + VideoCall + Chat
│   ├── dashboard/
│   │   ├── JuniorDashboard.tsx    Sessions tab, Mentors tab (with search + request)
│   │   ├── SeniorDashboard.tsx    Requests tab (accept/decline), Sessions tab
│   │   └── DashboardStats.tsx     Stats cards (pending/active/completed/total)
│   └── providers/QueryProvider.tsx TanStack Query client provider
├── hooks/
│   ├── useSessions.ts    useSessions, useSessionStats, useMentors, useEarnings,
│   │                     useMentorRequests, useCreateSession, useAcceptSession,
│   │                     useRejectSession, useStartSession, useEndSession
│   └── useSubmissions.ts useMySubmissions, useAllSubmissions, useCreateSubmission
├── lib/
│   ├── api.ts            Axios instance. Base URL from NEXT_PUBLIC_API_URL.
│   │                     Auto-attaches Bearer token. 401 → clears auth + redirects login.
│   └── store.ts          Zustand auth store (user, accessToken, isAuthenticated).
│                         Persisted to localStorage. setAuth, clearAuth, updateUser.
└── types/index.ts        User, Session, CodeSubmission, Message, AuthResponse, etc.
```

### State Management Pattern

```ts
// Auth state — Zustand (persisted)
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

// Server state — TanStack Query via custom hooks
const { data: sessions, isLoading } = useSessions();
const createSession = useCreateSession(); // mutation
createSession.mutate({ seniorId: '...' });
```

### Environment Variables

Backend (`backend/.env`):
```
DATABASE_URL=postgresql://webflexi_user:webflexi_password@localhost:5432/webflexi_db
JWT_SECRET=<long random string>
JWT_REFRESH_SECRET=<long random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_PEER_HOST=localhost
NEXT_PUBLIC_PEER_PORT=9000
```

---

## Key Conventions

### Backend
- Services throw `Error('message')` for business logic failures. Controllers catch and map to HTTP status.
- All routes requiring auth use `authenticate` middleware. Role restriction uses `authorize('SENIOR')`.
- Zod validation in controllers, not services.
- Prisma client is a singleton in `config/database.ts` — never instantiate `new PrismaClient()` elsewhere.
- Redis client is a singleton in `config/redis.ts`.

### Frontend
- All API calls go through `lib/api.ts` (Axios instance) — never use `fetch` directly.
- Auth state lives in Zustand store (`lib/store.ts`). Don't read tokens from localStorage directly.
- Server state (sessions, mentors, etc.) uses TanStack Query hooks in `hooks/`.
- Toast notifications via `react-hot-toast`. Use `toast.success()` / `toast.error()`.
- TypeScript strict mode. No `any` unless unavoidable.

---

## What's NOT Built (out of scope for MVP)

- Payment / Stripe / subscriptions — intentionally excluded
- Email notifications — schema exists, no service
- GitHub OAuth / Google OAuth — schema ready, not wired
- Code execution sandbox — Run button shows placeholder message
- Admin dashboard — admin role exists in DB, no UI
- File attachments in chat — UI button exists, no upload logic
- Mobile app

Do NOT add these unless a contributor explicitly scopes and proposes them.

---

## Common Tasks for Contributors

### Add a new API endpoint
1. Add method to the relevant `services/*.service.ts`
2. Add controller method in `controllers/*.controller.ts`
3. Add route in `routes/*.routes.ts`
4. If new resource: register route in `app.ts`

### Add a new frontend page
1. Create `frontend/src/app/<path>/page.tsx`
2. Add any needed hooks to `frontend/src/hooks/`
3. Link from dashboard or nav

### Add a new DB model
1. Add to `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Run `npx prisma generate`
4. Add to seed if test data needed

### Debug Socket.io issues
- All three components (CodeEditor, VideoCall, Chat) open separate Socket.io connections
- Each joins the same `sessionId` room
- Check browser Network tab → WS frames for event payloads

### TypeScript check
```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## Infrastructure Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend | 3000 | Next.js dev server |
| Backend | 5000 | Express API + Socket.io |
| PostgreSQL | 5432 | Docker |
| Redis | 6379 | Docker |
| PeerJS | 9000 | Docker — video call signaling |
| pgAdmin | 5050 | Docker — DB GUI (admin@webflexi.com / admin) |
