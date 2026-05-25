# Backend Setup Guide

## Quick Setup (Run these commands in order)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
```bash
# Copy example env file
copy .env.example .env

# Edit .env and update values if needed
```

### 3. Start Docker Services (from project root)
```bash
cd ..
docker-compose up -d

# Verify services are running
docker ps
```

### 4. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 5. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

### 6. Start Development Server
```bash
npm run dev
```

## Verification

### Check if backend is running
Open http://localhost:5000/health in your browser. You should see:
```json
{
  "success": true,
  "message": "WebFlexi API is running",
  "timestamp": "2024-12-08T...",
  "environment": "development"
}
```

### Test Database with Prisma Studio
```bash
npx prisma studio
```
Opens at http://localhost:5555

## Common Commands

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (WARNING: Deletes all data)
npm run prisma:reset

# Lint code
npm run lint

# Format code
npm run format
```

## Testing API Endpoints

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "JUNIOR"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (use token from login response)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Port 5000 already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Docker containers not starting
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Prisma errors
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset

# Push schema without migration
npx prisma db push
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After backend is running:
1. Test all auth endpoints
2. Set up frontend
3. Test WebSocket connection
4. Implement remaining features

## Production Deployment

1. Set strong JWT secrets in .env
2. Set NODE_ENV=production
3. Use environment variables for all secrets
4. Enable HTTPS
5. Set up proper CORS origins
6. Configure rate limiting
7. Set up logging and monitoring
