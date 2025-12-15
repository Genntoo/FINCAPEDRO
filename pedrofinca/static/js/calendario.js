// Calendario functionality con FullCalendar

let calendar;
let reservaActualId = null;

function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            list: 'Lista'
        },
        events: '/api/reservas',
        eventClick: function(info) {
            mostrarDetalleReserva(info.event);
        },
        dateClick: function(info) {
            // Limpiar y preparar para nueva reserva
            limpiarFormularioCalendario();
            document.getElementById('fecha_evento').value = info.dateStr;
            const modal = new bootstrap.Modal(document.getElementById('nuevaReservaModal'));
            modal.show();
        },
        eventColor: '#2d6a4f',
        height: 'auto',
        contentHeight: 'auto',
        aspectRatio: 1.8
    });
    
    calendar.render();
}

function mostrarDetalleReserva(event) {
    reservaActualId = event.id;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Cliente:</strong> ${event.extendedProps.cliente}</p>
                <p><strong>Teléfono:</strong> ${event.extendedProps.telefono}</p>
                <p><strong>Fecha:</strong> ${new Date(event.start).toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${new Date(event.start).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} - 
                   ${new Date(event.end).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Tipo:</strong> ${event.title.split(' - ')[1] || 'No especificado'}</p>
                <p><strong>Invitados:</strong> ${event.extendedProps.invitados || 'No especificado'}</p>
                <p><strong>Precio:</strong> ${event.extendedProps.precio ? event.extendedProps.precio.toFixed(2) + '€' : 'No especificado'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('detalleReservaContent').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('detalleReservaModal'));
    modal.show();
}

async function guardarReserva() {
    const form = document.getElementById('reservaForm');
    const formData = new FormData(form);
    const reservaId = document.getElementById('reserva_id').value;
    
    // Si es edición, usar método tradicional
    if (reservaId) {
        const data = {
            cliente_nombre: formData.get('cliente_nombre'),
            cliente_telefono: formData.get('cliente_telefono'),
            cliente_email: formData.get('cliente_email'),
            fecha_evento: formData.get('fecha_evento'),
            hora_inicio: formData.get('hora_inicio'),
            hora_fin: formData.get('hora_fin'),
            num_invitados: parseInt(formData.get('num_invitados')) || 0,
            tipo_celebracion: formData.get('tipo_celebracion'),
            precio: parseFloat(formData.get('precio')) || 0,
            anticipo: parseFloat(formData.get('anticipo')) || 0,
            notas: formData.get('notas')
        };
        
        try {
            const response = await fetch(`/api/reservas/${reservaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('nuevaReservaModal')).hide();
                calendar.refetchEvents();
                mostrarAlerta('success', 'Reserva actualizada correctamente');
                form.reset();
            } else {
                mostrarAlerta('danger', 'Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('danger', 'Error al actualizar la reserva');
        }
        return;
    }
    
    // Nueva reserva - manejar múltiples fechas
    const fechas = calObtenerFechasAReservar();
    
    if (fechas.length === 0) {
        mostrarAlerta('warning', 'Por favor selecciona al menos una fecha');
        return;
    }

    if (!formData.get('cliente_nombre') || !formData.get('cliente_telefono')) {
        mostrarAlerta('warning', 'Por favor completa todos los campos requeridos');
        return;
    }

    const dataBase = {
        cliente_nombre: formData.get('cliente_nombre'),
        cliente_telefono: formData.get('cliente_telefono'),
        cliente_email: formData.get('cliente_email'),
        hora_inicio: formData.get('hora_inicio'),
        hora_fin: formData.get('hora_fin'),
        num_invitados: parseInt(formData.get('num_invitados')) || 0,
        tipo_celebracion: formData.get('tipo_celebracion'),
        precio: parseFloat(formData.get('precio')) || 0,
        anticipo: parseFloat(formData.get('anticipo')) || 0,
        notas: formData.get('notas')
    };
    
    try {
        const promesas = fechas.map(fecha => {
            const data = { ...dataBase, fecha_evento: fecha };
            
            return fetch('/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        });

        const respuestas = await Promise.all(promesas);
        
        const exitos = respuestas.filter(r => r.ok).length;
        const fallos = respuestas.length - exitos;

        bootstrap.Modal.getInstance(document.getElementById('nuevaReservaModal')).hide();
        calendar.refetchEvents();
        form.reset();
        limpiarFormularioCalendario();

        if (fallos === 0) {
            mostrarAlerta('success', `✅ ${exitos} reserva(s) creada(s) correctamente`);
        } else {
            mostrarAlerta('warning', `⚠️ Se crearon ${exitos} reservas, pero ${fallos} fallaron.`);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al guardar las reservas');
    }
}

async function eliminarReservaActual() {
    if (!reservaActualId) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;
    
    try {
        const response = await fetch(`/api/reservas/${reservaActualId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('detalleReservaModal')).hide();
            calendar.refetchEvents();
            mostrarAlerta('success', 'Reserva eliminada correctamente');
            reservaActualId = null;
        } else {
            mostrarAlerta('danger', 'Error al eliminar: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al eliminar la reserva');
    }
}

async function enviarWhatsAppReservaActual() {
    if (!reservaActualId) return;
    
    const telefono = prompt('Confirma el número de teléfono (formato internacional):');
    if (!telefono) return;
    
    const mensaje = prompt('Escribe el mensaje a enviar:');
    if (!mensaje) return;
    
    try {
        const response = await fetch('/api/whatsapp/enviar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telefono: telefono,
                mensaje: mensaje,
                reserva_id: reservaActualId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            mostrarAlerta('success', 'Mensaje enviado correctamente');
        } else {
            mostrarAlerta('warning', result.message || result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al enviar el mensaje');
    }
}

function mostrarAlerta(tipo, mensaje) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ==================== FUNCIONES MULTI-FECHA ====================

let calFechasMultiples = [];

// Inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar calendario
    inicializarCalendario();
    
    // Inicializar listeners para multi-fecha
    const tipoFechaRadios = document.querySelectorAll('input[name="tipo_fecha"]');
    tipoFechaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            calCambiarTipoFecha(this.value);
        });
    });

    // Listener para calcular precio total
    const precioInput = document.getElementById('precio');
    if (precioInput) {
        precioInput.addEventListener('input', calActualizarPrecioTotal);
    }

    // Listener para fechas de rango
    const fechaInicioRango = document.getElementById('cal_fecha_inicio_rango');
    const fechaFinRango = document.getElementById('cal_fecha_fin_rango');
    if (fechaInicioRango) fechaInicioRango.addEventListener('change', calActualizarPrecioTotal);
    if (fechaFinRango) fechaFinRango.addEventListener('change', calActualizarPrecioTotal);
    
    // Listener para el modal
    const nuevaReservaModalEl = document.getElementById('nuevaReservaModal');
    if (nuevaReservaModalEl) {
        nuevaReservaModalEl.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const isEdit = button && button.dataset && button.dataset.edit;
            
            if (!isEdit) {
                setTimeout(function() {
                    limpiarFormularioCalendario();
                }, 100);
            }
        });
    }
});

function calCambiarTipoFecha(tipo) {
    // Ocultar todos los contenedores
    document.getElementById('cal-contenedor-fecha-unica').style.display = 'none';
    document.getElementById('cal-contenedor-fecha-rango').style.display = 'none';
    document.getElementById('cal-contenedor-fechas-multiples').style.display = 'none';

    // Limpiar campos
    document.getElementById('fecha_evento').value = '';
    document.getElementById('cal_fecha_inicio_rango').value = '';
    document.getElementById('cal_fecha_fin_rango').value = '';
    calFechasMultiples = [];
    calActualizarListaFechasMultiples();

    // Mostrar el contenedor correspondiente
    if (tipo === 'unica') {
        document.getElementById('cal-contenedor-fecha-unica').style.display = 'block';
    } else if (tipo === 'rango') {
        document.getElementById('cal-contenedor-fecha-rango').style.display = 'block';
    } else if (tipo === 'multiples') {
        document.getElementById('cal-contenedor-fechas-multiples').style.display = 'block';
    }

    calActualizarPrecioTotal();
    calActualizarTextoBoton();
}

function calAgregarFechaMultiple() {
    const fechaInput = document.getElementById('cal_nueva_fecha_multiple');
    const fecha = fechaInput.value;

    if (!fecha) {
        mostrarAlerta('warning', 'Por favor selecciona una fecha');
        return;
    }

    if (calFechasMultiples.includes(fecha)) {
        mostrarAlerta('warning', 'Esta fecha ya está agregada');
        return;
    }

    calFechasMultiples.push(fecha);
    calFechasMultiples.sort();
    fechaInput.value = '';
    
    calActualizarListaFechasMultiples();
    calActualizarPrecioTotal();
    calActualizarTextoBoton();
}

function calEliminarFechaMultiple(fecha) {
    calFechasMultiples = calFechasMultiples.filter(f => f !== fecha);
    calActualizarListaFechasMultiples();
    calActualizarPrecioTotal();
    calActualizarTextoBoton();
}

function calActualizarListaFechasMultiples() {
    const lista = document.getElementById('cal-lista-fechas-multiples');
    
    if (calFechasMultiples.length === 0) {
        lista.innerHTML = '<small class="text-muted">Agrega las fechas específicas que deseas reservar</small>';
        return;
    }

    lista.innerHTML = calFechasMultiples.map(fecha => {
        const fechaObj = new Date(fecha + 'T00:00:00');
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="badge bg-success me-2 mb-2" style="font-size: 0.9rem;">
                <i class="bi bi-calendar-check"></i> ${fechaFormateada}
                <button type="button" class="btn-close btn-close-white ms-2" 
                        style="font-size: 0.6rem;" 
                        onclick="calEliminarFechaMultiple('${fecha}')"></button>
            </div>
        `;
    }).join('');
}

function calCalcularDiasEnRango(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

function calActualizarPrecioTotal() {
    const tipoFechaChecked = document.querySelector('input[name="tipo_fecha"]:checked');
    if (!tipoFechaChecked) return;
    
    const tipoFecha = tipoFechaChecked.value;
    const precioPorDia = parseFloat(document.getElementById('precio').value) || 0;
    const infoElement = document.getElementById('cal-precio-total-info');

    let totalDias = 1;

    if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('cal_fecha_inicio_rango').value;
        const fechaFin = document.getElementById('cal_fecha_fin_rango').value;
        
        if (fechaInicio && fechaFin) {
            totalDias = calCalcularDiasEnRango(fechaInicio, fechaFin);
        }
    } else if (tipoFecha === 'multiples') {
        totalDias = calFechasMultiples.length;
    }

    if (totalDias > 1 && precioPorDia > 0) {
        const precioTotal = precioPorDia * totalDias;
        infoElement.textContent = `${totalDias} días × ${precioPorDia.toFixed(2)}€ = ${precioTotal.toFixed(2)}€ total`;
        infoElement.style.display = 'block';
    } else {
        infoElement.textContent = '';
        infoElement.style.display = 'none';
    }
}

function calActualizarTextoBoton() {
    const tipoFechaChecked = document.querySelector('input[name="tipo_fecha"]:checked');
    if (!tipoFechaChecked) return;
    
    const tipoFecha = tipoFechaChecked.value;
    const textoGuardar = document.getElementById('cal-texto-guardar');
    
    let totalDias = 1;
    
    if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('cal_fecha_inicio_rango').value;
        const fechaFin = document.getElementById('cal_fecha_fin_rango').value;
        if (fechaInicio && fechaFin) {
            totalDias = calCalcularDiasEnRango(fechaInicio, fechaFin);
        }
    } else if (tipoFecha === 'multiples') {
        totalDias = calFechasMultiples.length;
    }

    const reservaId = document.getElementById('reserva_id').value;
    
    if (reservaId) {
        // Modo edición
        textoGuardar.textContent = 'Actualizar';
    } else if (totalDias > 1) {
        textoGuardar.textContent = `Guardar ${totalDias} Reservas`;
    } else {
        textoGuardar.textContent = 'Guardar';
    }
}

function calObtenerFechasAReservar() {
    const tipoFechaChecked = document.querySelector('input[name="tipo_fecha"]:checked');
    if (!tipoFechaChecked) return [];
    
    const tipoFecha = tipoFechaChecked.value;
    const fechas = [];

    if (tipoFecha === 'unica') {
        const fecha = document.getElementById('fecha_evento').value;
        if (fecha) fechas.push(fecha);
    } else if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('cal_fecha_inicio_rango').value;
        const fechaFin = document.getElementById('cal_fecha_fin_rango').value;
        
        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                fechas.push(`${year}-${month}-${day}`);
            }
        }
    } else if (tipoFecha === 'multiples') {
        fechas.push(...calFechasMultiples);
    }

    return fechas;
}

function limpiarFormularioCalendario() {
    const form = document.getElementById('reservaForm');
    if (form) form.reset();
    
    const reservaId = document.getElementById('reserva_id');
    if (reservaId) reservaId.value = '';
    
    const tituloModal = document.getElementById('tituloModal');
    if (tituloModal) tituloModal.textContent = 'Nueva Reserva';
    
    // Resetear tipo de fecha
    const fechaUnica = document.getElementById('cal_fecha_unica');
    if (fechaUnica) {
        fechaUnica.checked = true;
        calCambiarTipoFecha('unica');
    }
    
    // Mostrar selector de tipo de fecha
    const selectorTipo = document.getElementById('selector-tipo-fecha');
    if (selectorTipo) selectorTipo.style.display = 'block';
    
    calFechasMultiples = [];
    calActualizarListaFechasMultiples();
    calActualizarPrecioTotal();
    calActualizarTextoBoton();
}
