@echo off
setlocal
cd /d "%~dp0"

echo Starting Flask app...
"..\.venv\Scripts\python.exe" app.py

pause
