# WebFlexi Solutions

Open-source platform connecting junior developers with senior mentors for real-time code debugging via live code editor + video calls.

**100% free stack. No paid APIs. Runs fully local.**

---

## Features

- Live collaborative code editor (Monaco)
- WebRTC video calls + screen sharing (PeerJS)
- Real-time chat (Socket.io)
- Mentor marketplace with search + ratings
- Code submission with error description
- Session management (request → accept → room → review)
- Dual roles: Junior (help seeker) / Senior (mentor)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript, Socket.io, Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Video | PeerJS (WebRTC) |
| Auth | JWT + bcrypt |
| Local infra | Docker Compose |

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Local Setup (5 steps)

### Step 1 — Clone & install
```bash
git clone <repo-url>
cd webflexi
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Step 2 — Start Docker services
```bash
docker-compose up -d
```

Starts: PostgreSQL (5432), Redis (6379), PeerJS (9000), pgAdmin (5050)

Wait ~10s for Postgres to be ready. Verify:
```bash
docker-compose ps
```
All services should show `healthy` or `running`.

### Step 3 — Set up database
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### Step 4 — Start backend
```bash
# In terminal 1 (inside /backend)
npm run dev
```
Backend runs at http://localhost:5000
Health check: http://localhost:5000/health

### Step 5 — Start frontend
```bash
# In terminal 2 (inside /frontend)
npm run dev
```
App runs at http://localhost:3000

---

## Test Accounts

All passwords: `password123`

| Role | Email |
|------|-------|
| Junior | jay@webflexi.dev |
| Junior | mia@webflexi.dev |
| Senior | alice@webflexi.dev |
| Senior | bob@webflexi.dev |
| Senior | carol@webflexi.dev |
| Senior | dave@webflexi.dev |
| Admin | admin@webflexi.dev |

---

## User Flows

### Junior Developer
1. Login as `jay@webflexi.dev`
2. Dashboard → "Find Mentors" tab → Request session with Alice
3. Login as `alice@webflexi.dev` in another tab → Accept request
4. Both click "Join Session" → Session room opens
5. Live code editor syncs in real-time between both tabs
6. Start video call (requires camera/mic permission)
7. Click "Leave Session" → redirected to dashboard
8. Leave a review for the mentor

### Senior Mentor
1. Login → Overview tab shows pending requests
2. Accept or decline session requests
3. Join session room → help debug code
4. Session auto-completes when either party leaves

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/profile

GET    /api/sessions/my-sessions
GET    /api/sessions/my-stats
GET    /api/sessions/mentors?search=
POST   /api/sessions
GET    /api/sessions/:id
POST   /api/sessions/:id/accept
POST   /api/sessions/:id/reject
POST   /api/sessions/:id/start
POST   /api/sessions/:id/end

POST   /api/submissions
GET    /api/submissions
GET    /api/submissions/mine
GET    /api/submissions/:id
PATCH  /api/submissions/:id/status
DELETE /api/submissions/:id

POST   /api/reviews
GET    /api/reviews/mentor/:mentorId
GET    /api/reviews/session/:sessionId
```

---

## Socket.io Events

| Event (emit) | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, peerId? }` | Join session room |
| `leave-room` | `roomId` | Leave session room |
| `send-message` | `{ roomId, message }` | Send chat message |
| `code-change` | `{ roomId, code }` | Broadcast code edit |
| `typing` | `{ roomId, isTyping }` | Typing indicator |
| `call-user` | `{ to, signalData }` | Initiate video call |
| `accept-call` | `{ to, signalData }` | Accept video call |

| Event (listen) | Payload | Description |
|---|---|---|
| `user-joined` | `{ peerId }` | Other user joined with peerId |
| `receive-message` | message | Incoming chat message |
| `code-update` | `{ code }` | Remote code change |
| `user-typing` | `{ userId, isTyping }` | Typing indicator |
| `incoming-call` | `{ from, signalData }` | Incoming video call |
| `call-accepted` | `{ signalData }` | Call accepted |

---

## Project Structure

```
webflexi/
├── docker-compose.yml
├── package.json            # Root convenience scripts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── app.ts          # Express + Socket.io setup
│       ├── server.ts       # Entry point
│       ├── config/         # DB + Redis
│       ├── middlewares/    # Auth, rate limit, errors
│       ├── services/       # Business logic
│       ├── controllers/    # Route handlers
│       ├── routes/         # Express routers
│       ├── types/
│       └── utils/          # JWT, password
└── frontend/
    └── src/
        ├── app/            # Next.js pages
        │   ├── page.tsx            # Landing
        │   ├── dashboard/          # Role-based dashboard
        │   ├── auth/               # Login + Register
        │   ├── session/room/[id]/  # Session room
        │   ├── submissions/new/    # Submit code
        │   └── profile/            # Edit profile
        ├── components/
        │   ├── code-editor/    # Monaco editor
        │   ├── video-call/     # PeerJS video
        │   ├── chat/           # Socket.io chat
        │   ├── session/        # Session room layout
        │   └── dashboard/      # Junior + Senior dashboards
        ├── hooks/              # React Query hooks
        ├── lib/                # API client, Zustand store
        └── types/
```

---

## Useful Tools

- **pgAdmin**: http://localhost:5050 (admin@webflexi.com / admin)
- **Prisma Studio**: `cd backend && npx prisma studio`
- **DB reset + reseed**: `cd backend && npx prisma migrate reset --force && npm run prisma:seed`

---

## Common Issues

**"Cannot connect to database"**
→ Docker not running. Run `docker-compose up -d` and wait 10s.

**"PeerJS connection failed"**
→ PeerJS container not started. Check `docker-compose ps`. Restart with `docker-compose restart peerjs`.

**Video call not connecting**
→ Browser needs camera/mic permissions. Both users must be in the same session room. Check browser console for WebRTC errors.

**"Invalid or expired token"**
→ JWT expired (15min). Log out and log back in.

---

## License

MIT — free to use, fork, and contribute.
