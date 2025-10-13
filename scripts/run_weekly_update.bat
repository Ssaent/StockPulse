@echo off
REM Weekly model update for StockPulse

cd /d "%~dp0.."
call .venv\Scripts\activate.bat

echo Starting weekly model update...
python scripts\auto_update.py --mode existing

echo Update completed!
pause