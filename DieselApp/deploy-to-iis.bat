@echo off
REM Script para copiar archivos de DieselApp a IIS
REM IMPORTANTE: Ajusta la ruta de destino según tu configuración de IIS

echo ========================================
echo   Actualizacion de DieselApp en IIS
echo ========================================
echo.

REM Define la ruta de origen (donde está el build)
set ORIGEN=c:\Users\85233588\Documents\Diesel\DieselApp\dist

REM Define la ruta de destino en IIS (CAMBIA ESTO según tu servidor)
REM Ejemplos comunes:
REM set DESTINO=C:\inetpub\wwwroot\DieselApp
REM set DESTINO=C:\inetpub\wwwroot
set DESTINO=C:\inetpub\wwwroot\DieselApp

echo Origen: %ORIGEN%
echo Destino: %DESTINO%
echo.

REM Pregunta al usuario si quiere continuar
set /p CONFIRMAR=¿Deseas copiar los archivos? (S/N): 
if /i not "%CONFIRMAR%"=="S" (
    echo Operacion cancelada.
    pause
    exit /b
    
)

echo.
echo Copiando archivos...

REM Copia todos los archivos y carpetas, sobrescribiendo los existentes
xcopy "%ORIGEN%\*.*" "%DESTINO%\" /E /Y /I

echo.
echo ========================================
echo   Archivos copiados exitosamente!
echo ========================================
echo.
echo IMPORTANTE: 
echo 1. Verifica que el archivo web.config esté presente
echo 2. Recicla el Application Pool en IIS
echo.

pause
