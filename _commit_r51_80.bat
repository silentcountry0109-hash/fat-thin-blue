@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Removing stale git lockfile (if any) ===
if exist ".git\index.lock" del /f /q ".git\index.lock"

echo.
echo === git status ===
git status --short | more

echo.
echo === git add -A ===
git add -A

echo.
echo === git commit ===
git commit -m "r51-r80: regenerate JPEG with unified r01-style header" -m "- Re-render from Word-source stamped PDFs at 130 DPI / quality 82" -m "- Banner + centered PMingLiU title matching r01 layout" -m "- Correct page counts: r52 7->6, r56/r61/r75/r80 6->5"

echo.
echo === git push ===
git push

echo.
echo === DONE ===
pause
