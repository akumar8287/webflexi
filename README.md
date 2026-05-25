<div align="center">

# WebFlexi

**Open-source mentor marketplace for developers.**
Junior devs get real-time help from senior mentors — live code editor, video call, and chat in one room.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Docker](https://img.shields.io/badge/Docker-required-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

<br/>

> **100% free stack. No paid APIs. No payment system. Runs fully local.**

</div>

---

## What is WebFlexi?

Junior developers get stuck. Stack Overflow helps sometimes. But nothing beats having an experienced engineer look at your code *right now*, explain the issue, and walk you through the fix.

WebFlexi is a free, open-source platform where junior developers request live mentoring sessions from senior developers. When a mentor accepts, both parties enter a shared **session room** with:

- **Monaco editor** — collaborative code editing synced in real time
- **WebRTC video call** — face-to-face with screen sharing
- **Socket.io chat** — code snippets, system events, typing indicators

No subscriptions. No payment processing. No paid APIs. Just developers helping developers.

**Who is it for?**

| User | Why |
|---|---|
| Junior devs | Get unstuck fast. Real-time debugging help from experienced engineers. |
| Senior devs | Contribute to the community. Share expertise on your schedule. |
| Bootcamps / orgs | Self-host for internal mentoring programs. |
| Contributors | Full-stack TypeScript project with a real product purpose. |

---

## Features

**Session Room**
- Live collaborative Monaco editor with language sync, cursor presence, and debounced real-time broadcast
- WebRTC video call (PeerJS) with screen sharing — replaces sender track cleanly without re-negotiation
- Real-time chat with code snippet rendering, copy button, message grouping, and unread badge
- Single shared WebSocket connection across all three components

**Marketplace**
- Mentor search and filtering by skill
- Session request → accept / decline → live room → review flow
- Role-based dashboards for Junior and Senior developers
- Code submission system with status tracking (OPEN → IN_PROGRESS → RESOLVED)

**Infrastructure**
- JWT auth (access token 15m + refresh token 7d)
- Rate limiting on all API routes
- Room participant tracking with late-joiner code sync
- Automatic room cleanup when all participants leave

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js 14](https://nextjs.org/) · TypeScript · Tailwind CSS · [Zustand](https://zustand-demo.pmnd.rs/) · [TanStack Query](https://tanstack.com/query) |
| **Backend** | [Node.js 20](https://nodejs.org/) · [Express](https://expressjs.com/) · TypeScript · [Socket.io](https://socket.io/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Video** | [PeerJS](https://peerjs.com/) (WebRTC) |
| **Auth** | JWT · bcrypt |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Local Infra** | Docker Compose |

---

## Architecture

```
Browser (Junior)                    Browser (Senior)
     │                                    │
     │  HTTP + WS (Socket.io)             │  HTTP + WS (Socket.io)
     ▼                                    ▼
┌─────────────────────────────────────────────────┐
│              Express API  (port 5000)           │
│                                                 │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ REST APIs │  │Socket.io │  │ Rate Limiter│  │
│  │ /api/*    │  │  server  │  │   (Redis)   │  │
│  └─────┬─────┘  └────┬─────┘  └─────────────┘  │
│        │             │                          │
│  ┌─────▼─────────────▼──────┐                  │
│  │     Prisma ORM            │                  │
│  └───────────┬───────────────┘                  │
└──────────────┼──────────────────────────────────┘
               │
     ┌─────────▼─────────┐
     │    PostgreSQL 15   │
     │     (port 5432)    │
     └───────────────────┘

WebRTC (video / screen share)
Junior ◄──────────────────────────────► Senior
            PeerJS server (port 9000)
            [STUN: stun.l.google.com]
```

**Session room data flow:**
```
User types code
  → debounce 300ms
  → socket.emit("code-change")
  → server: socket.to(room).emit("code-update")
  → remote editor: isRemoteRef = true → setCode() → onChange blocked
  → no echo loop
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20+ | Use [nvm](https://github.com/nvm-sh/nvm) to manage versions |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Required for Postgres, Redis, PeerJS |
| Browser | Chrome / Firefox / Edge | Safari has limited WebRTC support |

---

## Local Setup

### 1 — Clone and install dependencies

```bash
git clone https://github.com/your-org/webflexi.git
cd webflexi

# Install backend and frontend deps in one go
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2 — Configure environment variables

**Backend** — create `backend/.env`:
```env
DATABASE_URL=postgresql://webflexi_user:webflexi_password@localhost:5432/webflexi_db
JWT_SECRET=change-me-to-a-long-random-string
JWT_REFRESH_SECRET=change-me-to-another-long-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_PEER_HOST=localhost
NEXT_PUBLIC_PEER_PORT=9000
```

### 3 — Start Docker services

```bash
docker-compose up -d
```

Starts PostgreSQL (5432), Redis (6379), PeerJS (9000), pgAdmin (5050).

Verify all services are healthy:
```bash
docker-compose ps
```

> **Tip:** First run pulls Docker images — takes ~1–2 min. Subsequent starts are instant.

### 4 — Set up the database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed    # loads test accounts + sample data
```

### 5 — Run the app

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev
# → http://localhost:5000
# → Health check: http://localhost:5000/health

# Terminal 2 — frontend
cd frontend && npm run dev
# → http://localhost:3000
```

---

## Test Accounts

All test accounts use the password `password123`.

| Role | Email | Dashboard |
|---|---|---|
| Junior | `jay@webflexi.dev` | Find mentors, request sessions |
| Junior | `mia@webflexi.dev` | Find mentors, request sessions |
| Senior | `alice@webflexi.dev` | Accept/decline requests, join sessions |
| Senior | `bob@webflexi.dev` | Accept/decline requests, join sessions |
| Senior | `carol@webflexi.dev` | Accept/decline requests, join sessions |
| Senior | `dave@webflexi.dev` | Accept/decline requests, join sessions |
| Admin | `admin@webflexi.dev` | Admin role (UI pending) |

---

## Try It — End-to-End Flow

**Open two browser tabs** (or two different browsers to avoid auth conflicts).

**Tab 1 — Junior:**
1. Login as `jay@webflexi.dev`
2. Dashboard → **Find Mentors** tab
3. Click **Request Session** on Alice's card

**Tab 2 — Senior:**
1. Login as `alice@webflexi.dev`
2. Dashboard → **Requests** tab
3. Click **Accept**

**Tab 1:**
4. Dashboard → **My Sessions** → **Join Session**

**Tab 2:**
4. Join the same session

Both tabs now share the **session room**: code changes in one editor appear in the other within ~300ms. Start a video call, try screen sharing, send code snippets in chat.

---

## API Reference

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile          [auth]
PUT    /api/auth/profile          [auth]
POST   /api/auth/logout           [auth]
```

### Sessions

```
GET    /api/sessions/my-sessions  [auth]
GET    /api/sessions/my-stats     [auth]
GET    /api/sessions/mentors      [auth]  ?search=
GET    /api/sessions/my-earnings  [auth, SENIOR]
GET    /api/sessions/my-requests  [auth, SENIOR]
POST   /api/sessions              [auth, JUNIOR]
GET    /api/sessions/:id          [auth]
POST   /api/sessions/:id/accept   [auth, SENIOR]
POST   /api/sessions/:id/reject   [auth, SENIOR]
POST   /api/sessions/:id/start    [auth]
POST   /api/sessions/:id/end      [auth]
```

### Submissions

```
POST   /api/submissions           [auth]
GET    /api/submissions           [auth]  ?language= ?status=
GET    /api/submissions/mine      [auth]
GET    /api/submissions/:id       [auth]
PATCH  /api/submissions/:id/status [auth, owner]
DELETE /api/submissions/:id       [auth, owner]
```

### Reviews

```
POST   /api/reviews               [auth, JUNIOR]
GET    /api/reviews/mentor/:id    [auth]
GET    /api/reviews/session/:id   [auth]
```

---

## Socket.io Events

All events are scoped to a session `roomId`. Connect once per session room — the shared `SessionSocketProvider` handles this.

### Emit (client → server)

| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, userId, name, peerId? }` | Join session room |
| `leave-room` | `roomId` | Leave session room |
| `send-message` | `{ roomId, message }` | Send chat message |
| `code-change` | `{ roomId, code, language? }` | Broadcast code edit (debounced) |
| `language-change` | `{ roomId, language }` | Sync editor language to all participants |
| `cursor-position` | `{ roomId, line, column }` | Broadcast cursor position |
| `typing` | `{ roomId, isTyping }` | Typing indicator |
| `call-user` | `{ to: socketId, signalData }` | WebRTC signal — initiate call |
| `accept-call` | `{ to: socketId, signalData }` | WebRTC signal — accept call |

### Listen (server → client)

| Event | Payload | Description |
|---|---|---|
| `room-users` | `Participant[]` | Current room participants (on join) |
| `user-joined` | `{ socketId, userId, name, peerId? }` | Another user joined |
| `user-left` | `{ socketId, name }` | Participant disconnected |
| `receive-message` | `Message` | Incoming chat message |
| `code-update` | `{ code }` | Remote code change |
| `language-update` | `{ language }` | Remote language change |
| `cursor-update` | `{ socketId, name, line, column }` | Remote cursor position |
| `sync-response` | `{ code, language }` | Code state for late joiners |
| `user-typing` | `{ userId, name, isTyping }` | Typing indicator |
| `incoming-call` | `{ from: socketId, signalData }` | Incoming video call |
| `call-accepted` | `{ signalData }` | Call accepted |

---

## Project Structure

```
webflexi/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB models: User, Session, Submission, Review…
│   │   └── seed.ts             # Test accounts + sample data
│   └── src/
│       ├── app.ts              # Express + Socket.io setup + room logic
│       ├── server.ts           # Entry point
│       ├── config/             # Prisma singleton, Redis singleton
│       ├── middlewares/        # authenticate, authorize, rateLimit, errorHandler
│       ├── services/           # Pure business logic (no req/res)
│       ├── controllers/        # Zod validation + service calls + response
│       ├── routes/             # Express routers
│       └── utils/              # JWT helpers, bcrypt helpers
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                # Landing page
        │   ├── auth/                   # Login + Register
        │   ├── dashboard/              # Role-based dashboard
        │   ├── session/room/[id]/      # Session room page
        │   ├── submissions/new/        # Submit code for help
        │   └── profile/                # Edit profile
        ├── components/
        │   ├── code-editor/            # Monaco + Socket.io collaboration
        │   ├── video-call/             # PeerJS WebRTC + screen share
        │   ├── chat/                   # Real-time chat with code snippets
        │   ├── session/                # SessionRoom layout + socket provider
        │   └── dashboard/              # Junior / Senior dashboards
        ├── context/
        │   └── SessionSocketContext.tsx  # Shared socket for session room
        ├── hooks/                      # TanStack Query hooks
        ├── lib/                        # Axios instance, Zustand auth store
        └── types/                      # Shared TypeScript types
```

---

## Useful Dev Tools

| Tool | URL / Command | Purpose |
|---|---|---|
| pgAdmin | http://localhost:5050 | DB GUI (`admin@webflexi.com` / `admin`) |
| Prisma Studio | `cd backend && npx prisma studio` | Visual DB browser at :5555 |
| Health check | http://localhost:5000/health | Verify backend is up |
| DB reset | `cd backend && npx prisma migrate reset --force && npm run prisma:seed` | Wipe and reseed |
| TypeScript check | `cd backend && npx tsc --noEmit` / `cd frontend && npx tsc --noEmit` | Type safety |

---

## Troubleshooting

**"Cannot connect to database" / Prisma errors**
```
→ Docker not running.
→ Run: docker-compose up -d
→ Wait 10–15s for Postgres health check to pass.
→ Verify: docker-compose ps  (all services should show "healthy" or "running")
```

**"Port 5432 already in use"**
```
→ Local Postgres instance is running.
→ Stop it: sudo service postgresql stop  (Linux)
           brew services stop postgresql  (macOS)
→ Or change the port in docker-compose.yml and DATABASE_URL.
```

**PeerJS connection failed / video call not connecting**
```
→ Check PeerJS container: docker-compose ps (peerjs should be running)
→ Restart: docker-compose restart peerjs
→ Both users must be in the same session room.
→ Browser must have camera/mic permission granted.
→ Check browser console for WebRTC ICE errors.
```

**Video call connects but no video/audio**
```
→ Camera may already be in use by another app.
→ Try: Settings → Privacy → Camera → allow browser access.
→ On Linux: check v4l2 device availability.
```

**"Invalid or expired token"**
```
→ Access tokens expire after 15 min.
→ Log out and log back in.
→ If persistent: clear localStorage and retry.
```

**Hot reload not working on Windows**
```
→ Next.js file watching issue on WSL2 or mounted drives.
→ Add to frontend/.env.local:  WATCHPACK_POLLING=true
```

**npm install fails on Windows (node-gyp / canvas)**
```
→ Install windows-build-tools: npm install --global windows-build-tools
→ Or use WSL2 for development.
```

---

## Roadmap

Items below are tracked as GitHub issues/milestones. PRs welcome.

| Status | Feature |
|---|---|
| ✅ Done | Collaborative Monaco editor with real-time sync |
| ✅ Done | WebRTC video + screen sharing |
| ✅ Done | Socket.io chat with code snippets |
| ✅ Done | Mentor marketplace with session lifecycle |
| ✅ Done | JWT auth + rate limiting |
| 🔲 Planned | Admin dashboard (role exists, no UI) |
| 🔲 Planned | Email notifications (schema exists, no service) |
| 🔲 Planned | GitHub OAuth / Google OAuth (schema ready) |
| 🔲 Planned | Code execution sandbox (Run button is a placeholder) |
| 🔲 Planned | File attachments in chat (button exists, no upload) |
| 🔲 Planned | Mobile-responsive session room |
| 🔲 Planned | Mentor availability calendar |
| 🔲 Planned | Session recording / replay |

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to set up the dev environment
- Branch naming and commit conventions
- How to add a new API endpoint
- How to add a new frontend page
- PR checklist

**Quick start for contributors:**

```bash
# Fork the repo, then:
git clone https://github.com/your-fork/webflexi.git
cd webflexi
git checkout -b feat/your-feature
```

Open a PR against `main`. Small, focused PRs are merged faster.

---

## License

[MIT](LICENSE) — free to use, fork, modify, and distribute.

---

<div align="center">

Built with care for the developer community. If WebFlexi helped you, consider leaving a ⭐ on GitHub.

</div>
