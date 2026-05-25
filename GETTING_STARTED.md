# WebFlexi Solutions - Getting Started Guide

## 🎯 Quick Start (Zero to Running in 30 minutes)

This guide will help you set up the complete WebFlexi Solutions platform locally using 100% free and open-source technologies.

---

## 📋 Prerequisites

### Required Software (All FREE)
1. **Node.js 20+ LTS** - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
3. **Git** - [Download](https://git-scm.com/)
4. **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Verify Installation
```bash
node --version    # Should be v20+
npm --version     # Should be v10+
docker --version  # Should be v20+
git --version     # Should be v2+
```

---

## 🚀 Step-by-Step Setup

### Step 1: Project Structure
```bash
# Navigate to your project folder
cd d:\Aman\Projects\webflexi

# Create project structure
mkdir -p frontend backend shared
```

### Step 2: Initialize Frontend (Next.js)
```bash
# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

# Follow prompts:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? Yes
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No

cd frontend

# Install additional dependencies
npm install zustand @tanstack/react-query socket.io-client peerjs
npm install react-hook-form zod @hookform/resolvers
npm install date-fns lucide-react react-hot-toast
npm install @monaco-editor/react yjs y-websocket y-monaco
npm install axios framer-motion
```

### Step 3: Initialize Backend (Express.js)
```bash
cd ../backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors dotenv
npm install socket.io jsonwebtoken bcryptjs
npm install @prisma/client express-rate-limit helmet
npm install ioredis express-session cookie-parser

# Install dev dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/jsonwebtoken @types/bcryptjs
npm install -D ts-node nodemon prisma
npm install -D @types/cookie-parser @types/express-session

# Initialize TypeScript
npx tsc --init
```

### Step 4: Setup Docker (Database & Services)
```bash
# Create docker-compose.yml in project root
cd ..
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: webflexi-postgres
    environment:
      POSTGRES_DB: webflexi_db
      POSTGRES_USER: webflexi_user
      POSTGRES_PASSWORD: webflexi_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: webflexi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # PeerJS Server (for video calls)
  peerjs:
    image: peerjs/peerjs-server
    container_name: webflexi-peerjs
    ports:
      - "9000:9000"
    environment:
      - PEERJS_PORT=9000
    restart: unless-stopped

  # pgAdmin (Database GUI - Optional)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: webflexi-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@webflexi.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:
```

### Step 5: Start Docker Services
```bash
# Start all services
docker-compose up -d

# Verify services are running
docker ps

# Check logs if needed
docker-compose logs -f
```

### Step 6: Setup Prisma (Database ORM)
```bash
cd backend

# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

Update `backend/.env`:
```env
DATABASE_URL="postgresql://webflexi_user:webflexi_password@localhost:5432/webflexi_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
REDIS_URL="redis://localhost:6379"
PORT=5000
NODE_ENV=development
```

Update `backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  JUNIOR
  SENIOR
  ADMIN
}

enum SessionStatus {
  PENDING
  SCHEDULED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum CodeSubmissionStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          UserRole
  profilePicture String?
  bio           String?
  skills        String[]  // Array of skills
  experienceYears Int?
  hourlyRate    Float?    // For mentors
  timezone      String    @default("UTC")
  githubUrl     String?
  linkedinUrl   String?
  portfolioUrl  String?
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sentSessions      Session[] @relation("JuniorSessions")
  receivedSessions  Session[] @relation("SeniorSessions")
  codeSubmissions   CodeSubmission[]
  sentMessages      Message[] @relation("SentMessages")
  receivedMessages  Message[] @relation("ReceivedMessages")
  givenReviews      Review[] @relation("Reviewer")
  receivedReviews   Review[] @relation("Reviewee")
  notifications     Notification[]
  transactions      Transaction[]

  @@index([email])
  @@index([role])
}

model Session {
  id            String        @id @default(uuid())
  juniorId      String
  seniorId      String
  status        SessionStatus @default(PENDING)
  scheduledAt   DateTime?
  startedAt     DateTime?
  endedAt       DateTime?
  duration      Int?          // in minutes
  price         Float?
  commission    Float?
  mentorPayout  Float?
  recordingUrl  String?
  sessionNotes  String?
  codeSnapshotUrl String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  junior        User          @relation("JuniorSessions", fields: [juniorId], references: [id])
  senior        User          @relation("SeniorSessions", fields: [seniorId], references: [id])
  messages      Message[]
  review        Review?
  transaction   Transaction?

  @@index([juniorId])
  @@index([seniorId])
  @@index([status])
}

model CodeSubmission {
  id            String                @id @default(uuid())
  userId        String
  sessionId     String?
  title         String
  description   String
  language      String
  framework     String?
  codeContent   String                // or store file path
  errorDescription String?
  expectedBehavior String?
  actualBehavior   String?
  tags          String[]
  status        CodeSubmissionStatus  @default(OPEN)
  attachments   String[]              // URLs to screenshots
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  // Relations
  user          User                  @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([language])
}

model Message {
  id            String    @id @default(uuid())
  senderId      String
  receiverId    String
  sessionId     String?
  content       String
  messageType   String    @default("text") // text, code, file
  attachmentUrl String?
  isRead        Boolean   @default(false)
  createdAt     DateTime  @default(now())

  // Relations
  sender        User      @relation("SentMessages", fields: [senderId], references: [id])
  receiver      User      @relation("ReceivedMessages", fields: [receiverId], references: [id])
  session       Session?  @relation(fields: [sessionId], references: [id])

  @@index([senderId])
  @@index([receiverId])
  @@index([sessionId])
}

model Review {
  id            String    @id @default(uuid())
  sessionId     String    @unique
  reviewerId    String
  revieweeId    String
  rating        Int       // 1-5
  comment       String?
  createdAt     DateTime  @default(now())

  // Relations
  session       Session   @relation(fields: [sessionId], references: [id])
  reviewer      User      @relation("Reviewer", fields: [reviewerId], references: [id])
  reviewee      User      @relation("Reviewee", fields: [revieweeId], references: [id])

  @@index([revieweeId])
}

model Transaction {
  id            String    @id @default(uuid())
  userId        String
  sessionId     String?   @unique
  amount        Float
  currency      String    @default("USD")
  paymentMethod String
  transactionType String  // payment, payout, refund
  status        String    @default("pending")
  stripePaymentId String?
  createdAt     DateTime  @default(now())

  // Relations
  user          User      @relation(fields: [userId], references: [id])
  session       Session?  @relation(fields: [sessionId], references: [id])

  @@index([userId])
}

model Notification {
  id            String    @id @default(uuid())
  userId        String
  type          String    // session_reminder, new_request, message, payment
  title         String
  message       String
  actionUrl     String?
  isRead        Boolean   @default(false)
  createdAt     DateTime  @default(now())

  // Relations
  user          User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isRead])
}
```

Run migration:
```bash
npx prisma migrate dev --name init
```

### Step 7: Backend Project Structure
```bash
# Create folder structure
mkdir -p src/{config,controllers,middlewares,routes,services,types,utils}
touch src/server.ts src/app.ts
```

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

Create `backend/package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

Create `backend/nodemon.json`:
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/server.ts"
}
```

### Step 8: Basic Backend Setup

Create `backend/src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { app, httpServer, io };
```

Create `backend/src/server.ts`:
```typescript
import { config } from 'dotenv';
config();

import { httpServer } from './app';

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
```

### Step 9: Frontend Environment Setup

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_PEER_HOST=localhost
NEXT_PUBLIC_PEER_PORT=9000
```

### Step 10: Install shadcn/ui
```bash
cd frontend

# Initialize shadcn/ui
npx shadcn@latest init

# Install commonly used components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add toast
```

---

## 🎯 Running the Application

### Terminal 1: Start Docker Services
```bash
# From project root
docker-compose up -d

# Verify
docker ps
```

### Terminal 2: Start Backend
```bash
cd backend
npm run dev

# Should see:
# 🚀 Server running on http://localhost:5000
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev

# Should see:
# ▲ Next.js 14.x.x
# - Local:   http://localhost:3000
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **PeerJS Server:** http://localhost:9000
- **pgAdmin:** http://localhost:5050 (user: admin@webflexi.com, pass: admin)
- **Prisma Studio:** `npm run prisma:studio` in backend folder

---

## 📁 Final Project Structure

```
webflexi/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities
│   │   ├── hooks/           # Custom hooks
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   ├── app.ts           # Express app
│   │   └── server.ts        # Server entry
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── uploads/             # File uploads
│   └── package.json
│
├── shared/                  # Shared types (optional)
│   └── types.ts
│
├── docker-compose.yml       # Docker services
├── .gitignore
├── PROJECT_PLAN.md
├── TECH_STACK_FREE.md
└── GETTING_STARTED.md
```

---

## 🔧 Common Commands

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart postgres
```

### Database (Prisma)
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (DB GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Backend
```bash
cd backend

# Development mode
npm run dev

# Build for production
npm run build

# Run production
npm start
```

### Frontend
```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run type-check
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

### Prisma Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. ✅ Setup complete
2. 🎨 Build authentication system
3. 👥 Create user profiles
4. 💻 Implement code editor
5. 📹 Add video calling
6. 💬 Build chat system
7. 🎯 Create session management

---

## 🔗 Useful Links

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Socket.io Docs:** https://socket.io/docs
- **PeerJS Docs:** https://peerjs.com/docs
- **shadcn/ui:** https://ui.shadcn.com

---

## 💡 Tips

1. **Keep Docker running** - All database services run in Docker
2. **Use Prisma Studio** - Great for viewing/editing database
3. **Check logs** - Always check terminal logs for errors
4. **Hot Reload** - Both frontend and backend have hot reload
5. **Git Commits** - Commit frequently

---

**Setup Time:** ~20-30 minutes
**Cost:** $0 (100% Free)
**Ready for:** Local Development & MVP

Happy Coding! 🚀
