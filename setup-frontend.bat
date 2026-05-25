@echo off
echo ================================
echo WebFlexi Frontend Setup
echo ================================
echo.

echo Creating Next.js frontend...
call npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git

cd frontend

echo.
echo Installing additional dependencies...
call npm install zustand @tanstack/react-query socket.io-client peerjs
call npm install react-hook-form zod @hookform/resolvers
call npm install date-fns lucide-react react-hot-toast
call npm install @monaco-editor/react yjs y-websocket y-monaco
call npm install axios framer-motion

echo.
echo Frontend setup complete!
echo.
echo Next steps:
echo 1. cd frontend
echo 2. Copy .env.example to .env.local
echo 3. npm run dev
echo.
pause
