@echo off
title URBAN RUSH - Dev Server
echo.
echo  ========================================
echo   URBAN RUSH - Starting Dev Server...
echo  ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found! Install Node.js first.
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Running dev server...
echo.
echo  >> Buka browser ke: http://localhost:3000
echo  >> Tekan Ctrl+C untuk stop server
echo.
call npm run dev

echo.
echo Server stopped.
pause
