// Reservas functionality

document.addEventListener('DOMContentLoaded', function() {
    configurarFiltros();
});

function configurarFiltros() {
    const buscar = document.getElementById('buscarReserva');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroTipo = document.getElementById('filtroTipo');
    
    buscar.addEventListener('input', filtrarReservas);
    filtroEstado.addEventListener('change', filtrarReservas);
    filtroTipo.addEventListener('change', filtrarReservas);
}

function filtrarReservas() {
    const buscar = document.getElementById('buscarReserva').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    const tipo = document.getElementById('filtroTipo').value;
    
    // Filtrar filas de tabla (desktop)
    const filas = document.querySelectorAll('#tablaReservas tbody tr');
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        const estadoFila = fila.dataset.estado;
        const tipoFila = fila.dataset.tipo;
        
        const coincideBusqueda = texto.includes(buscar);
        const coincideEstado = !estado || estadoFila === estado;
        const coincideTipo = !tipo || tipoFila === tipo;
        
        if (coincideBusqueda && coincideEstado && coincideTipo) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
    
    // Filtrar cards (móvil)
    const cards = document.querySelectorAll('.reserva-card');
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        const estadoCard = card.dataset.estado;
        const tipoCard = card.dataset.tipo;
        
        const coincideBusqueda = texto.includes(buscar);
        const coincideEstado = !estado || estadoCard === estado;
        const coincideTipo = !tipo || tipoCard === tipo;
        
        if (coincideBusqueda && coincideEstado && coincideTipo) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

async function verDetalle(reservaId) {
    // Implementar vista de detalle si es necesario
    alert('Funcionalidad de detalle (ID: ' + reservaId + ')');
}

function enviarWhatsApp(reservaId, telefono, clienteNombre) {
    document.getElementById('whatsapp_reserva_id').value = reservaId;
    document.getElementById('whatsapp_telefono').value = telefono;
    document.getElementById('whatsapp_cliente').value = clienteNombre;
    document.getElementById('whatsapp_mensaje').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('whatsappModal'));
    modal.show();
}

function aplicarPlantilla() {
    const plantilla = document.getElementById('plantillaMensaje').value;
    const clienteNombre = document.getElementById('whatsapp_cliente').value;
    
    let mensaje = '';
    
    switch(plantilla) {
        case 'confirmacion':
            mensaje = `Hola ${clienteNombre}, confirmamos tu reserva en nuestra finca rústica. Te esperamos para celebrar tu evento especial. Si tienes alguna consulta, no dudes en contactarnos.`;
            break;
        case 'recordatorio':
            mensaje = `Hola ${clienteNombre}, te recordamos que tu evento en nuestra finca será dentro de 7 días. ¿Necesitas realizar algún cambio o tienes alguna pregunta?`;
            break;
        case 'recordatorio_24h':
            mensaje = `Hola ${clienteNombre}, ¡mañana es tu gran día! Tu evento será mañana en nuestra finca. Estamos preparando todo para que sea perfecto. ¡Nos vemos pronto!`;
            break;
        case 'agradecimiento':
            mensaje = `Hola ${clienteNombre}, muchas gracias por celebrar tu evento en nuestra finca rústica. Esperamos que todo haya sido de tu agrado. ¡Esperamos verte pronto de nuevo!`;
            break;
    }
    
    document.getElementById('whatsapp_mensaje').value = mensaje;
}

async function enviarMensajeWhatsApp() {
    const reservaId = document.getElementById('whatsapp_reserva_id').value;
    const telefono = document.getElementById('whatsapp_telefono').value;
    const mensaje = document.getElementById('whatsapp_mensaje').value;
    
    if (!mensaje.trim()) {
        alert('Por favor, escribe un mensaje');
        return;
    }
    
    try {
        const response = await fetch('/api/whatsapp/enviar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telefono: telefono,
                mensaje: mensaje,
                reserva_id: reservaId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('whatsappModal')).hide();
            mostrarAlerta('success', result.message || 'Mensaje enviado correctamente');
            document.getElementById('whatsappForm').reset();
        } else {
            mostrarAlerta('warning', result.message || result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al enviar el mensaje');
    }
}

async function eliminarReserva(reservaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;
    
    try {
        const response = await fetch(`/api/reservas/${reservaId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            mostrarAlerta('success', 'Reserva eliminada correctamente');
            setTimeout(() => location.reload(), 1500);
        } else {
            mostrarAlerta('danger', 'Error al eliminar: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al eliminar la reserva');
    }
}

async function cambiarEstado(reservaId, nuevoEstado) {
    try {
        const response = await fetch(`/api/reservas/${reservaId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const estadoTexto = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);
            mostrarAlerta('success', `Estado cambiado a: ${estadoTexto}`);
            setTimeout(() => location.reload(), 1000);
        } else {
            mostrarAlerta('danger', 'Error al cambiar estado: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al cambiar el estado');
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
    }, 5000);
}
