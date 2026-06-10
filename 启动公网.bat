@echo off
cd /d "%~dp0"

REM Try python first, fallback to py launcher
where python >nul 2>nul
if %errorlevel% equ 0 (
    python -u 启动公网.py
) else (
    py -u 启动公网.py
)

pause
