# 🆕 Nueva Funcionalidad: Conversaciones WhatsApp Bidireccionales

## ✨ Cambios Implementados

### 1. Modelo de Base de Datos Actualizado

**Nuevos campos en el modelo `Mensaje`:**
- `telefono_origen` - Número desde donde se envía el mensaje
- `direccion` - Tipo de mensaje: 'saliente' o 'entrante'

Esto permite diferenciar entre mensajes que tú envías y mensajes que recibes.

### 2. Webhook para Recibir Mensajes

**Nuevo endpoint:** `/api/whatsapp/webhook`
- Recibe automáticamente los mensajes entrantes de Twilio
- Guarda los mensajes en la base de datos
- Asocia mensajes con reservas cuando es posible

### 3. Interfaz de Conversaciones

**Nueva vista de mensajes completamente rediseñada:**

**Panel izquierdo:**
- Lista de todas las conversaciones
- Muestra nombre del cliente (si existe reserva) o número de teléfono
- Vista del último mensaje
- Hora del último mensaje

**Panel central:**
- Vista de conversación completa tipo WhatsApp
- Burbujas de chat diferenciadas:
  - **Verde claro**: Tus mensajes (salientes)
  - **Blanco**: Mensajes del cliente (entrantes)
- Scroll automático al último mensaje
- Actualización automática cada 5 segundos

**Panel inferior:**
- Campo de texto para responder rápidamente
- Botón de envío
- Actualización en tiempo real

### 4. Funcionalidades Adicionales

- **Plantillas rápidas** - Botones para respuestas predefinidas
- **URL del webhook** - Se muestra y se puede copiar fácilmente
- **Agrupación de conversaciones** - Por número de teléfono
- **Historial completo** - Se mantienen todos los mensajes

## 🚀 Cómo Usar

### Paso 1: Migrar la Base de Datos

```bash
python migrate_db.py
```

Esto agregará los nuevos campos a la tabla de mensajes.

### Paso 2: Configurar Webhook en Twilio

1. Ve a la sección **Mensajes** de tu aplicación
2. Copia la URL del webhook mostrada
3. Ve a [Twilio Console](https://console.twilio.com)
4. **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
5. Pega la URL en "When a message comes in"
6. Selecciona método **POST**
7. Guarda

### Paso 3: Probar

1. Envía un mensaje desde tu WhatsApp al número de Twilio
2. Ve a la sección **Mensajes** en la aplicación
3. Verás aparecer la conversación en la lista
4. Haz clic para ver el historial completo
5. ¡Responde directamente desde ahí!

## 📱 Estructura de la Vista de Mensajes

```
┌─────────────────────────────────────────────────────────────┐
│  📱 Mensajería WhatsApp                                      │
├──────────────────┬──────────────────────────────────────────┤
│ Conversaciones   │  Conversación con Juan Pérez             │
│                  │  +34 600 123 456                          │
│ ┌──────────────┐ │ ┌────────────────────────────────────┐   │
│ │ Juan Pérez   │ │ │                                    │   │
│ │ Hola...      │ │ │  Hola, buenos días    [11:30] ✓✓  │   │
│ │ 14:30        │ │ │                                    │   │
│ └──────────────┘ │ │ Buenos días! ¿En qué    [11:31]   │   │
│                  │ │ puedo ayudarte?                     │   │
│ ┌──────────────┐ │ │                                    │   │
│ │ María López  │ │ │  Información sobre    [11:32] ✓✓  │   │
│ │ Gracias...   │ │ │  precios                           │   │
│ │ Ayer         │ │ │                                    │   │
│ └──────────────┘ │ └────────────────────────────────────┘   │
│                  │                                           │
│ ┌──────────────┐ │ ┌────────────────────────────────────┐   │
│ │ Webhook URL  │ │ │ Escribe un mensaje...        Enviar│   │
│ │ [Copiar]     │ │ └────────────────────────────────────┘   │
│ └──────────────┘ │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

## 🎨 Características Visuales

### Burbujas de Chat Estilo WhatsApp
- Fondo tipo WhatsApp (#e5ddd5)
- Burbujas redondeadas con sombras
- Mensajes propios en verde claro
- Mensajes recibidos en blanco
- Iconos de estado (✓✓ enviado, ⏰ pendiente, ❌ error)

### Actualización en Tiempo Real
- La conversación activa se actualiza cada 5 segundos
- La lista de conversaciones se actualiza cada 10 segundos
- Scroll automático al último mensaje

### Responsive Design
- Funciona en móviles y tablets
- Interfaz adaptable
- Optimizado para pantallas pequeñas

## 📊 Datos Almacenados

Cada mensaje guarda:
- `id` - Identificador único
- `reserva_id` - Asociación con reserva (si existe)
- `telefono_origen` - De dónde viene el mensaje
- `telefono_destino` - A dónde va el mensaje
- `contenido` - Texto del mensaje
- `tipo` - 'whatsapp'
- `direccion` - 'saliente' o 'entrante'
- `estado` - 'enviado', 'recibido', 'fallido'
- `twilio_sid` - ID de Twilio
- `enviado_at` - Fecha y hora
- `user_id` - Usuario que envió (solo salientes)

## 🔧 Endpoints de API

### `POST /api/whatsapp/webhook`
Recibe mensajes de Twilio (público, sin autenticación)

**Parámetros:**
- `From` - Número origen
- `To` - Número destino
- `Body` - Contenido del mensaje
- `MessageSid` - ID de Twilio

### `GET /api/conversacion/<telefono>`
Obtiene todos los mensajes de una conversación

**Respuesta:**
```json
[
  {
    "id": 1,
    "contenido": "Hola, ¿disponibilidad?",
    "direccion": "entrante",
    "estado": "recibido",
    "fecha": "14/12/2024 10:30",
    "telefono_origen": "whatsapp:+34600123456",
    "telefono_destino": "whatsapp:+14155238886"
  }
]
```

### `GET /api/mensajes/agrupados`
Obtiene lista de conversaciones con último mensaje

**Respuesta:**
```json
[
  {
    "telefono": "whatsapp:+34600123456",
    "nombre": "Juan Pérez",
    "ultimo_mensaje": "Gracias por la información...",
    "ultimo_mensaje_fecha": "14/12 14:30",
    "no_leidos": 0
  }
]
```

## 📝 Archivos Modificados

1. **app.py**
   - Modelo `Mensaje` actualizado
   - Webhook agregado
   - Nuevos endpoints

2. **templates/mensajes.html**
   - Interfaz completamente rediseñada
   - Vista de conversaciones
   - Panel de chat

3. **static/js/mensajes.js**
   - Gestión de conversaciones
   - Actualización en tiempo real
   - Envío de mensajes

4. **static/css/style.css**
   - Estilos para burbujas de chat
   - Colores tipo WhatsApp
   - Animaciones

5. **migrate_db.py** (NUEVO)
   - Script de migración de base de datos

6. **CONFIGURAR_WEBHOOK.md** (NUEVO)
   - Guía detallada de configuración

## ⚠️ Importante

### Antes de Usar
1. **EJECUTA LA MIGRACIÓN:** `python migrate_db.py`
2. **REINICIA LA APP:** `python app.py`
3. **CONFIGURA EL WEBHOOK** en Twilio

### En Desarrollo Local
- Usa **ngrok** para exponer tu localhost
- El webhook necesita URL pública

### En Producción
- Asegúrate de que la app esté desplegada
- Usa HTTPS (Azure lo provee automáticamente)
- Configura el webhook con tu URL de producción

## 🎯 Próximas Mejoras Sugeridas

1. **Notificaciones push** cuando llega un mensaje
2. **Marcado de mensajes como leídos**
3. **Búsqueda en conversaciones**
4. **Archivos adjuntos** (imágenes, documentos)
5. **Mensajes programados**
6. **Respuestas automáticas**
7. **Etiquetas para conversaciones**
8. **Exportar conversaciones**

## 🐛 Solución de Problemas

### No recibo mensajes entrantes
1. Verifica que el webhook esté configurado en Twilio
2. Comprueba que la URL sea accesible públicamente
3. Revisa los logs de Twilio Console → Monitor → Errors

### Los mensajes no aparecen en la interfaz
1. Abre la consola del navegador (F12)
2. Verifica errores de JavaScript
3. Comprueba que `/api/mensajes/agrupados` devuelva datos

### Error al ejecutar migrate_db.py
1. Haz backup de tu base de datos
2. Elimina `finca_reservas.db`
3. Ejecuta `python init_db.py`
4. La nueva base de datos ya tendrá los campos correctos

## 📚 Documentación Adicional

- Ver **CONFIGURAR_WEBHOOK.md** para guía detallada del webhook
- Ver **README.md** para documentación general
- Ver **QUICKSTART.md** para inicio rápido

---

**¡Disfruta de las conversaciones bidireccionales con tus clientes!** 💬✨
