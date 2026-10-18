@echo off
title InsureGraph Starter
echo ========================================================
echo   Starting InsureGraph (Neo4j Insurance Platform)
echo ========================================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "InsureGraph Backend" cmd /k "cd /d C:\db\insurance-project\backend && npm run dev"

timeout /t 2 >nul

echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "InsureGraph Frontend" cmd /k "cd /d C:\db\insurance-project\frontend && npm run dev"

echo.
echo ========================================================
echo   Servers are launching!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ========================================================
echo.
timeout /t 3 >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173
