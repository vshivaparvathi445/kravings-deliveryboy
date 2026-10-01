@echo off
echo ============================================
echo   Kravings Backend - Setup and Run
echo ============================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from python.org
    pause & exit /b 1
)

if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt --quiet

if not exist ".env" (
    echo .env not found - copying from .env.example...
    copy .env.example .env
    echo IMPORTANT: Open .env and set your MYSQL_PASSWORD first!
    pause
)

if not exist "uploads\" mkdir uploads

echo.
echo Starting Flask on http://localhost:5000
echo Health: http://localhost:5000/api/health
echo.
python app.py
pause
