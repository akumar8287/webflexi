# WebFlexi Solutions - Project Initialization Guide

## 🎯 Complete Setup Instructions

### Prerequisites Checklist
- ✅ Node.js 20+ installed
- ✅ Docker Desktop installed and running
- ✅ Git installed
- ✅ VS Code (recommended)

---

## Step 1: Start Docker Services

```bash
# From project root
docker-compose up -d

# Verify all services are running
docker ps

# You should see:
# - webflexi-postgres
# - webflexi-redis
# - webflexi-peerjs
# - webflexi-pgadmin
```

---

## Step 2: Setup Backend

### 2.1 Install Backend Dependencies
```bash
cd backend
npm install
```

### 2.2 Create Environment File
```bash
# Copy example file
copy .env.example .env

# The default values in .env.example should work for local development
```

### 2.3 Initialize Database
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 2.4 Start Backend Server
```bash
npm run dev

# Should see:
# ✅ Database connected successfully
# ✅ Redis connected successfully
# 🚀 WebFlexi Backend Server is running
# 📍 URL: http://localhost:5000
```

### 2.5 Test Backend
Open http://localhost:5000/health in browser. Should see:
```json
{
  "success": true,
  "message": "WebFlexi API is running"
}
```

---

## Step 3: Setup Frontend

### 3.1 Create Next.js App
```bash
# Go back to project root
cd ..

# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

# Answer prompts:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? Yes
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No
```

### 3.2 Install Frontend Dependencies
```bash
cd frontend

# Core dependencies
npm install zustand @tanstack/react-query socket.io-client peerjs

# Form handling
npm install react-hook-form zod @hookform/resolvers

# UI and utilities
npm install date-fns lucide-react react-hot-toast axios

# Code editor and collaboration
npm install @monaco-editor/react yjs y-websocket y-monaco

# Animation
npm install framer-motion
```

### 3.3 Install shadcn/ui
```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Follow prompts (use defaults)
# Install common components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add textarea
```

### 3.4 Create Environment File
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_PEER_HOST=localhost
NEXT_PUBLIC_PEER_PORT=9000
```

### 3.5 Start Frontend
```bash
npm run dev

# Should see:
# ▲ Next.js 14.x.x
# - Local:   http://localhost:3000
```

---

## Step 4: Verify Complete Setup

### Check All Services
1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:5000/health
3. **PeerJS Server**: http://localhost:9000
4. **Prisma Studio**: Run `npx prisma studio` in backend folder
5. **pgAdmin**: http://localhost:5050
   - Email: admin@webflexi.com
   - Password: admin

### Test Backend API
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"role\":\"JUNIOR\"}"
```

---

## Step 5: Development Workflow

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Terminal 3: Database (Optional)
```bash
cd backend
npx prisma studio
```

---

## Project Structure After Setup

```
webflexi/
├── frontend/                    # ✅ Next.js app
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   └── lib/                # Utilities
│   ├── public/
│   ├── .env.local              # ✅ Frontend environment
│   └── package.json
│
├── backend/                     # ✅ Express.js API
│   ├── src/
│   │   ├── config/             # Database, Redis config
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Auth, error handling
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   ├── app.ts              # Express app
│   │   └── server.ts           # Server entry
│   ├── prisma/
│   │   └── schema.prisma       # ✅ Database schema
│   ├── .env                    # ✅ Backend environment
│   └── package.json
│
├── docker-compose.yml           # ✅ Docker services
├── README.md
├── PROJECT_PLAN.md
└── GETTING_STARTED.md
```

---

## Common Issues & Solutions

### Issue: Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different port in backend/.env
PORT=5001
```

### Issue: Docker containers not starting
```bash
docker-compose down
docker-compose up -d --build
```

### Issue: Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

### Issue: Module not found
```bash
# In backend or frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps After Setup

1. ✅ All services running
2. 🎨 Start building UI components
3. 🔐 Implement authentication flow
4. 💻 Build code editor page
5. 📹 Add video calling
6. 💬 Implement chat
7. 🎯 Create session management

---

## Useful Commands Reference

### Docker
```bash
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f            # View logs
docker-compose restart postgres   # Restart service
```

### Backend
```bash
npm run dev                       # Development
npm run build                     # Build for production
npm run prisma:studio            # Open DB GUI
npm run prisma:migrate           # Run migrations
```

### Frontend
```bash
npm run dev                       # Development
npm run build                     # Build for production
npm run lint                      # Lint code
```

---

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **PeerJS**: http://localhost:9000
- **Prisma Studio**: http://localhost:5555 (when running)
- **pgAdmin**: http://localhost:5050

---

**Estimated Setup Time**: 20-30 minutes
**Total Cost**: $0 (100% Free!)

Happy Coding! 🚀
