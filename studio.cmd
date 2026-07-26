@echo off
REM ═══════════════════════════════════════════════════════════════════════
REM  Soboof Studio — double-click this file to add work to the site.
REM  Opens a page in your browser. Close this window when you are done.
REM ═══════════════════════════════════════════════════════════════════════

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed, and the studio needs it.
  echo   Get it from https://nodejs.org  ^(the LTS button^), then run this again.
  echo.
  pause
  exit /b 1
)

start "" http://localhost:4000
node tools\studio\server.js

echo.
echo   The studio has stopped.
pause
