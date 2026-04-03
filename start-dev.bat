@echo off
echo Starting Volvo Research Workbench...
echo.

REM Kill any existing processes on port 3001 and 3000
echo Cleaning up ports 3000 / 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting frontend + API (npm run dev)...
start "Volvo dev" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Volvo Research Workbench is starting...
echo ========================================
echo Frontend: http://localhost:3000/volvo-new/
echo API Server: http://localhost:3001
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo All servers stopped.
