@echo off
chcp 65001 >nul
title SSVC Web - Q + Enter to stop
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12 or later is required. Install it from https://nodejs.org/
  echo Node.js 22.12以降をインストールしてから、もう一度実行してください。
  pause
  exit /b 1
)
node scripts\start-local.mjs --packaged %*
if errorlevel 1 (
  pause
  exit /b 1
)
