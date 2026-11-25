@echo off
rem Publica VisorGIS Sofia: sube la version, commit y push a main y actualiza gh-pages con www.
rem Uso: publicar.bat  o  publicar.bat "Descripcion de los cambios"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publicar.ps1" %*
if errorlevel 1 (
  echo.
  echo Ha fallado la publicacion. Revisa el mensaje de arriba.
  pause
  exit /b 1
)
echo.
pause
