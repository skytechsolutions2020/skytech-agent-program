@echo off
REM Version: V1.0 (2026-10-02) - admin-site/start-admin.bat - V1.0
cd /d "%~dp0"
if not exist node_modules (echo Installing for first use... & call npm install)
if not exist .env (echo Missing .env - copy .env.example to .env and fill it in. & pause & exit /b 1)
start "" http://127.0.0.1:3030
node server.js
pause
