@echo off
rem Calcula las rutas a pie entre los puntos de "Viajando por Sofia" (tarda unos minutos)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0calcular_rutas.ps1"
pause
