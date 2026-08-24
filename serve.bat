@echo off
chcp 65001 >nul
echo ============================================
echo   Fish Keeper - Dev Server
echo ============================================
echo.
echo   URL: http://localhost:8000
echo   Press Ctrl+C to stop
echo.
python -m http.server 8000
