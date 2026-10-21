@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 22+ and try again.
  pause
  exit /b 1
)
node start-preview.mjs
if errorlevel 1 pause
