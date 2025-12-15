# Sistema de Gestión de Reservas - Finca Rústica

Aplicación web para gestionar reservas de una finca rústica para celebraciones, con calendario interactivo, gestión de mensajes WhatsApp y base de datos integrada.

## 🚀 Características

- ✅ **Calendario interactivo** con FullCalendar para visualizar y gestionar reservas
- ✅ **Gestión completa de reservas**: crear, editar, eliminar
- ✅ **Envío de mensajes WhatsApp** a clientes (vía Twilio)
- ✅ **Plantillas de mensajes** predefinidas (confirmación, recordatorios, agradecimiento)
- ✅ **Dashboard con estadísticas** en tiempo real
- ✅ **Base de datos** para almacenar toda la información
- ✅ **Sistema de autenticación** con login/registro
- ✅ **Diseño responsive** preparado para móviles

## 📋 Requisitos Previos

- Python 3.8 o superior
- Cuenta de Azure (para despliegue en la nube)
- Cuenta de Twilio (opcional, para WhatsApp)

## 🔧 Instalación Local

### 1. Clonar o descargar el proyecto

```bash
cd finca-reservas
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y modifica los valores:

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones.

### 5. Inicializar la base de datos

```bash
python app.py
```

La base de datos SQLite se creará automáticamente al iniciar la aplicación.

### 6. Crear usuario administrador (opcional)

```bash
flask --app app create-admin
```

### 7. Ejecutar la aplicación

```bash
python app.py
```

La aplicación estará disponible en: `http://localhost:5000`

**Usuario de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

## ☁️ Despliegue en Azure (Opción Económica)

### Opción 1: Azure App Service (Plan Gratuito/Básico)

1. **Crear Azure App Service:**
```bash
az login
az group create --name finca-rg --location westeurope
az appservice plan create --name finca-plan --resource-group finca-rg --sku F1 --is-linux
az webapp create --name finca-reservas --resource-group finca-rg --plan finca-plan --runtime "PYTHON:3.11"
```

2. **Configurar variables de entorno en Azure:**
```bash
az webapp config appsettings set --name finca-reservas --resource-group finca-rg --settings \
    SECRET_KEY="tu-clave-secreta" \
    TWILIO_ACCOUNT_SID="tu_sid" \
    TWILIO_AUTH_TOKEN="tu_token" \
    TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

3. **Desplegar la aplicación:**
```bash
az webapp up --name finca-reservas --resource-group finca-rg
```

### Opción 2: Azure Container Instances (Más económico)

Crear un `Dockerfile` y desplegar como contenedor.

### Costes Estimados

- **Plan F1 (Gratuito)**: 0€/mes (limitado a 60 min/día)
- **Plan B1 (Básico)**: ~13€/mes
- **Base de datos SQLite**: 0€ (incluida en la app)
- **Mensajes Twilio**: ~0.005€ por mensaje

## 📱 Configuración de WhatsApp (Twilio)

1. Crear cuenta en [Twilio](https://www.twilio.com/try-twilio)
2. Activar WhatsApp Sandbox o solicitar número aprobado
3. Obtener credenciales:
   - Account SID
   - Auth Token
   - WhatsApp Number
4. Configurar en `.env` o variables de entorno de Azure

**Nota:** Twilio ofrece crédito gratuito de prueba.

## 🗄️ Base de Datos

### SQLite (Desarrollo y producción básica)
- Ya configurado por defecto
- Archivo `finca_reservas.db` en la raíz del proyecto

### Azure SQL Database (Producción escalable)
Para cambiar a Azure SQL, modifica en `.env`:
```
DATABASE_URL=mssql+pyodbc://usuario:contraseña@servidor.database.windows.net/basedatos?driver=ODBC+Driver+18+for+SQL+Server
```

Instalar dependencias adicionales:
```bash
pip install pyodbc
```

## 📚 Estructura del Proyecto

```
finca-reservas/
├── app.py                 # Aplicación Flask principal
├── requirements.txt       # Dependencias Python
├── .env.example          # Ejemplo de configuración
├── static/
│   ├── css/
│   │   └── style.css     # Estilos personalizados
│   └── js/
│       ├── dashboard.js  # JavaScript del dashboard
│       ├── calendario.js # JavaScript del calendario
│       └── reservas.js   # JavaScript de reservas
└── templates/
    ├── base.html         # Template base
    ├── login.html        # Página de login
    ├── register.html     # Página de registro
    ├── index.html        # Dashboard
    ├── calendario.html   # Vista de calendario
    ├── reservas.html     # Lista de reservas
    └── mensajes.html     # Historial de mensajes
```

## 🔐 Seguridad

- Cambiar `SECRET_KEY` en producción
- Usar HTTPS en producción (Azure lo proporciona automáticamente)
- No compartir credenciales de Twilio
- Crear copias de seguridad regulares de la base de datos

## 🛠️ Próximas Mejoras

- [ ] Exportar reservas a Excel/PDF
- [ ] Sistema de pagos online
- [ ] Notificaciones por email
- [ ] App móvil nativa (React Native/Flutter)
- [ ] Multi-idioma
- [ ] Sistema de recordatorios automáticos

## 📞 Soporte

Para problemas o preguntas, crea un issue en el repositorio.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
