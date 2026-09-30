@echo off
setlocal
cd /d "%~dp0"
start "Ledgerly server" /min cmd /c "npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173/"
endlocal
