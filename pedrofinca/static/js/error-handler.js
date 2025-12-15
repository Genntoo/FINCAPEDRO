/**
 * Sistema de Manejo de Errores y Notificaciones
 * Finca Rústica - Sistema de Gestión de Reservas
 * 
 * Proporciona:
 * - Notificaciones toast elegantes
 * - Manejo centralizado de errores HTTP
 * - Validación de formularios en tiempo real
 * - Diálogos de confirmación modernos
 * - Overlays de carga
 */

// ============================================
// SISTEMA DE NOTIFICACIONES TOAST
// ============================================

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxVisible = 3;
        this.init();
    }

    init() {
        // Crear contenedor de notificaciones
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: success, error, warning, info
     * @param {number} duration - Duración en ms (0 = no auto-cerrar)
     * @returns {string} ID de la notificación
     */
    show(message, type = 'info', duration = 4000) {
        const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const notification = {
            id,
            message,
            type,
            element: this.createNotificationElement(id, message, type)
        };

        this.notifications.push(notification);
        this.container.appendChild(notification.element);

        // Animar entrada
        setTimeout(() => {
            notification.element.classList.add('notification-visible');
        }, 10);

        // Auto-cerrar si tiene duración
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        // Limitar notificaciones visibles
        this.limitVisibleNotifications();

        return id;
    }

    createNotificationElement(id, message, type) {
        const div = document.createElement('div');
        div.className = `notification notification-${type}`;
        div.setAttribute('data-notification-id', id);

        const icon = this.getIcon(type);
        
        div.innerHTML = `
            <div class="notification-content">
                <i class="bi bi-${icon} notification-icon"></i>
                <span class="notification-message">${this.escapeHtml(message)}</span>
            </div>
            <button class="notification-close" onclick="notifications.dismiss('${id}')">
                <i class="bi bi-x"></i>
            </button>
        `;

        return div;
    }

    getIcon(type) {
        const icons = {
            success: 'check-circle-fill',
            error: 'x-circle-fill',
            warning: 'exclamation-triangle-fill',
            info: 'info-circle-fill',
            loading: 'arrow-repeat'
        };
        return icons[type] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cierra una notificación
     * @param {string} id - ID de la notificación
     */
    dismiss(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        notification.element.classList.remove('notification-visible');
        notification.element.classList.add('notification-exit');

        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * Cierra todas las notificaciones
     */
    dismissAll() {
        this.notifications.forEach(n => this.dismiss(n.id));
    }

    limitVisibleNotifications() {
        if (this.notifications.length > this.maxVisible) {
            const toRemove = this.notifications.slice(0, this.notifications.length - this.maxVisible);
            toRemove.forEach(n => this.dismiss(n.id));
        }
    }

    // Métodos de conveniencia
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    loading(message) {
        return this.show(message, 'loading', 0); // No auto-cerrar
    }
}

// Instancia global
const notifications = new NotificationSystem();

// ============================================
// MANEJO CENTRALIZADO DE ERRORES HTTP
// ============================================

class ErrorHandler {
    constructor() {
        this.defaultMessages = {
            400: 'Solicitud incorrecta. Por favor verifica los datos ingresados.',
            401: 'No tienes autorización. Por favor inicia sesión nuevamente.',
            403: 'No tienes permisos para realizar esta acción.',
            404: 'No se encontró el recurso solicitado.',
            409: 'Conflicto: el recurso ya existe o no se puede modificar.',
            422: 'Los datos enviados no son válidos.',
            429: 'Demasiadas solicitudes. Por favor espera un momento.',
            500: 'Error interno del servidor. Intenta nuevamente más tarde.',
            502: 'Error de conexión con el servidor.',
            503: 'Servicio no disponible temporalmente.',
            504: 'Tiempo de espera agotado. Intenta nuevamente.',
            network: 'Error de conexión. Verifica tu conexión a internet.'
        };
    }

    /**
     * Realiza una petición fetch con manejo de errores automático
     * @param {string} url - URL de la petición
     * @param {Object} options - Opciones de fetch
     * @param {Object} context - Contexto adicional
     * @returns {Promise<Object>} {ok, data?, error?, details?}
     */
    async fetch(url, options = {}, context = {}) {
        const {
            showLoading = true,
            loadingMessage = 'Procesando...',
            successMessage = null,
            errorPrefix = '',
            onSuccess = null,
            onError = null
        } = context;

        let loadingId = null;

        try {
            // Mostrar loading
            if (showLoading) {
                loadingId = notifications.loading(loadingMessage);
            }

            // Realizar petición
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            // Cerrar loading
            if (loadingId) {
                notifications.dismiss(loadingId);
            }

            // Parsear respuesta
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            // Manejar respuesta exitosa
            if (response.ok) {
                if (successMessage) {
                    notifications.success(successMessage);
                }
                if (onSuccess) {
                    onSuccess(data);
                }
                return { ok: true, data };
            }

            // Manejar error HTTP
            const errorMessage = this.getErrorMessage(response.status, data);
            const fullError = errorPrefix ? `${errorPrefix}: ${errorMessage}` : errorMessage;
            
            notifications.error(fullError);
            
            if (onError) {
                onError(errorMessage, data);
            }

            return {
                ok: false,
                error: errorMessage,
                details: data?.details || data?.message || null
            };

        } catch (error) {
            // Cerrar loading si está activo
            if (loadingId) {
                notifications.dismiss(loadingId);
            }

            // Manejar error de red
            const errorMessage = this.defaultMessages.network;
            const fullError = errorPrefix ? `${errorPrefix}: ${errorMessage}` : errorMessage;
            
            notifications.error(fullError);
            
            console.error('Network error:', error);
            
            if (onError) {
                onError(errorMessage, error);
            }

            return {
                ok: false,
                error: errorMessage,
                details: error.message
            };
        }
    }

    getErrorMessage(status, data) {
        // Mensaje personalizado del servidor
        if (data?.error) {
            return data.error;
        }
        if (data?.message) {
            return data.message;
        }

        // Mensaje por defecto según código
        return this.defaultMessages[status] || `Error ${status}: Ocurrió un error inesperado.`;
    }

    /**
     * Maneja errores de forma manual
     * @param {Error|string} error - Error a manejar
     * @param {string} context - Contexto del error
     */
    handle(error, context = '') {
        const message = typeof error === 'string' ? error : error.message;
        const fullMessage = context ? `${context}: ${message}` : message;
        
        notifications.error(fullMessage);
        console.error('Error:', error);
    }
}

// Instancia global
const errorHandler = new ErrorHandler();

// ============================================
// VALIDADOR DE FORMULARIOS
// ============================================

class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            console.error(`Form with id "${formId}" not found`);
            return;
        }
        this.errors = {};
    }

    /**
     * Valida un campo individual
     * @param {string} fieldName - Nombre del campo
     * @param {Object} rules - Reglas de validación
     * @returns {boolean} true si es válido
     */
    validateField(fieldName, rules) {
        const field = this.form.elements[fieldName];
        if (!field) {
            console.error(`Field "${fieldName}" not found in form`);
            return false;
        }

        const value = field.value?.trim() || '';
        let error = null;

        // Required
        if (rules.required && !value) {
            error = 'Este campo es obligatorio';
        }

        // Min length
        if (!error && rules.minLength && value.length < rules.minLength) {
            error = `Mínimo ${rules.minLength} caracteres`;
        }

        // Max length
        if (!error && rules.maxLength && value.length > rules.maxLength) {
            error = `Máximo ${rules.maxLength} caracteres`;
        }

        // Email
        if (!error && rules.email && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                error = 'Email inválido';
            }
        }

        // Phone
        if (!error && rules.phone && value) {
            const phoneRegex = /^[\d\s\+\-\(\)]+$/;
            if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 9) {
                error = 'Teléfono inválido';
            }
        }

        // Number
        if (!error && rules.number && value) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                error = 'Debe ser un número válido';
            } else {
                if (rules.min !== undefined && num < rules.min) {
                    error = `Mínimo: ${rules.min}`;
                }
                if (rules.max !== undefined && num > rules.max) {
                    error = `Máximo: ${rules.max}`;
                }
            }
        }

        // Date
        if (!error && rules.date && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                error = 'Fecha inválida';
            }
        }

        // Custom validator
        if (!error && rules.custom) {
            const customResult = rules.custom(value, field);
            if (customResult !== true) {
                error = customResult || 'Valor inválido';
            }
        }

        // Actualizar UI
        this.updateFieldUI(field, error);

        // Guardar error
        if (error) {
            this.errors[fieldName] = error;
            return false;
        } else {
            delete this.errors[fieldName];
            return true;
        }
    }

    updateFieldUI(field, error) {
        // Remover clases anteriores
        field.classList.remove('is-valid', 'is-invalid');
        
        // Buscar o crear mensaje de error
        let errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentNode.appendChild(errorElement);
        }

        if (error) {
            field.classList.add('is-invalid');
            errorElement.textContent = error;
        } else if (field.value.trim()) {
            field.classList.add('is-valid');
            errorElement.textContent = '';
        }
    }

    /**
     * Valida todos los campos del formulario
     * @param {Object} rulesMap - Mapa de reglas {fieldName: rules}
     * @returns {boolean} true si todo es válido
     */
    validateAll(rulesMap) {
        this.errors = {};
        let allValid = true;

        for (const [fieldName, rules] of Object.entries(rulesMap)) {
            if (!this.validateField(fieldName, rules)) {
                allValid = false;
            }
        }

        return allValid;
    }

    /**
     * Limpia todos los errores
     */
    clearErrors() {
        this.errors = {};
        
        const fields = this.form.querySelectorAll('.is-valid, .is-invalid');
        fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });

        const errorMessages = this.form.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(msg => msg.textContent = '');
    }

    /**
     * Obtiene todos los errores actuales
     * @returns {Object} Mapa de errores
     */
    getErrors() {
        return { ...this.errors };
    }

    /**
     * Verifica si hay errores
     * @returns {boolean}
     */
    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }
}

// ============================================
// DIÁLOGOS DE CONFIRMACIÓN
// ============================================

class ConfirmDialog {
    /**
     * Muestra un diálogo de confirmación
     * @param {Object} options - Opciones del diálogo
     * @returns {Promise<boolean>} true si se confirmó
     */
    static async show(options = {}) {
        const {
            title = '¿Estás seguro?',
            message = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning' // warning, danger, info, success
        } = options;

        return new Promise((resolve) => {
            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'confirm-dialog-overlay';
            modal.innerHTML = `
                <div class="confirm-dialog confirm-dialog-${type}">
                    <div class="confirm-dialog-header">
                        <h5 class="confirm-dialog-title">${this.escapeHtml(title)}</h5>
                    </div>
                    <div class="confirm-dialog-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="confirm-dialog-footer">
                        <button class="btn btn-secondary confirm-cancel">${this.escapeHtml(cancelText)}</button>
                        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'} confirm-ok">${this.escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Animar entrada
            setTimeout(() => {
                modal.classList.add('confirm-dialog-visible');
            }, 10);

            // Event listeners
            const confirmBtn = modal.querySelector('.confirm-ok');
            const cancelBtn = modal.querySelector('.confirm-cancel');

            const close = (result) => {
                modal.classList.remove('confirm-dialog-visible');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(result);
                }, 200);
            };

            confirmBtn.addEventListener('click', () => close(true));
            cancelBtn.addEventListener('click', () => close(false));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close(false);
            });
        });
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Diálogo específico para eliminar
     * @param {string} itemName - Nombre del elemento a eliminar
     * @returns {Promise<boolean>}
     */
    static async confirmDelete(itemName) {
        return this.show({
            title: '¿Eliminar elemento?',
            message: `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });
    }
}

// ============================================
// LOADING OVERLAY
// ============================================

class LoadingOverlay {
    static overlay = null;

    /**
     * Muestra overlay de carga
     * @param {string} message - Mensaje a mostrar
     */
    static show(message = 'Cargando...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-border text-success" role="status"></div>
                    <p class="loading-message mt-3">${this.escapeHtml(message)}</p>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }

        // Actualizar mensaje si ya existe
        const messageElement = this.overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        setTimeout(() => {
            this.overlay.classList.add('loading-overlay-visible');
        }, 10);
    }

    /**
     * Oculta overlay de carga
     */
    static hide() {
        if (this.overlay) {
            this.overlay.classList.remove('loading-overlay-visible');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                }
            }, 200);
        }
    }

    /**
     * Envuelve una promesa con loading overlay
     * @param {Promise} promise - Promesa a ejecutar
     * @param {string} message - Mensaje de carga
     * @returns {Promise}
     */
    static async wrap(promise, message = 'Cargando...') {
        this.show(message);
        try {
            const result = await promise;
            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================

window.notifications = notifications;
window.errorHandler = errorHandler;
window.FormValidator = FormValidator;
window.ConfirmDialog = ConfirmDialog;
window.LoadingOverlay = LoadingOverlay;

console.log('✅ Sistema de manejo de errores cargado');
