@echo off
REM Schedule daily validation at 6 PM

echo ========================================
echo StockPulse Prediction Validation
echo ========================================
echo.

cd /d "%~dp0.."

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Run validation
python scripts\validate_predictions.py

echo.
echo ========================================
echo Validation complete!
echo ========================================
pause