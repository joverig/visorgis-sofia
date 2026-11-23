@echo off
rem Genera muestras MP3 con las voces de Azure en espanol (necesita voz\azure.txt con tu clave)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0muestras_voz.ps1"
pause
