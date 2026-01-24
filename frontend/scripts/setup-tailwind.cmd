@echo off
echo Script de setup de Tailwind neutralizado. Borra este archivo si ya no lo necesitas.
pause
npm install --save-dev tailwindcss postcss autoprefixer
if ERRORLEVEL 1 (
  echo ERROR instalando dependencias. Revisa tu conexion o permisos.
  pause
  exit /b 1
)

echo 2) Ejecutando npx tailwindcss init -p
npx tailwindcss init -p
if ERRORLEVEL 1 (
  echo npx tailwindcss init falló — intentando alternativas...
  echo Alternativa 1: npx -p tailwindcss@latest tailwindcss init -p
  npx -p tailwindcss@latest tailwindcss init -p
  if ERRORLEVEL 1 (
    echo Alternativa 2: npx --ignore-existing tailwindcss init -p
    npx --ignore-existing tailwindcss init -p
    if ERRORLEVEL 1 (
      echo Todas las alternativas fallaron. Intenta limpiar cache: npm cache clean --force
      echo O revisa tu PATH / instalacion de Node y npm.
      pause
      exit /b 1
    )
  )
)

echo Tailwind configurado correctamente (tailwind.config.js y postcss.config.js deberían existir).
pause
