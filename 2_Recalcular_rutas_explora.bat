@echo off
rem Recalcula los caminos a pie de Explora Sofia (www\explora\datos\rutas.geojson) con OpenStreetMap.
rem Solo recalcula las rutas cuyos puntos han cambiado de sitio. Para rehacerlas todas:
rem   2_Recalcular_rutas_explora.bat --todas
set PYTHONUTF8=1
set "PY="
for %%P in (python py python3.13 python3.12 python3) do if not defined PY (%%P -c "1" >nul 2>&1 && set "PY=%%P")
if not defined PY (echo No se encuentra Python. Instala Python 3 y vuelve a probar. & pause & exit /b 1)
cd /d "%~dp0herramientas\explora"
%PY% recalcular_rutas.py %* || goto error
echo.
echo Revisa arriba los avisos (minutos cambiados o paradas lejos del camino).
pause
exit /b 0
:error
echo.
echo Ha fallado el calculo de rutas. Copia el mensaje de arriba y pasaselo a Claude.
pause
exit /b 1
