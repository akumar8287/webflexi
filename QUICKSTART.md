# 🚀 Quick Start - How to Run WebFlexi Solutions

## ✅ What You Need

### 1. Software Requirements
- ✅ **Node.js 20+** - Already installed (you have it)
- ⚠️ **Docker Desktop** - REQUIRED to run databases
  - Download: https://www.docker.com/products/docker-desktop/
  - Install and start Docker Desktop
- ✅ **Git** - Already installed

### 2. Check Your Installation
```bash
node --version    # Should show v20+
npm --version     # Should work
docker --version  # Must work - install Docker if this fails
```

---

## 🎯 3 Steps to Run the Application

### Step 1: Start Docker (Databases)
```bash
# In the project root (d:\Aman\Projects\webflexi)
docker-compose up -d
```

**What this does:**
- Starts PostgreSQL database (port 5432)
- Starts Redis cache (port 6379)
- Starts PeerJS server for video calls (port 9000)

**Verify it's running:**
```bash
docker ps
```
You should see 3 containers running.

---

### Step 2: Start Backend Server

Open a **NEW terminal** and run:

```bash
# Go to backend folder
cd d:\Aman\Projects\webflexi\backend

# Make sure .env file exists (already created)
# If not: copy .env.example .env

# Initialize database (FIRST TIME ONLY)
npx prisma generate
npx prisma migrate dev --name init

# Start the backend server
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
✅ Redis connected successfully
🚀 WebFlexi Backend Server is running
📍 URL: http://localhost:5000
```

**Test it works:**
Open http://localhost:5000/health in your browser - should see JSON response.

---

### Step 3: Start Frontend

Open **ANOTHER NEW terminal** and run:

```bash
# Go to frontend folder
cd d:\Aman\Projects\webflexi\frontend

# Start the frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.18
- Local:   http://localhost:3000
```

**Access the app:**
Open http://localhost:3000 in your browser!

---

## 🎉 That's It! Your App is Running

You should now see:
- **Frontend**: http://localhost:3000 (the website)
- **Backend**: http://localhost:5000 (API server)

---

## 📝 What You Have Now

### ✅ Currently Implemented:
1. **Homepage** - Landing page with features
2. **Login Page** - http://localhost:3000/auth/login
3. **Register Page** - http://localhost:3000/auth/register
4. **Backend API** - Authentication endpoints
5. **Database** - PostgreSQL with Prisma ORM
6. **Real-time** - Socket.io server ready
7. **Video Server** - PeerJS server for video calls

### 🚧 Still To Build:
1. Dashboard (Junior/Senior views)
2. Code Editor with Monaco
3. Video calling integration
4. Real-time chat
5. Session management
6. Mentor search/matching

---

## 🧪 Test the Application

### 1. Create an Account
- Go to http://localhost:3000
- Click "Get Started" or "Sign up"
- Choose "Junior Developer" or "Senior Developer"
- Fill in the form
- Click "Create Account"

### 2. Login
- Go to http://localhost:3000/auth/login
- Enter your email and password
- Click "Sign In"
- You'll be redirected to /dashboard (needs to be built)

---

## 🛑 Stop the Application

### Stop Frontend
- Press `Ctrl + C` in the frontend terminal

### Stop Backend
- Press `Ctrl + C` in the backend terminal

### Stop Docker
```bash
docker-compose down
```

---

## 🔄 Restart the Application

Every time you want to work:

**Terminal 1:**
```bash
docker-compose up -d
```

**Terminal 2:**
```bash
cd backend
npm run dev
```

**Terminal 3:**
```bash
cd frontend
npm run dev
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Docker not running
**Error:** "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop application first

### Issue 2: Port already in use
**Error:** "Port 5000 already in use"
**Solution:**
```bash
# Windows - kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Or change port in `backend/.env`:
```
PORT=5001
```

### Issue 3: Database connection error
**Error:** "Can't reach database server"
**Solution:**
```bash
# Restart Docker
docker-compose down
docker-compose up -d

# Wait 10 seconds, then retry backend
```

### Issue 4: Frontend can't connect to backend
**Solution:** Make sure backend is running on http://localhost:5000

Check `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main website |
| **Backend API** | http://localhost:5000 | REST API |
| **Health Check** | http://localhost:5000/health | API status |
| **PeerJS** | http://localhost:9000 | Video call server |
| **PostgreSQL** | localhost:5432 | Database (use Prisma Studio) |
| **Redis** | localhost:6379 | Cache server |

---

## 🗄️ View Database

```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555 - You can see and edit database records.

---

## 📁 Project Structure

```
webflexi/
├── frontend/          ✅ Next.js (READY)
├── backend/           ✅ Express.js (READY)
└── docker-compose.yml ✅ Services (READY)
```

---

## 🎓 Next Steps - Build More Features

After you have the app running, we can build:

1. **Dashboard** - Different views for Junior/Senior users
2. **Code Editor** - Monaco Editor integration
3. **Video Calls** - PeerJS implementation
4. **Chat System** - Real-time messaging
5. **Session Management** - Schedule and manage sessions
6. **Mentor Search** - Find and connect with mentors

---

## 💡 Development Tips

### Keep 3 Terminals Open:
1. **Docker** - `docker-compose up -d` (run once)
2. **Backend** - `cd backend && npm run dev` (auto-reloads)
3. **Frontend** - `cd frontend && npm run dev` (auto-reloads)

### Hot Reload:
Both frontend and backend auto-reload when you edit files!

### Check Logs:
- Backend logs appear in Terminal 2
- Frontend logs appear in Terminal 3
- Docker logs: `docker-compose logs -f`

---

## ❓ Quick Commands Reference

```bash
# Start everything
docker-compose up -d                    # Start databases
cd backend && npm run dev              # Start backend
cd frontend && npm run dev             # Start frontend

# Stop everything
# Ctrl+C in frontend terminal
# Ctrl+C in backend terminal
docker-compose down                     # Stop databases

# Database commands
cd backend
npx prisma studio                      # View database
npx prisma migrate dev                 # Update database
npx prisma generate                    # Regenerate client

# Check what's running
docker ps                              # Docker containers
netstat -ano | findstr :3000          # Frontend port
netstat -ano | findstr :5000          # Backend port
```

---

## 🎯 Current Status Summary

### ✅ What's Working:
- ✅ Frontend landing page
- ✅ Login/Register pages with validation
- ✅ Backend API with authentication
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Video server (PeerJS)
- ✅ Real-time WebSocket server

### 🔨 What's Next:
- Build dashboard UI
- Add code editor
- Implement video calling
- Create chat interface

---

## 📞 Need Help?

If something doesn't work:
1. Check all terminals for error messages
2. Make sure Docker is running
3. Verify all services are on correct ports
4. Check the troubleshooting section above

---

**You're all set! 🎉**

Run the 3 commands (Docker, Backend, Frontend) and start coding!
