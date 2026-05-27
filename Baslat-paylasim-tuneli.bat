@echo off
cd /d "%~dp0"
echo Proje klasoru: %CD%
echo.
echo Bu pencere acikken paylasim linki calisir. Kapatirsan veya eski linki acarsan DNS hatasi (NXDOMAIN) gorursun.
echo.
call npm run dev:share
pause
