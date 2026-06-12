@echo off
echo Installing Agent Dependencies...
call npm install
echo.
echo Starting TechNext Aronium Agent...
echo Keep this window open to continuously sync to the cloud.
echo.
node aronium-sync-agent.js
pause
