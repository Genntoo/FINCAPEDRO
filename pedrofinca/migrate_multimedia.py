#!/usr/bin/env python3
"""
Script para agregar campos multimedia al modelo Mensaje
"""

import sys
import os

# Agregar el directorio actual al path para importar app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

def migrar_multimedia():
    """Agregar campos multimedia al modelo Mensaje"""
    # Importar después de configurar el path
    from app import app, db
    
    with app.app_context():
        try:
            print("🔧 Agregando campos multimedia a la tabla Mensaje...")
            
            with db.engine.connect() as conn:
                # Agregar campo num_media
                try:
                    conn.execute(text('ALTER TABLE mensaje ADD COLUMN num_media INTEGER DEFAULT 0'))
                    print("✅ Campo 'num_media' agregado")
                except Exception as e:
                    print(f"ℹ️  Campo 'num_media' ya existe o error: {e}")
                
                # Agregar campo media_urls
                try:
                    conn.execute(text('ALTER TABLE mensaje ADD COLUMN media_urls TEXT'))
                    print("✅ Campo 'media_urls' agregado")
                except Exception as e:
                    print(f"ℹ️  Campo 'media_urls' ya existe o error: {e}")
                
                # Agregar campo media_types
                try:
                    conn.execute(text('ALTER TABLE mensaje ADD COLUMN media_types TEXT'))
                    print("✅ Campo 'media_types' agregado")
                except Exception as e:
                    print(f"ℹ️  Campo 'media_types' ya existe o error: {e}")
                
                conn.commit()
            
            print("\n✅ Migración completada exitosamente!")
            print("\n📝 Cambios aplicados:")
            print("   - Campo 'num_media' agregado (número de archivos multimedia)")
            print("   - Campo 'media_urls' agregado (URLs de los archivos)")
            print("   - Campo 'media_types' agregado (tipos MIME de los archivos)")
            print("\n🎉 Nueva funcionalidad:")
            print("   - Recepción de imágenes vía WhatsApp")
            print("   - Visualización de archivos multimedia en el chat")
            print("   - Soporte para múltiples archivos por mensaje")
            
        except Exception as e:
            print(f"\n❌ Error durante la migración: {str(e)}")
            print("\n💡 Si el error persiste:")
            print("   1. Haz backup de finca_reservas.db")
            print("   2. Elimina el archivo finca_reservas.db")
            print("   3. Ejecuta: python init_db.py")
            print("   4. Vuelve a ejecutar: python migrate_db.py")

if __name__ == '__main__':
    migrar_multimedia()
