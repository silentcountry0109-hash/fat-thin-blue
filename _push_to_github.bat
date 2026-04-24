@echo off
cd /d %~dp0
echo === Pushing panglanpen-web to GitHub ===
if exist .git\index.lock del .git\index.lock
git push origin main
echo.
pause
