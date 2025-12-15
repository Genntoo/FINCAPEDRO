# 📦 Proyecto: Sistema de Gestión de Reservas para Finca Rústica

## 🎯 Descripción del Proyecto

Aplicación web completa desarrollada en Python Flask para gestionar las reservas de una finca rústica para celebraciones. Incluye:

✅ **Calendario interactivo** con FullCalendar
✅ **Gestión completa de reservas** (crear, editar, eliminar)
✅ **Envío de mensajes WhatsApp** vía Twilio API
✅ **Dashboard con estadísticas** en tiempo real
✅ **Base de datos SQLite** (preparada para Azure SQL)
✅ **Sistema de autenticación** con login/registro
✅ **Diseño responsive** para móviles
✅ **Plantillas de mensajes** predefinidas

---

## 📂 Estructura del Proyecto

```
finca-reservas/
│
├── app.py                      # Aplicación Flask principal (Backend)
├── init_db.py                  # Script de inicialización de BD
├── startup.py                  # Script para Azure App Service
├── requirements.txt            # Dependencias Python
├── .env.example               # Ejemplo de variables de entorno
│
├── templates/                  # Plantillas HTML
│   ├── base.html              # Template base
│   ├── login.html             # Página de login
│   ├── register.html          # Página de registro
│   ├── index.html             # Dashboard principal
│   ├── calendario.html        # Vista de calendario
│   ├── reservas.html          # Listado de reservas
│   └── mensajes.html          # Historial WhatsApp
│
├── static/                     # Archivos estáticos
│   ├── css/
│   │   └── style.css          # Estilos personalizados
│   └── js/
│       ├── dashboard.js       # JavaScript del dashboard
│       ├── calendario.js      # JavaScript del calendario
│       └── reservas.js        # JavaScript de reservas
│
├── README.md                   # Documentación completa
└── QUICKSTART.md              # Guía de inicio rápido
```

---

## 🚀 INICIO RÁPIDO (3 pasos)

### 1️⃣ Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2️⃣ Inicializar base de datos
```bash
python init_db.py
```

### 3️⃣ Ejecutar aplicación
```bash
python app.py
```

**Accede a:** http://localhost:5000

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## 💻 Tecnologías Utilizadas

### Backend
- **Python 3.8+**
- **Flask 3.0** - Framework web
- **Flask-SQLAlchemy** - ORM para base de datos
- **Flask-Login** - Gestión de sesiones
- **Twilio API** - Envío de WhatsApp

### Frontend
- **HTML5 / CSS3**
- **Bootstrap 5** - Framework CSS responsive
- **JavaScript ES6**
- **FullCalendar** - Calendario interactivo
- **Chart.js** - Gráficos estadísticos

### Base de Datos
- **SQLite** (desarrollo y producción básica)
- **Azure SQL Database** (producción escalable)

---

## 🌐 Despliegue en Azure (Opción Económica)

### Opción 1: App Service - Plan F1 (GRATUITO)

```bash
# Instalar Azure CLI
# Windows: https://aka.ms/installazurecliwindows
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Crear grupo de recursos
az group create --name finca-rg --location westeurope

# Crear plan de App Service (Gratuito)
az appservice plan create --name finca-plan --resource-group finca-rg --sku F1 --is-linux

# Desplegar aplicación
az webapp up --name mi-finca-reservas --resource-group finca-rg --runtime "PYTHON:3.11"

# Configurar variables de entorno
az webapp config appsettings set --name mi-finca-reservas --resource-group finca-rg \
  --settings SECRET_KEY="clave-super-segura-cambiar"
```

**URL de tu app:** https://mi-finca-reservas.azurewebsites.net

### Costes Estimados

| Servicio | Plan | Coste Mensual |
|----------|------|---------------|
| Azure App Service | F1 (Free) | 0€ (60 min/día) |
| Azure App Service | B1 (Basic) | ~13€ |
| Base de Datos | SQLite | 0€ (incluida) |
| Azure SQL Database | Basic | ~5€ |
| Twilio WhatsApp | Pay as you go | ~0.005€/mensaje |

**Recomendación:** Empieza con F1 (gratis) para pruebas, luego actualiza a B1 si necesitas más recursos.

---

## 📱 Configuración de WhatsApp

### Paso 1: Crear cuenta Twilio
1. Ir a https://www.twilio.com/try-twilio
2. Registrarse (ofrece crédito gratuito de prueba)

### Paso 2: Configurar WhatsApp Sandbox
1. En el dashboard de Twilio, ir a "Messaging" > "Try it out" > "Send a WhatsApp message"
2. Seguir instrucciones para activar el sandbox
3. Obtener tu número de WhatsApp de Twilio

### Paso 3: Obtener credenciales
1. **Account SID**: En el dashboard principal
2. **Auth Token**: En el dashboard principal
3. **WhatsApp Number**: En la sección de WhatsApp

### Paso 4: Configurar en la app
Editar archivo `.env`:
```
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Nota:** Sin configurar Twilio, la app funciona normalmente pero los mensajes no se envían realmente (se simula el envío).

---

## 🗄️ Base de Datos

### Modelos de Datos

#### User (Usuario)
- id, username, email, password_hash, is_admin, created_at

#### Reserva
- id, cliente_nombre, cliente_telefono, cliente_email
- fecha_evento, hora_inicio, hora_fin
- num_invitados, tipo_celebracion
- precio, anticipo, estado, notas
- created_at, updated_at, user_id

#### Mensaje
- id, reserva_id, telefono_destino, contenido
- tipo, estado, twilio_sid
- enviado_at, user_id

### Migrar a Azure SQL Database

1. Crear Azure SQL Database:
```bash
az sql server create --name finca-sql --resource-group finca-rg \
  --location westeurope --admin-user sqladmin --admin-password TuPassword123!

az sql db create --name fincadb --server finca-sql --resource-group finca-rg \
  --service-objective Basic
```

2. Actualizar connection string en `.env`:
```
DATABASE_URL=mssql+pyodbc://sqladmin:TuPassword123!@finca-sql.database.windows.net/fincadb?driver=ODBC+Driver+18+for+SQL+Server
```

3. Instalar driver:
```bash
pip install pyodbc
```

---

## 🔐 Seguridad

### Checklist de Seguridad para Producción

- [ ] Cambiar `SECRET_KEY` a un valor aleatorio seguro
- [ ] Cambiar contraseña del usuario `admin`
- [ ] Habilitar HTTPS (automático en Azure)
- [ ] Configurar firewall de base de datos
- [ ] No compartir credenciales de Twilio
- [ ] Hacer copias de seguridad regulares
- [ ] Configurar límites de rate limiting
- [ ] Revisar logs regularmente

---

## 🎨 Personalización

### Cambiar colores del tema
Editar `static/css/style.css`:
```css
:root {
    --primary-color: #2d6a4f;      /* Verde principal */
    --secondary-color: #52b788;    /* Verde secundario */
    --accent-color: #74c69d;       /* Verde claro */
}
```

### Agregar logo
Reemplazar el icono `<i class="bi bi-tree">` en `templates/base.html`:
```html
<img src="{{ url_for('static', filename='images/logo.png') }}" alt="Logo">
```

### Modificar plantillas de mensajes
Editar función `aplicarPlantilla()` en `static/js/reservas.js`

---

## 📱 Conversión a App Móvil (Futuro)

### Opción 1: Progressive Web App (PWA)
- Agregar `manifest.json`
- Configurar Service Worker
- **Ventaja:** Sin necesidad de tiendas de apps

### Opción 2: React Native / Flutter
- Usar la API REST existente
- Crear interfaz móvil nativa
- **Ventaja:** Mejor rendimiento y UX

---

## 🔧 Solución de Problemas Comunes

### Error: "ModuleNotFoundError: No module named 'flask'"
```bash
pip install -r requirements.txt
```

### Error: "Port 5000 already in use"
Cambiar puerto en `app.py` línea final:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### La base de datos no se crea
```bash
python init_db.py
```

### Error al enviar WhatsApp
- Verificar credenciales de Twilio
- Comprobar que el número esté en formato internacional
- La app funciona sin Twilio (mensajes se simulan)

### Error en Azure deployment
```bash
# Ver logs
az webapp log tail --name mi-finca-reservas --resource-group finca-rg
```

---

## 🚀 Próximas Mejoras Sugeridas

1. **Exportar datos** a Excel/PDF
2. **Pagos online** (Stripe/PayPal)
3. **Notificaciones email** automáticas
4. **Sistema de recordatorios** automático
5. **Multi-idioma** (i18n)
6. **Calendario compartido** con clientes
7. **Gestión de inventario** (mesas, sillas, etc.)
8. **Sistema de reviews** post-evento
9. **Integración con Google Calendar**
10. **App móvil nativa**

---

## 📊 Métricas y Analíticas

### Estadísticas disponibles en el Dashboard:
- Reservas del mes actual
- Ingresos totales
- Mensajes enviados
- Próxima reserva
- Tipos de celebraciones (gráfico)

### Para agregar Google Analytics:
Añadir en `templates/base.html` antes de `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 💡 Consejos de Uso

### Para Desarrollo
- Usa SQLite (ya configurado)
- Habilita `debug=True` en `app.py`
- Prueba sin Twilio primero

### Para Producción
- Migra a Azure SQL Database
- Desactiva `debug=False`
- Configura backups automáticos
- Monitoriza logs en Azure

---

## 📞 Soporte y Documentación

- **README.md**: Documentación completa
- **QUICKSTART.md**: Guía de inicio rápido
- **Flask Docs**: https://flask.palletsprojects.com/
- **Azure Docs**: https://docs.microsoft.com/azure/app-service/
- **Twilio Docs**: https://www.twilio.com/docs/whatsapp

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - puedes usarlo libremente para proyectos personales o comerciales.

---

## ✅ Checklist de Implementación

### Fase 1: Setup Local (30 min)
- [ ] Instalar Python y dependencias
- [ ] Ejecutar `init_db.py`
- [ ] Probar aplicación en localhost
- [ ] Crear algunas reservas de prueba

### Fase 2: Configuración WhatsApp (1 hora)
- [ ] Crear cuenta Twilio
- [ ] Configurar WhatsApp Sandbox
- [ ] Agregar credenciales a `.env`
- [ ] Probar envío de mensajes

### Fase 3: Despliegue Azure (2 horas)
- [ ] Crear cuenta Azure
- [ ] Instalar Azure CLI
- [ ] Desplegar con `az webapp up`
- [ ] Configurar variables de entorno
- [ ] Probar app en producción

### Fase 4: Personalización (variable)
- [ ] Cambiar colores/tema
- [ ] Agregar logo
- [ ] Personalizar plantillas de mensajes
- [ ] Configurar dominio personalizado (opcional)

---

## 🎉 ¡Listo para Usar!

La aplicación está 100% funcional y lista para gestionar las reservas de tu finca rústica. 

**Disfruta gestionando tus reservas de manera profesional y eficiente!**

---

*Desarrollado con ❤️ usando Python Flask + Bootstrap + FullCalendar*
