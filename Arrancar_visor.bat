@echo off
rem Arranca visorgis_sofia en http://localhost:8081/ (Ctrl+C para pararlo)
rem Usa el PHP portable del entorno VisorGIS (..\VisorGIS\php) solo como servidor estatico.
set "PHP=%~dp0..\VisorGIS\php\php.exe"
if not exist "%~dp0www\index.html" (echo Falta el codigo en www & pause & exit /b 1)
if exist "%PHP%" (
  start "" "http://localhost:8081/"
  "%PHP%" -n -S localhost:8081 -t "%~dp0www"
  exit /b
)
echo No hay servidor: falta ..\VisorGIS\php\php.exe (1_Instalar_PHP.bat de VisorGIS) y no hay Node.
pause
