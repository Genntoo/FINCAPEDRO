#!/bin/bash

# Detener en caso de error
set -e

echo "🚀 Iniciando despliegue..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

# Inicializar base de datos si no existe
if [ ! -f "finca_reservas.db" ]; then
    echo "🗄️  Inicializando base de datos..."
    python init_db.py
fi

echo "✅ Despliegue completado"
