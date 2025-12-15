// Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticas();
    cargarProximasReservas();
});

async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/reservas');
        const reservas = await response.json();
        
        // Fecha actual
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        
        // Filtrar reservas del mes actual
        const reservasMes = reservas.filter(r => {
            const fechaReserva = new Date(r.start);
            return fechaReserva >= primerDiaMes && fechaReserva <= ultimoDiaMes;
        });
        
        // Actualizar contador de reservas
        document.getElementById('reservas-mes').textContent = reservasMes.length;
        
        // Calcular ingresos del mes
        const ingresos = reservasMes.reduce((sum, r) => sum + (r.precio || 0), 0);
        document.getElementById('ingresos-mes').textContent = ingresos.toFixed(2) + '€';
        
        // Buscar próxima reserva
        const reservasFuturas = reservas
            .filter(r => new Date(r.start) >= hoy)
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        
        if (reservasFuturas.length > 0) {
            const proxima = reservasFuturas[0];
            const fechaProxima = new Date(proxima.start);
            document.getElementById('proxima-reserva').textContent = 
                fechaProxima.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
        
        // Crear gráfico de tipos de celebración
        crearGraficoTipos(reservas);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

async function cargarProximasReservas() {
    try {
        const response = await fetch('/api/reservas');
        const reservas = await response.json();
        
        const hoy = new Date();
        const proximasReservas = reservas
            .filter(r => new Date(r.start) >= hoy)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 5);
        
        const tbody = document.getElementById('proximas-reservas-table');
        const cardsContainer = document.getElementById('proximas-reservas-cards');
        
        if (proximasReservas.length === 0) {
            // Tabla desktop
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay próximas reservas</td></tr>';
            
            // Cards móvil
            cardsContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center text-muted py-5">
                        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
                        <p class="mt-3 mb-0">No hay próximas reservas</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Generar filas para tabla (desktop)
        tbody.innerHTML = proximasReservas.map(r => {
            const fecha = new Date(r.start);
            return `
                <tr>
                    <td><strong>${fecha.toLocaleDateString('es-ES')}</strong></td>
                    <td><strong>${r.cliente}</strong></td>
                    <td class="d-none d-lg-table-cell">${r.title.split(' - ')[1] || 'Evento'}</td>
                    <td class="d-none d-lg-table-cell">${r.invitados || '-'}</td>
                    <td><strong>${r.precio ? r.precio.toFixed(2) + '€' : '-'}</strong></td>
                </tr>
            `;
        }).join('');
        
        // Generar cards para móvil
        cardsContainer.innerHTML = proximasReservas.map((r, index) => {
            const fecha = new Date(r.start);
            const tipo = r.title.split(' - ')[1] || 'Evento';
            const estado = 'confirmada'; // Por defecto, ajustar según tu lógica
            
            return `
                <div class="card mb-2 reserva-card" data-estado="${estado}">
                    <div class="card-header" data-bs-toggle="collapse" data-bs-target="#proxima${index}" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">
                                    <i class="bi bi-calendar-event"></i> ${fecha.toLocaleDateString('es-ES')}
                                </h6>
                                <div class="text-muted small">
                                    <i class="bi bi-person"></i> ${r.cliente}
                                </div>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-success mb-2">✓</span>
                                <div class="small"><strong>${r.precio ? r.precio.toFixed(2) + '€' : '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                    <div class="collapse" id="proxima${index}">
                        <div class="card-body">
                            <div class="row g-2">
                                <div class="col-6">
                                    <small class="text-muted d-block">Tipo de Evento</small>
                                    <strong>${tipo}</strong>
                                </div>
                                ${r.invitados ? `
                                <div class="col-6">
                                    <small class="text-muted d-block">Invitados</small>
                                    <strong><i class="bi bi-people"></i> ${r.invitados}</strong>
                                </div>
                                ` : ''}
                                <div class="col-12 mt-2">
                                    <small class="text-muted d-block">Precio Total</small>
                                    <h5 class="mb-0 text-success">${r.precio ? r.precio.toFixed(2) + '€' : '-'}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar próximas reservas:', error);
    }
}

function crearGraficoTipos(reservas) {
    const tipos = {};
    reservas.forEach(r => {
        const tipo = r.title.split(' - ')[1] || 'Otro';
        tipos[tipo] = (tipos[tipo] || 0) + 1;
    });
    
    const ctx = document.getElementById('tiposCelebracionChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tipos),
            datasets: [{
                data: Object.values(tipos),
                backgroundColor: [
                    '#7a9d8d', // Verde pastel oscuro
                    '#6b8d7d', // Menta oscuro
                    '#9d8d7a', // Melocotón oscuro
                    '#7a8d9d', // Cielo oscuro
                    '#8d7a9d', // Lavanda oscuro
                    '#9d7a7a'  // Rosa oscuro
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e8e8e8', // Texto claro para modo oscuro
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#2a2a2a',
                    titleColor: '#e8e8e8',
                    bodyColor: '#e8e8e8',
                    borderColor: '#3a3a3a',
                    borderWidth: 1
                }
            }
        }
    });
}

// Variable global para almacenar fechas múltiples
let fechasMultiples = [];

// Cambiar entre tipos de fecha
document.addEventListener('DOMContentLoaded', function() {
    const tipoFechaRadios = document.querySelectorAll('input[name="tipo_fecha"]');
    
    tipoFechaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            cambiarTipoFecha(this.value);
        });
    });

    // Listeners para calcular precio total
    document.querySelector('input[name="precio"]').addEventListener('input', actualizarPrecioTotal);
});

function cambiarTipoFecha(tipo) {
    // Ocultar todos los contenedores
    document.getElementById('contenedor-fecha-unica').style.display = 'none';
    document.getElementById('contenedor-fecha-rango').style.display = 'none';
    document.getElementById('contenedor-fechas-multiples').style.display = 'none';

    // Limpiar campos
    document.getElementById('fecha_evento_unica').value = '';
    document.getElementById('fecha_inicio_rango').value = '';
    document.getElementById('fecha_fin_rango').value = '';
    fechasMultiples = [];
    actualizarListaFechasMultiples();

    // Mostrar el contenedor correspondiente
    if (tipo === 'unica') {
        document.getElementById('contenedor-fecha-unica').style.display = 'block';
    } else if (tipo === 'rango') {
        document.getElementById('contenedor-fecha-rango').style.display = 'block';
    } else if (tipo === 'multiples') {
        document.getElementById('contenedor-fechas-multiples').style.display = 'block';
    }

    actualizarPrecioTotal();
    actualizarTextoBoton();
}

function agregarFechaMultiple() {
    const fechaInput = document.getElementById('nueva_fecha_multiple');
    const fecha = fechaInput.value;

    if (!fecha) {
        alert('Por favor selecciona una fecha');
        return;
    }

    // Verificar que no esté duplicada
    if (fechasMultiples.includes(fecha)) {
        alert('Esta fecha ya está agregada');
        return;
    }

    fechasMultiples.push(fecha);
    fechasMultiples.sort(); // Ordenar cronológicamente
    fechaInput.value = '';
    
    actualizarListaFechasMultiples();
    actualizarPrecioTotal();
    actualizarTextoBoton();
}

function eliminarFechaMultiple(fecha) {
    fechasMultiples = fechasMultiples.filter(f => f !== fecha);
    actualizarListaFechasMultiples();
    actualizarPrecioTotal();
    actualizarTextoBoton();
}

function actualizarListaFechasMultiples() {
    const lista = document.getElementById('lista-fechas-multiples');
    
    if (fechasMultiples.length === 0) {
        lista.innerHTML = '<small class="text-muted">Agrega las fechas específicas que deseas reservar</small>';
        return;
    }

    lista.innerHTML = fechasMultiples.map(fecha => {
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
                        onclick="eliminarFechaMultiple('${fecha}')"></button>
            </div>
        `;
    }).join('');
}

function calcularDiasEnRango(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    return diffDays;
}

function actualizarPrecioTotal() {
    const tipoFecha = document.querySelector('input[name="tipo_fecha"]:checked').value;
    const precioPorDia = parseFloat(document.querySelector('input[name="precio"]').value) || 0;
    const infoElement = document.getElementById('precio-total-info');

    let totalDias = 1;

    if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('fecha_inicio_rango').value;
        const fechaFin = document.getElementById('fecha_fin_rango').value;
        
        if (fechaInicio && fechaFin) {
            totalDias = calcularDiasEnRango(fechaInicio, fechaFin);
        }
    } else if (tipoFecha === 'multiples') {
        totalDias = fechasMultiples.length;
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

function actualizarTextoBoton() {
    const tipoFecha = document.querySelector('input[name="tipo_fecha"]:checked').value;
    const textoGuardar = document.getElementById('texto-guardar');
    
    let totalDias = 1;
    
    if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('fecha_inicio_rango').value;
        const fechaFin = document.getElementById('fecha_fin_rango').value;
        if (fechaInicio && fechaFin) {
            totalDias = calcularDiasEnRango(fechaInicio, fechaFin);
        }
    } else if (tipoFecha === 'multiples') {
        totalDias = fechasMultiples.length;
    }

    if (totalDias > 1) {
        textoGuardar.textContent = `Guardar ${totalDias} Reservas`;
    } else {
        textoGuardar.textContent = 'Guardar Reserva';
    }
}

function obtenerFechasAReservar() {
    const tipoFecha = document.querySelector('input[name="tipo_fecha"]:checked').value;
    const fechas = [];

    if (tipoFecha === 'unica') {
        const fecha = document.getElementById('fecha_evento_unica').value;
        if (fecha) fechas.push(fecha);
    } else if (tipoFecha === 'rango') {
        const fechaInicio = document.getElementById('fecha_inicio_rango').value;
        const fechaFin = document.getElementById('fecha_fin_rango').value;
        
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
        fechas.push(...fechasMultiples);
    }

    return fechas;
}

async function guardarReserva() {
    const form = document.getElementById('nuevaReservaForm');
    const formData = new FormData(form);
    
    // Obtener las fechas a reservar
    const fechas = obtenerFechasAReservar();
    
    if (fechas.length === 0) {
        alert('Por favor selecciona al menos una fecha');
        return;
    }

    // Validar campos requeridos
    if (!formData.get('cliente_nombre') || !formData.get('cliente_telefono')) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    // Preparar datos base
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
        // Crear una reserva por cada fecha
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

        // Esperar a que todas las reservas se creen
        const respuestas = await Promise.all(promesas);
        
        // Verificar que todas fueron exitosas
        const exitos = respuestas.filter(r => r.ok).length;
        const fallos = respuestas.length - exitos;

        if (fallos === 0) {
            alert(`✅ ${exitos} reserva(s) creada(s) correctamente`);
            location.reload();
        } else {
            alert(`⚠️ Se crearon ${exitos} reservas, pero ${fallos} fallaron. Por favor revisa el calendario.`);
            location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar las reservas');
    }
}

// Cargar mensajes enviados
async function cargarMensajes() {
    try {
        const response = await fetch('/api/mensajes');
        const mensajes = await response.json();
        document.getElementById('mensajes-enviados').textContent = mensajes.length;
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
    }
}
