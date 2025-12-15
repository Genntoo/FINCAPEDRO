#!/usr/bin/env python3
"""
Script de inicialización para la aplicación de gestión de reservas
"""

from app import app, db, User
from werkzeug.security import generate_password_hash

def init_app():
    """Inicializar la aplicación con datos de ejemplo"""
    with app.app_context():
        # Crear tablas
        print("Creando tablas de base de datos...")
        db.create_all()
        
        # Verificar si ya existe el usuario admin
        admin = User.query.filter_by(username='admin').first()
        
        if not admin:
            # Crear usuario administrador
            print("Creando usuario administrador...")
            admin = User(
                username='admin',
                email='admin@finca.com',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            
            print("\n✅ Base de datos inicializada correctamente!")
            print("\n📝 Credenciales de acceso:")
            print("   Usuario: admin")
            print("   Contraseña: admin123")
            print("\n🌐 Inicia la aplicación con: python app.py")
            print("   La aplicación estará disponible en: http://localhost:5000")
        else:
            print("\n✅ La base de datos ya está inicializada")
            print("   Usuario admin ya existe")

if __name__ == '__main__':
    init_app()
