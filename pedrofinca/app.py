from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, g
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from twilio.rest import Client

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'tu-clave-secreta-cambiar-en-produccion')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///finca_reservas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Configuración de Twilio (WhatsApp)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')


# ============= DETECCIÓN DE MÓVIL =============

@app.before_request
def detect_mobile():
    """Detectar si el usuario está en un dispositivo móvil"""
    user_agent = request.headers.get('User-Agent', '').lower()
    mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    g.is_mobile = any(keyword in user_agent for keyword in mobile_keywords)


def render_mobile_or_desktop(desktop_template, mobile_template=None, **context):
    """
    Renderiza la plantilla móvil o desktop según el dispositivo
    Si no existe plantilla móvil, usa la desktop
    """
    if g.is_mobile and mobile_template:
        try:
            return render_template(mobile_template, **context)
        except:
            # Si no existe la plantilla móvil, usar desktop
            return render_template(desktop_template, **context)
    return render_template(desktop_template, **context)

# ============= MODELOS DE BASE DE DATOS =============

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Reserva(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_nombre = db.Column(db.String(100), nullable=False)
    cliente_telefono = db.Column(db.String(20), nullable=False)
    cliente_email = db.Column(db.String(120))
    fecha_evento = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)
    num_invitados = db.Column(db.Integer)
    tipo_celebracion = db.Column(db.String(50))
    precio = db.Column(db.Float)
    anticipo = db.Column(db.Float, default=0)
    estado = db.Column(db.String(20), default='confirmada')
    notas = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    mensajes = db.relationship('Mensaje', backref='reserva', lazy=True, cascade='all, delete-orphan')


class Mensaje(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reserva_id = db.Column(db.Integer, db.ForeignKey('reserva.id'), nullable=True)  # Puede ser NULL
    telefono_destino = db.Column(db.String(20), nullable=False)
    telefono_origen = db.Column(db.String(20))
    contenido = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(20), default='whatsapp')
    direccion = db.Column(db.String(20), default='saliente')  # 'saliente' o 'entrante'
    estado = db.Column(db.String(20), default='enviado')
    twilio_sid = db.Column(db.String(100))
    num_media = db.Column(db.Integer, default=0)  # Número de archivos multimedia
    media_urls = db.Column(db.Text)  # URLs de archivos multimedia (JSON)
    media_types = db.Column(db.Text)  # Tipos de archivos multimedia (JSON)
    enviado_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ============= RUTAS DE AUTENTICACIÓN =============

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Usuario o contraseña incorrectos', 'error')
    
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('El usuario ya existe', 'error')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Usuario registrado correctamente', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')


# ============= RUTAS PRINCIPALES =============

@app.route('/')
@login_required
def index():
    return render_mobile_or_desktop('index.html', 'index_mobile.html')


@app.route('/calendario')
@login_required
def calendario():
    return render_template('calendario.html')


@app.route('/reservas')
@login_required
def reservas():
    reservas_list = Reserva.query.order_by(Reserva.fecha_evento.desc()).all()
    return render_template('reservas.html', reservas=reservas_list)


@app.route('/mensajes')
@login_required
def mensajes():
    mensajes_list = Mensaje.query.order_by(Mensaje.enviado_at.desc()).all()
    return render_template('mensajes.html', mensajes=mensajes_list)


# ============= API ENDPOINTS =============

@app.route('/api/reservas', methods=['GET'])
@login_required
def get_reservas():
    reservas = Reserva.query.filter_by(estado='confirmada').all()
    return jsonify([{
        'id': r.id,
        'title': f'{r.cliente_nombre} - {r.tipo_celebracion or "Evento"}',
        'start': f'{r.fecha_evento}T{r.hora_inicio}',
        'end': f'{r.fecha_evento}T{r.hora_fin}',
        'cliente': r.cliente_nombre,
        'telefono': r.cliente_telefono,
        'invitados': r.num_invitados,
        'precio': r.precio
    } for r in reservas])


@app.route('/api/reservas', methods=['POST'])
@login_required
def crear_reserva():
    data = request.get_json()
    
    try:
        fecha_evento = datetime.strptime(data['fecha_evento'], '%Y-%m-%d').date()
        hora_inicio = datetime.strptime(data['hora_inicio'], '%H:%M').time()
        hora_fin = datetime.strptime(data['hora_fin'], '%H:%M').time()
        
        reserva_existente = Reserva.query.filter_by(
            fecha_evento=fecha_evento,
            estado='confirmada'
        ).first()
        
        if reserva_existente:
            return jsonify({'error': 'Ya existe una reserva para esta fecha'}), 400
        
        reserva = Reserva(
            cliente_nombre=data['cliente_nombre'],
            cliente_telefono=data['cliente_telefono'],
            cliente_email=data.get('cliente_email', ''),
            fecha_evento=fecha_evento,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            num_invitados=data.get('num_invitados', 0),
            tipo_celebracion=data.get('tipo_celebracion', ''),
            precio=data.get('precio', 0),
            anticipo=data.get('anticipo', 0),
            estado='confirmada',
            notas=data.get('notas', ''),
            user_id=current_user.id
        )
        
        db.session.add(reserva)
        db.session.commit()
        
        return jsonify({'message': 'Reserva creada correctamente', 'id': reserva.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/reservas/<int:reserva_id>', methods=['DELETE'])
@login_required
def eliminar_reserva(reserva_id):
    reserva = Reserva.query.get_or_404(reserva_id)
    
    try:
        db.session.delete(reserva)
        db.session.commit()
        return jsonify({'message': 'Reserva eliminada correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/reservas/<int:reserva_id>/estado', methods=['PUT'])
@login_required
def cambiar_estado_reserva(reserva_id):
    reserva = Reserva.query.get_or_404(reserva_id)
    data = request.get_json()
    nuevo_estado = data.get('estado')
    
    # Validar que el estado sea válido
    estados_validos = ['pendiente', 'confirmada', 'cancelada']
    if nuevo_estado not in estados_validos:
        return jsonify({'error': 'Estado no válido'}), 400
    
    try:
        reserva.estado = nuevo_estado
        db.session.commit()
        return jsonify({
            'message': f'Estado cambiado a {nuevo_estado}',
            'reserva_id': reserva_id,
            'nuevo_estado': nuevo_estado
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/whatsapp/enviar', methods=['POST'])
@login_required
def enviar_whatsapp():
    data = request.get_json()
    telefono_destino = data.get('telefono')
    mensaje = data.get('mensaje')
    reserva_id = data.get('reserva_id')
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return jsonify({
            'error': 'Configuración de Twilio no disponible',
            'message': 'Mensaje simulado (configura Twilio para enviar realmente)'
        }), 200
    
    try:
        if not telefono_destino.startswith('whatsapp:'):
            telefono_destino = f'whatsapp:+{telefono_destino.replace("+", "").replace(" ", "")}'
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=mensaje,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=telefono_destino
        )
        
        nuevo_mensaje = Mensaje(
            reserva_id=reserva_id,
            telefono_destino=telefono_destino,
            telefono_origen=TWILIO_WHATSAPP_NUMBER,
            contenido=mensaje,
            tipo='whatsapp',
            direccion='saliente',
            estado='enviado',
            twilio_sid=message.sid,
            num_media=0,
            user_id=current_user.id
        )
        
        db.session.add(nuevo_mensaje)
        db.session.commit()
        
        return jsonify({'message': 'Mensaje enviado correctamente', 'sid': message.sid})
        
    except Exception as e:
        nuevo_mensaje = Mensaje(
            reserva_id=reserva_id,
            telefono_destino=telefono_destino,
            telefono_origen=TWILIO_WHATSAPP_NUMBER,
            contenido=mensaje,
            tipo='whatsapp',
            direccion='saliente',
            estado='fallido',
            num_media=0,
            user_id=current_user.id
        )
        db.session.add(nuevo_mensaje)
        db.session.commit()
        
        return jsonify({'error': str(e)}), 500


@app.route('/api/mensajes/agrupados')
@login_required
def obtener_conversaciones_agrupadas():
    """Obtener conversaciones agrupadas por teléfono"""
    try:
        # Obtener todos los teléfonos únicos
        subquery = db.session.query(
            db.func.coalesce(Mensaje.telefono_origen, Mensaje.telefono_destino).label('telefono'),
            db.func.max(Mensaje.enviado_at).label('ultima_fecha')
        ).group_by('telefono').subquery()
        
        conversaciones = []
        
        # Obtener último mensaje de cada conversación
        for row in db.session.query(subquery).all():
            telefono = row.telefono
            if not telefono or telefono == TWILIO_WHATSAPP_NUMBER:
                continue
                
            # Obtener último mensaje
            ultimo_mensaje = Mensaje.query.filter(
                db.or_(
                    Mensaje.telefono_origen == telefono,
                    Mensaje.telefono_destino == telefono
                )
            ).order_by(Mensaje.enviado_at.desc()).first()
            
            if not ultimo_mensaje:
                continue
            
            # Buscar nombre del cliente en reservas
            telefono_limpio = telefono.replace('whatsapp:', '').replace('+', '')
            reserva = Reserva.query.filter(
                Reserva.cliente_telefono.contains(telefono_limpio[-9:])
            ).first()
            
            nombre = reserva.cliente_nombre if reserva else telefono_limpio
            
            # Contar mensajes no leídos (entrantes sin leer - feature futura)
            no_leidos = 0
            
            # Preparar texto del último mensaje
            ultimo_texto = ultimo_mensaje.contenido[:50]
            if ultimo_mensaje.num_media and ultimo_mensaje.num_media > 0:
                ultimo_texto = f"📎 {ultimo_mensaje.num_media} archivo(s) - {ultimo_texto}"
            if len(ultimo_mensaje.contenido) > 50:
                ultimo_texto += '...'
            
            conversaciones.append({
                'telefono': telefono,
                'nombre': nombre,
                'ultimo_mensaje': ultimo_texto,
                'ultimo_mensaje_fecha': ultimo_mensaje.enviado_at.strftime('%d/%m %H:%M'),
                'no_leidos': no_leidos,
                'tiene_multimedia': ultimo_mensaje.num_media > 0 if ultimo_mensaje.num_media else False
            })
        
        # Ordenar por fecha más reciente
        conversaciones.sort(key=lambda x: x['ultimo_mensaje_fecha'], reverse=True)
        
        return jsonify(conversaciones)
        
    except Exception as e:
        print(f"Error al obtener conversaciones: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/whatsapp/webhook', methods=['POST'])
def whatsapp_webhook():
    """Webhook para recibir mensajes entrantes de Twilio (incluyendo multimedia)"""
    try:
        # Obtener datos del mensaje entrante
        from_number = request.form.get('From')
        to_number = request.form.get('To')
        body = request.form.get('Body', '')  # El body puede estar vacío si solo hay media
        message_sid = request.form.get('MessageSid')
        
        # Obtener información de archivos multimedia
        num_media = int(request.form.get('NumMedia', 0))
        media_urls = []
        media_types = []
        
        # Recopilar URLs y tipos de todos los archivos multimedia
        for i in range(num_media):
            media_url = request.form.get(f'MediaUrl{i}')
            media_type = request.form.get(f'MediaContentType{i}')
            if media_url:
                media_urls.append(media_url)
                media_types.append(media_type or 'unknown')
        
        # Si no hay texto pero hay multimedia, indicarlo
        if not body and num_media > 0:
            body = f"[{num_media} archivo(s) multimedia]"
        
        # Buscar si existe una reserva con este número
        telefono_limpio = from_number.replace('whatsapp:', '').replace('+', '')
        reserva = Reserva.query.filter(
            Reserva.cliente_telefono.contains(telefono_limpio[-9:])
        ).first()
        
        # Guardar mensaje entrante con información multimedia
        nuevo_mensaje = Mensaje(
            reserva_id=reserva.id if reserva else None,
            telefono_destino=to_number,
            telefono_origen=from_number,
            contenido=body,
            tipo='whatsapp',
            direccion='entrante',
            estado='recibido',
            twilio_sid=message_sid,
            num_media=num_media,
            media_urls=json.dumps(media_urls) if media_urls else None,
            media_types=json.dumps(media_types) if media_types else None,
            user_id=None
        )
        
        db.session.add(nuevo_mensaje)
        db.session.commit()
        
        print(f"✅ Mensaje recibido de {from_number}")
        print(f"   Contenido: {body}")
        print(f"   Archivos multimedia: {num_media}")
        if media_urls:
            print(f"   URLs: {media_urls}")
        
        return '', 200
        
    except Exception as e:
        print(f"❌ Error en webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return '', 200  # Siempre devolver 200 para que Twilio no reintente


@app.route('/api/conversacion/<telefono>')
@login_required
def obtener_conversacion(telefono):
    """Obtener todos los mensajes de una conversación con un número (incluyendo multimedia)"""
    try:
        # Normalizar el teléfono
        telefono_normalizado = telefono.replace('whatsapp:', '').replace('+', '').replace(' ', '')
        
        # Buscar todos los mensajes relacionados con este número
        mensajes = Mensaje.query.filter(
            db.or_(
                Mensaje.telefono_destino.contains(telefono_normalizado[-9:]),
                Mensaje.telefono_origen.contains(telefono_normalizado[-9:])
            )
        ).order_by(Mensaje.enviado_at.asc()).all()
        
        resultado = []
        for m in mensajes:
            mensaje_data = {
                'id': m.id,
                'contenido': m.contenido,
                'direccion': m.direccion,
                'estado': m.estado,
                'fecha': m.enviado_at.strftime('%d/%m/%Y %H:%M'),
                'telefono_origen': m.telefono_origen,
                'telefono_destino': m.telefono_destino,
                'num_media': m.num_media or 0,
                'media_urls': json.loads(m.media_urls) if m.media_urls else [],
                'media_types': json.loads(m.media_types) if m.media_types else []
            }
            resultado.append(mensaje_data)
        
        return jsonify(resultado)
        
    except Exception as e:
        print(f"❌ Error al obtener conversación: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
