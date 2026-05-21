@echo off
setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "VENV_DIR=%PROJECT_DIR%venv"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

echo.
echo ==========================================
echo   FuelDocs OCR Tool - Setup ^& Launch
echo ==========================================
echo.

REM Check Python
python3 --version >nul 2>&1
if errorlevel 1 (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python not found.
        echo Please install Python 3.10+ from https://www.python.org/downloads/
        pause
        exit /b 1
    )
    set "PYTHON=python"
) else (
    set "PYTHON=python3"
)

echo [OK] Python found

REM Create venv if needed
if not exist "%VENV_DIR%" (
    echo Creating virtual environment...
    %PYTHON% -m venv "%VENV_DIR%"
    echo [OK] Virtual environment created
)

REM Activate venv
call "%VENV_DIR%\Scripts\activate.bat"

REM Install dependencies
echo Installing dependencies...
cd /d "%BACKEND_DIR%"
pip install -q -r requirements.txt
echo [OK] Dependencies installed

REM Create .env if missing
if not exist "%BACKEND_DIR%\.env" (
    echo Creating .env configuration file...
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env"
    echo [OK] Generated .env file
)

echo.
echo ==========================================
echo Starting FuelDocs OCR Tool...
echo ==========================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo.
echo FIRST TIME SETUP:
echo 1. Open: http://localhost:5173
echo 2. Go to Settings page
echo 3. Select LLM Provider (Google Gemini recommended - free)
echo 4. Paste your API key from https://aistudio.google.com/apikey
echo 5. Start uploading documents!
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start backend
cd /d "%BACKEND_DIR%"
start "FuelDocs Backend" %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

REM Wait for backend to start
timeout /t 3 /nobreak

REM Serve frontend
cd /d "%FRONTEND_DIR%\dist"
start "FuelDocs Frontend" %PYTHON% -m http.server 5173

echo.
echo All services started. Windows opened above.
pause
