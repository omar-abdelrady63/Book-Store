@echo off
echo Stopping Flask app.py process if running...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { ($_.Name -match 'python|py') -and ($_.CommandLine -match 'flask project\\app\.py') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo Done.
pause
