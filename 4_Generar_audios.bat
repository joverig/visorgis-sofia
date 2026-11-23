@echo off
rem Genera la narracion de todas las fichas con la voz de voz\config.json
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0generar_audios.ps1"
pause
