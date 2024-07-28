#!/bin/sh

# Limpiar la pantalla
clear

# Crear package.json si no existe
if [ ! -f "package.json" ]; then
  echo '{
    "name": "video-downloader",
    "version": "1.0.0",
    "description": "Proyecto para descargar videos de YouTube",
    "main": "1.js",
    "scripts": {
      "start": "node 1.js"
    },
    "dependencies": {
      "axios": "^0.21.1",
      "dotenv": "^10.0.0",
      "readline-sync": "^1.4.10",
      "sanitize-filename": "^1.6.3"
    },
    "author": "yoshiro",
    "license": "ISC"
  }' > package.json
fi

# Instalar dependencias
npm install

# Ejecutar el script
node responder.js