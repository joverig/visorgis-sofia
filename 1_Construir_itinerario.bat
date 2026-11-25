@echo off
rem Regenera el itinerario (www\itinerario\datos\itinerario.json y voz\textos\itinerario.json)
rem Calcula solo las rutas nuevas o cambiadas y las guarda en herramientas\itinerario\tramos.json
cd /d "%~dp0herramientas\itinerario"
python build_dias.py || goto error
python run_itin.py || goto error
echo.
echo Itinerario generado. Revisa arriba si aparece algun "ojo tiempos".
pause
exit /b 0
:error
echo.
echo Ha fallado la generacion. Revisa el mensaje de arriba.
pause
exit /b 1
