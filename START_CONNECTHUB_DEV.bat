@echo off
title SHALOM CONNECTHUB INDIA - Local Dev Server
cd /d "%~dp0"
echo Starting SHALOM CONNECTHUB INDIA Vite Dev Server...
start "" "http://localhost:5173"
call npm.cmd run dev
pause
