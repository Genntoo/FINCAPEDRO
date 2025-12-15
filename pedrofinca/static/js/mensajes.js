// Gestión de conversaciones WhatsApp

let conversacionActual = null;
let intervalActualizacion = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarConversaciones();
    configurarWebhookUrl();
    
    // Actualizar conversaciones cada 10 segundos
    setInterval(cargarConversaciones, 10000);
});

function configurarWebhookUrl() {
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/api/whatsapp/webhook`;
    document.getElementById('webhookUrl').value = webhookUrl;
}

function copiarWebhook() {
    const webhookInput = document.getElementById('webhookUrl');
    webhookInput.select();
    document.execCommand('copy');
    
    mostrarAlerta('success', 'URL del webhook copiada al portapapeles');
}

async function cargarConversaciones() {
    try {
        const response = await fetch('/mensajes');
        const html = await response.text();
        
        // Extraer datos de mensajes del servidor
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Obtener todos los mensajes únicos por teléfono
        const mensajes = await fetch('/api/mensajes/agrupados');
        
        if (!mensajes.ok) {
            // Si no existe el endpoint, crear uno alternativo
            await cargarConversacionesAlternativo();
            return;
        }
        
        const conversaciones = await mensajes.json();
        mostrarListaConversaciones(conversaciones);
        
    } catch (error) {
        console.error('Error al cargar conversaciones:', error);
    }
}

async function cargarConversacionesAlternativo() {
    // Método alternativo: agrupar manualmente desde los datos
    const listaConversaciones = document.getElementById('listaConversaciones');
    listaConversaciones.innerHTML = '<div class="text-center p-3 text-muted">Cargando...</div>';
}

function mostrarListaConversaciones(conversaciones) {
    const lista = document.getElementById('listaConversaciones');
    
    if (conversaciones.length === 0) {
        lista.innerHTML = '<div class="text-center p-3 text-muted">No hay conversaciones</div>';
        return;
    }
    
    lista.innerHTML = conversaciones.map(conv => `
        <a href="#" class="list-group-item list-group-item-action ${conv.telefono === conversacionActual ? 'active' : ''}"
           onclick="abrirConversacion('${conv.telefono}', '${conv.nombre}'); return false;">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${conv.nombre}</h6>
                <small>${conv.ultimo_mensaje_fecha}</small>
            </div>
            <p class="mb-1 small text-truncate">${conv.ultimo_mensaje}</p>
            ${conv.no_leidos > 0 ? `<span class="badge bg-danger">${conv.no_leidos}</span>` : ''}
        </a>
    `).join('');
}

async function abrirConversacion(telefono, nombre) {
    conversacionActual = telefono;
    
    // Actualizar encabezado
    document.getElementById('nombreContacto').textContent = nombre;
    document.getElementById('telefonoContacto').textContent = telefono;
    document.getElementById('areaEnvio').style.display = 'block';
    
    // Cargar mensajes
    await cargarMensajes(telefono);
    
    // Actualizar lista de conversaciones
    cargarConversaciones();
    
    // Iniciar actualización automática cada 5 segundos
    if (intervalActualizacion) {
        clearInterval(intervalActualizacion);
    }
    intervalActualizacion = setInterval(() => cargarMensajes(telefono), 5000);
}

async function cargarMensajes(telefono) {
    try {
        const response = await fetch(`/api/conversacion/${encodeURIComponent(telefono)}`);
        const mensajes = await response.json();
        
        mostrarMensajes(mensajes);
        
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        document.getElementById('areaConversacion').innerHTML = 
            '<div class="alert alert-danger">Error al cargar los mensajes</div>';
    }
}

function mostrarMensajes(mensajes) {
    const area = document.getElementById('areaConversacion');
    
    if (mensajes.length === 0) {
        area.innerHTML = '<div class="text-center text-muted mt-5">No hay mensajes en esta conversación</div>';
        return;
    }
    
    area.innerHTML = mensajes.map(msg => {
        const esSaliente = msg.direccion === 'saliente';
        const claseAlineacion = esSaliente ? 'text-end' : 'text-start';
        const claseBurbuja = esSaliente ? 'bg-success text-white' : 'bg-white';
        
        return `
            <div class="${claseAlineacion} mb-2">
                <div class="d-inline-block ${claseBurbuja} rounded px-3 py-2" style="max-width: 70%;">
                    <div>${msg.contenido}</div>
                    <small class="d-block mt-1" style="font-size: 0.75rem; opacity: 0.8;">
                        ${msg.fecha}
                        ${esSaliente ? getEstadoIcono(msg.estado) : ''}
                    </small>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll al final
    area.scrollTop = area.scrollHeight;
}

function getEstadoIcono(estado) {
    switch(estado) {
        case 'enviado':
            return '<i class="bi bi-check-all"></i>';
        case 'fallido':
            return '<i class="bi bi-exclamation-circle"></i>';
        case 'pendiente':
            return '<i class="bi bi-clock"></i>';
        default:
            return '';
    }
}

async function enviarMensajeRapido(event) {
    event.preventDefault();
    
    const mensaje = document.getElementById('nuevoMensaje').value.trim();
    
    if (!mensaje || !conversacionActual) return;
    
    try {
        const response = await fetch('/api/whatsapp/enviar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telefono: conversacionActual,
                mensaje: mensaje,
                reserva_id: null
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('nuevoMensaje').value = '';
            await cargarMensajes(conversacionActual);
        } else {
            mostrarAlerta('danger', result.error || 'Error al enviar mensaje');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al enviar el mensaje');
    }
}

function usarPlantilla(tipo) {
    if (!conversacionActual) {
        mostrarAlerta('warning', 'Selecciona primero una conversación');
        return;
    }
    
    const plantillas = {
        'confirmacion': 'Hola, confirmamos tu reserva en nuestra finca rústica. Te esperamos para celebrar tu evento especial. Si tienes alguna consulta, no dudes en contactarnos.',
        'recordatorio': 'Hola, te recordamos que tu evento en nuestra finca será dentro de 7 días. ¿Necesitas realizar algún cambio o tienes alguna pregunta?',
        'recordatorio_24h': '¡Hola! Mañana es tu gran día. Tu evento será mañana en nuestra finca. Estamos preparando todo para que sea perfecto. ¡Nos vemos pronto!',
        'agradecimiento': 'Muchas gracias por celebrar tu evento en nuestra finca rústica. Esperamos que todo haya sido de tu agrado. ¡Esperamos verte pronto de nuevo!'
    };
    
    const input = document.getElementById('nuevoMensaje');
    input.value = plantillas[tipo] || '';
    input.focus();
}

async function actualizarConversacion() {
    if (conversacionActual) {
        await cargarMensajes(conversacionActual);
        mostrarAlerta('success', 'Conversación actualizada');
    }
}

function mostrarAlerta(tipo, mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Limpiar intervalo al salir
window.addEventListener('beforeunload', function() {
    if (intervalActualizacion) {
        clearInterval(intervalActualizacion);
    }
});
