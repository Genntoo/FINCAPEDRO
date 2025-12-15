# 📱 Guía de Configuración del Webhook de WhatsApp

Esta guía te ayudará a configurar el webhook de Twilio para recibir mensajes entrantes en tu aplicación.

## 🎯 ¿Qué es un Webhook?

Un webhook es una URL que Twilio llamará cada vez que recibas un mensaje de WhatsApp. Esto permite que tu aplicación se entere de los mensajes entrantes en tiempo real.

## 📋 Requisitos Previos

1. ✅ Tener la aplicación ejecutándose
2. ✅ Tener cuenta de Twilio configurada
3. ✅ Haber ejecutado la migración de base de datos: `python migrate_db.py`

## 🔧 Pasos de Configuración

### Opción A: Aplicación en Producción (Azure, etc.)

1. **Desplegar la aplicación en Azure** (o cualquier servidor con URL pública)
   
2. **Obtener la URL del webhook**
   - La URL será: `https://tu-app.azurewebsites.net/api/whatsapp/webhook`
   - También puedes copiarla desde la sección de Mensajes de la aplicación

3. **Configurar en Twilio Console**
   - Ve a https://console.twilio.com
   - Navega a: **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
   - En el campo **"When a message comes in"**, pega tu URL webhook
   - Método: **POST**
   - Guarda los cambios

4. **Verificar funcionamiento**
   - Envía un mensaje de prueba desde WhatsApp
   - Ve a la sección de Mensajes en tu aplicación
   - Deberías ver el mensaje entrante

### Opción B: Desarrollo Local con ngrok

Si estás desarrollando localmente y quieres probar el webhook:

1. **Instalar ngrok**
   ```bash
   # Windows (con chocolatey)
   choco install ngrok
   
   # Mac (con homebrew)
   brew install ngrok
   
   # O descarga desde: https://ngrok.com/download
   ```

2. **Ejecutar tu aplicación local**
   ```bash
   python app.py
   ```

3. **Crear túnel con ngrok**
   ```bash
   ngrok http 5000
   ```
   
   Esto te dará una URL pública temporal como: `https://abc123.ngrok.io`

4. **Configurar webhook en Twilio**
   - URL: `https://abc123.ngrok.io/api/whatsapp/webhook`
   - Método: POST

5. **Probar**
   - Envía un mensaje desde WhatsApp
   - Verás en la terminal de ngrok la petición entrante
   - El mensaje aparecerá en tu aplicación

### Opción C: Configuración para Número Aprobado

Si ya tienes un número de WhatsApp aprobado por Twilio:

1. **Ve a Twilio Console**
   - **Phone Numbers** → **Manage** → **Active Numbers**

2. **Selecciona tu número de WhatsApp**

3. **En la sección de Messaging**
   - **Configure With**: Webhooks/TwiML
   - **A message comes in**: Tu URL webhook + método POST
   - Guarda los cambios

## 🧪 Probar el Webhook

### 1. Verificar que la migración se ejecutó
```bash
python migrate_db.py
```

### 2. Reiniciar la aplicación
```bash
python app.py
```

### 3. Enviar mensaje de prueba
- Desde tu WhatsApp, envía un mensaje al número de Twilio
- Ve a la aplicación → Sección "Mensajes"
- Deberías ver el mensaje en la lista de conversaciones

### 4. Responder
- Haz clic en la conversación
- Escribe una respuesta
- El cliente recibirá tu mensaje

## 🔍 Solución de Problemas

### El webhook no recibe mensajes

**Verificar URL del webhook:**
```bash
# Debe ser accesible públicamente
curl https://tu-app.com/api/whatsapp/webhook
```

**Revisar logs de Twilio:**
1. Ve a Twilio Console → Monitor → Logs → Errors
2. Busca errores relacionados con el webhook
3. Verifica que la URL sea correcta y el servidor esté respondiendo

**Verificar que la base de datos tiene los nuevos campos:**
```bash
python migrate_db.py
```

### Los mensajes no aparecen en la aplicación

**Verificar en la base de datos:**
```python
# Ejecutar en Python
from app import app, db, Mensaje
with app.app_context():
    mensajes = Mensaje.query.all()
    for m in mensajes:
        print(f"{m.direccion}: {m.contenido}")
```

**Revisar consola del navegador:**
- Abre DevTools (F12)
- Ve a la pestaña Console
- Busca errores de JavaScript

### Error 500 en el webhook

Esto indica un error en el servidor. Revisa:

1. **Logs de la aplicación**
   ```bash
   # Si usas Azure
   az webapp log tail --name tu-app --resource-group tu-rg
   ```

2. **Verificar que el modelo está actualizado**
   - Elimina la base de datos SQLite
   - Ejecuta `python init_db.py` de nuevo

## 📊 Formato de Datos del Webhook

Twilio envía estos datos cuando recibes un mensaje:

```
From: whatsapp:+1234567890
To: whatsapp:+0987654321
Body: Hola, quisiera información
MessageSid: SM1234567890abcdef
```

Tu aplicación los guarda así:
- `telefono_origen`: From
- `telefono_destino`: To
- `contenido`: Body
- `twilio_sid`: MessageSid
- `direccion`: 'entrante'

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Recibir mensajes de clientes
- ✅ Ver conversaciones completas
- ✅ Responder directamente desde la aplicación
- ✅ Mantener historial de todas las comunicaciones

## 📝 Notas Importantes

1. **Seguridad**: El webhook es público, asegúrate de validar las peticiones en producción
2. **Costes**: Cada mensaje entrante y saliente tiene un coste en Twilio
3. **Límites**: Twilio Sandbox tiene límites, considera un número aprobado para producción
4. **Persistencia**: Los mensajes se guardan en tu base de datos permanentemente

## 🔗 Enlaces Útiles

- [Documentación de Webhooks de Twilio](https://www.twilio.com/docs/usage/webhooks)
- [WhatsApp API de Twilio](https://www.twilio.com/docs/whatsapp/api)
- [Guía de ngrok](https://ngrok.com/docs)

---

**¿Necesitas ayuda?** Revisa los logs de tu aplicación y de Twilio Console para identificar problemas.
