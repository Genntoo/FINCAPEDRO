# 🚀 Guía de Inicio Rápido

## Opción 1: Inicio Rápido (Recomendado)

### Paso 1: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 2: Inicializar base de datos
```bash
python init_db.py
```

### Paso 3: Ejecutar aplicación
```bash
python app.py
```

### Paso 4: Acceder a la aplicación
Abre tu navegador en: **http://localhost:5000**

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## Opción 2: Configuración Manual

### 1. Instalar Python 3.8+
Descarga desde: https://www.python.org/downloads/

### 2. Crear entorno virtual (opcional pero recomendado)
```bash
python -m venv venv

# Activar en Windows:
venv\Scripts\activate

# Activar en Linux/Mac:
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno (opcional)
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

### 5. Inicializar base de datos
```bash
python init_db.py
```

### 6. Ejecutar aplicación
```bash
python app.py
```

---

## 📱 Configurar WhatsApp (Opcional)

Para habilitar el envío de mensajes por WhatsApp:

1. Crear cuenta en **Twilio**: https://www.twilio.com/try-twilio
2. Activar WhatsApp Sandbox
3. Obtener credenciales y configurarlas en `.env`:
   ```
   TWILIO_ACCOUNT_SID=tu_account_sid
   TWILIO_AUTH_TOKEN=tu_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

**Sin configurar Twilio:** La aplicación funcionará normalmente, pero los mensajes no se enviarán realmente (aparecerá un mensaje de simulación).

---

## 🌐 Despliegue en Azure

### Opción más económica: Azure App Service (Plan F1 - Gratuito)

```bash
# 1. Instalar Azure CLI
# Windows: https://aka.ms/installazurecliwindows
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login en Azure
az login

# 3. Crear recursos
az group create --name finca-rg --location westeurope
az appservice plan create --name finca-plan --resource-group finca-rg --sku F1 --is-linux

# 4. Crear y desplegar aplicación
az webapp up --name finca-reservas-[tunombre] --resource-group finca-rg --runtime "PYTHON:3.11"

# 5. Configurar variables de entorno
az webapp config appsettings set --name finca-reservas-[tunombre] --resource-group finca-rg \
  --settings SECRET_KEY="cambiar-por-clave-segura"
```

Tu aplicación estará disponible en: `https://finca-reservas-[tunombre].azurewebsites.net`

### Costes estimados:
- **Plan F1 (Gratuito)**: 0€/mes (limitaciones: 60 min/día, 1GB RAM)
- **Plan B1 (Básico)**: ~13€/mes (sin limitaciones de tiempo)

---

## ❓ Solución de Problemas

### Error: "No module named 'flask'"
```bash
pip install -r requirements.txt
```

### Error: "Port 5000 already in use"
Cambia el puerto en `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### La base de datos no se crea
```bash
python init_db.py
```

### Problemas con WhatsApp
- Verifica que las credenciales de Twilio estén correctas
- La aplicación funciona sin WhatsApp (los mensajes se simularán)

---

## 📖 Funcionalidades Principales

1. **Dashboard**: Vista general con estadísticas
2. **Calendario**: Gestión visual de reservas
3. **Reservas**: Lista completa con filtros
4. **Mensajes**: Historial de comunicaciones WhatsApp

---

## 🎯 Próximos Pasos

1. ✅ Testear la aplicación localmente
2. ⚙️ Configurar WhatsApp (opcional)
3. ☁️ Desplegar en Azure
4. 🎨 Personalizar estilos y textos
5. 📱 Convertir a app móvil (React Native/Flutter)

---

## 💡 Consejos

- Usa el **Plan F1 de Azure** para pruebas (gratis)
- Actualiza a **Plan B1** cuando necesites más recursos
- Haz copias de seguridad de `finca_reservas.db` regularmente
- Cambia la contraseña del admin después de la primera instalación

¡Listo para gestionar tus reservas! 🎉
