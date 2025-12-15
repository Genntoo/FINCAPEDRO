#!/usr/bin/env python3
"""
Script para actualizar la base de datos con los nuevos campos del modelo Mensaje
"""

from app import app, db
from sqlalchemy import text
import os
import shutil
from datetime import datetime

def migrar_base_datos():
    """Agregar nuevos campos al modelo Mensaje y hacer reserva_id nullable"""
    with app.app_context():
        try:
            print("🔧 Iniciando migración de base de datos...")
            
            # Verificar si necesitamos recrear la tabla
            with db.engine.connect() as conn:
                # Intentar agregar columnas nuevas
                try:
                    conn.execute(text('ALTER TABLE mensaje ADD COLUMN telefono_origen VARCHAR(20)'))
                    print("✅ Columna 'telefono_origen' agregada")
                except Exception as e:
                    print(f"ℹ️  Columna 'telefono_origen' ya existe")
                
                try:
                    conn.execute(text("ALTER TABLE mensaje ADD COLUMN direccion VARCHAR(20) DEFAULT 'saliente'"))
                    print("✅ Columna 'direccion' agregada")
                except Exception as e:
                    print(f"ℹ️  Columna 'direccion' ya existe")
                
                # Actualizar mensajes existentes
                try:
                    conn.execute(text("UPDATE mensaje SET direccion = 'saliente' WHERE direccion IS NULL"))
                    conn.commit()
                    print("✅ Mensajes existentes actualizados")
                except Exception as e:
                    pass
            
            # SQLite no soporta ALTER COLUMN directamente, necesitamos recrear la tabla
            print("\n⚠️  SQLite requiere recrear la tabla para hacer reserva_id nullable...")
            print("📦 Haciendo backup de la base de datos...")
            
            # Hacer backup
            db_path = 'finca_reservas.db'
            if os.path.exists(db_path):
                backup_path = f'finca_reservas_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
                shutil.copy2(db_path, backup_path)
                print(f"✅ Backup creado: {backup_path}")
            
            # Recrear la tabla mensaje
            with db.engine.connect() as conn:
                # Crear tabla temporal con la nueva estructura
                conn.execute(text('''
                    CREATE TABLE mensaje_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        reserva_id INTEGER,
                        telefono_destino VARCHAR(20) NOT NULL,
                        telefono_origen VARCHAR(20),
                        contenido TEXT NOT NULL,
                        tipo VARCHAR(20) DEFAULT 'whatsapp',
                        direccion VARCHAR(20) DEFAULT 'saliente',
                        estado VARCHAR(20) DEFAULT 'enviado',
                        twilio_sid VARCHAR(100),
                        enviado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        user_id INTEGER,
                        FOREIGN KEY (reserva_id) REFERENCES reserva(id),
                        FOREIGN KEY (user_id) REFERENCES user(id)
                    )
                '''))
                print("✅ Tabla temporal creada")
                
                # Copiar datos
                try:
                    conn.execute(text('''
                        INSERT INTO mensaje_new 
                        (id, reserva_id, telefono_destino, telefono_origen, contenido, tipo, 
                         direccion, estado, twilio_sid, enviado_at, user_id)
                        SELECT id, reserva_id, telefono_destino, telefono_origen, contenido, tipo,
                               COALESCE(direccion, 'saliente'), estado, twilio_sid, enviado_at, user_id
                        FROM mensaje
                    '''))
                    print("✅ Datos copiados a la tabla temporal")
                except Exception as e:
                    print(f"ℹ️  Copiando datos (puede fallar si las columnas no existen): {e}")
                    # Intentar con columnas básicas
                    conn.execute(text('''
                        INSERT INTO mensaje_new 
                        (id, reserva_id, telefono_destino, contenido, tipo, estado, twilio_sid, enviado_at, user_id)
                        SELECT id, reserva_id, telefono_destino, contenido, tipo, estado, twilio_sid, enviado_at, user_id
                        FROM mensaje
                    '''))
                    print("✅ Datos básicos copiados")
                
                # Eliminar tabla antigua y renombrar
                conn.execute(text('DROP TABLE mensaje'))
                print("✅ Tabla antigua eliminada")
                
                conn.execute(text('ALTER TABLE mensaje_new RENAME TO mensaje'))
                print("✅ Tabla renombrada")
                
                conn.commit()
            
            print("\n✅ Migración completada exitosamente!")
            print("\n📝 Cambios aplicados:")
            print("   - Campo 'telefono_origen' agregado")
            print("   - Campo 'direccion' agregado (saliente/entrante)")
            print("   - Campo 'reserva_id' ahora es NULLABLE")
            print("\n🎉 Nuevas funcionalidades disponibles:")
            print("   - Recepción de mensajes entrantes")
            print("   - Vista de conversaciones completas")
            print("   - Mensajes sin asociar a reservas")
            print("   - Historial bidireccional de mensajes")
            print("\n🔧 Próximos pasos:")
            print("   1. Reinicia la aplicación: python app.py")
            print("   2. Ve a la sección de Mensajes")
            print("   3. Configura el webhook en Twilio con la URL mostrada")
            print("   4. ¡Ya puedes enviar y recibir mensajes!")
            
        except Exception as e:
            print(f"\n❌ Error durante la migración: {str(e)}")
            print("\n💡 Solución alternativa:")
            print("   1. Haz backup de tus datos importantes")
            print("   2. Elimina el archivo finca_reservas.db")
            print("   3. Ejecuta: python init_db.py")
            print("   4. La nueva base de datos tendrá la estructura correcta")

if __name__ == '__main__':
    migrar_base_datos()

