@echo off
title SHALOM CONNECTHUB INDIA - Local Production Preview
cd /d "%~dp0"
echo Building latest SHALOM CONNECTHUB INDIA bundle...
call npm.cmd run build
if errorlevel 1 (
  pause
  exit /b 1
)
echo Starting SHALOM CONNECTHUB INDIA Preview Server on http://127.0.0.1:4173 ...
start "" "http://127.0.0.1:4173"
call npx.cmd vite preview --host 127.0.0.1 --port 4173 --strictPort
pause
