@echo off
rem Regenera el itinerario (www\itinerario\datos\itinerario.json y voz\textos\itinerario.json)
rem Calcula solo las rutas nuevas o cambiadas y las guarda en herramientas\itinerario\tramos.json
set PYTHONUTF8=1
set "PY="
for %%P in (python py python3.13 python3.12 python3) do if not defined PY (%%P -c "1" >nul 2>&1 && set "PY=%%P")
if not defined PY (echo No se encuentra Python. Instala Python 3 y vuelve a probar. & pause & exit /b 1)
cd /d "%~dp0herramientas\itinerario"
%PY% build_dias.py || goto error
%PY% run_itin.py || goto error
echo.
echo Itinerario generado. Revisa arriba si aparece algun "ojo tiempos".
pause
exit /b 0
:error
echo.
echo Ha fallado la generacion. Revisa el mensaje de arriba.
pause
exit /b 1
