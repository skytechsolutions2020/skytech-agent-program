@echo off
REM Version: V2.0 (2026-10-10) - admin-site/start-admin.bat - V2.0
REM Purpose : starts the SkyTech Admin site on http://127.0.0.1:3030 (this computer only).
REM Steps   : 1) installs packages on first use  2) stops if .env is missing (SKY-CFG-001)
REM           3) runs "npm run doctor" - shows problems with SkyTech codes and fixes; stops on a red X
REM           4) opens the browser and starts the server (log: ..\logs\runtime\admin-YYYY-MM-DD.log)
REM Errors  : see docs\architecture\SkyTech_Troubleshooting_Guide.html
cd /d "%~dp0"
where node >nul 2>nul || (echo [SKY-CFG-004] Node.js is not installed. Install the LTS version from nodejs.org. & pause & exit /b 1)
if not exist node_modules (echo Installing for first use... & call npm install || (echo [SKY-CFG-007] npm install failed. & pause & exit /b 1))
if not exist .env (echo [SKY-CFG-001] Missing .env - copy .env.example to .env and fill it in. & pause & exit /b 1)
call npm run --silent doctor
if errorlevel 1 (echo. & echo Fix the items marked X above, then run start-admin.bat again. & pause & exit /b 1)
start "" http://127.0.0.1:3030
node server.js
pause
REM Version: V2.0 (2026-10-10) - admin-site/start-admin.bat - V2.0
