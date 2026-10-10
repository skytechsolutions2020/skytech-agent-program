@echo off
REM Version: V2.0 (2026-10-10) - push-to-github.bat - V2.0
REM Purpose : uploads all saved releases (commits + tags) to the private GitHub repository.
REM Steps   : 1) checks for git lock files left by a crashed git (SKY-GIT-002)
REM           2) runs the secret scan - stops if a password, key or .env would be uploaded (SKY-SEC-004)
REM           3) git push of branch main, then of all release tags (R1.0, R2.0 ...)
REM Errors  : SKY-GIT-005 git missing, SKY-GIT-002 lock file, SKY-GIT-001 sign-in, SKY-GIT-004 GitHub newer, SKY-SEC-004 secret found.
REM           Every code is explained in docs\architecture\SkyTech_Troubleshooting_Guide.html
REM Run     : double-click after SkyTech_Manager reports a new release.
cd /d "%~dp0"
where git >nul 2>nul || (echo [SKY-GIT-005] git is not installed or not on PATH. Install Git for Windows. & pause & exit /b 1)

REM --- 1. lock files -----------------------------------------------------------
for %%L in (.git\index.lock .git\HEAD.lock .git\refs\heads\main.lock) do (
  if exist "%%L" (
    echo [SKY-GIT-002] Found %%L left by an interrupted git command.
    echo Fix: close GitHub Desktop and any git window, delete %%L, then run this file again.
    pause & exit /b 1
  )
)

REM --- 2. secret scan (needs Node.js) -------------------------------------------
where node >nul 2>nul && (
  node scripts\security\scan-secrets.js
  if errorlevel 1 (echo. & echo Upload stopped to protect your secrets. & pause & exit /b 1)
) || echo [warning] Node.js not found - secret scan skipped.

REM --- 3. upload ---------------------------------------------------------------
echo Uploading SkyTech releases to GitHub...
git push origin main
if errorlevel 1 goto fail
git push origin --tags
if errorlevel 1 goto fail
echo.
echo Done. GitHub is up to date.
git log -1 --oneline --decorate
pause
exit /b 0
:fail
echo.
echo [SKY-GIT-001 or SKY-GIT-004] Upload failed (no internet, sign-in expired, or GitHub has newer commits).
echo Fix: open GitHub Desktop and click Push origin, or send SkyTech_Manager a screenshot.
pause
exit /b 1
REM Version: V2.0 (2026-10-10) - push-to-github.bat - V2.0
