@echo off
REM Version: V1.0 (2026-10-02) - push-to-github.bat - V1.0
REM Uploads all saved releases (commits + tags) to GitHub. Double-click after SkyTech_Manager reports a new release.
cd /d "%~dp0"
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
echo Upload failed. Open GitHub Desktop and click Push origin, or send SkyTech_Manager a screenshot.
pause
exit /b 1
