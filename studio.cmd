@echo off
REM ═══════════════════════════════════════════════════════════════════════
REM  Soboof Studio — double-click this file (or the desktop icon) to edit
REM  the site and add work to it. It starts Studio's server and opens the
REM  site in your browser as soon as the server is up. Clicked again while
REM  Studio is running, it only opens the browser. Close this window when
REM  you are done: that stops Studio.
REM ═══════════════════════════════════════════════════════════════════════

cd /d "%~dp0"
title Soboof Studio

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed, and the studio needs it.
  echo   Get it from https://nodejs.org  ^(the LTS button^), then run this again.
  echo.
  pause
  exit /b 1
)

node tools\studio\server.js --open
if not errorlevel 1 exit /b 0

echo.
echo   The studio has stopped.
pause
