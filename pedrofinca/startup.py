# Configuración para Azure App Service
# Este archivo se usa para configurar el servidor web en Azure

import os
from app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 443)))
