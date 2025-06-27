import pandas as pd
import os
import sys
import json
import traceback
from datetime import datetime

# Palabras clave a buscar en los nombres de columnas
columnas_clave = {'sueldo', 'sueldos', 'sueldo base', 'anticipo'}


def log_error(mensaje, detalle=None):
    """Función para logging de errores con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "level": "ERROR",
        "message": mensaje
    }
    if detalle:
        log_entry["details"] = detalle
    
    # Imprimir a stderr para no interferir con la salida JSON principal
    print(json.dumps(log_entry), file=sys.stderr)

def log_info(mensaje, datos=None):
    """Función para logging de información con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "level": "INFO",
        "message": mensaje
    }
    if datos:
        log_entry["data"] = datos
    
    print(json.dumps(log_entry), file=sys.stderr)

def log_warning(mensaje, datos=None):
    """Función para logging de advertencias con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "level": "WARNING",
        "message": mensaje
    }
    if datos:
        log_entry["data"] = datos
    
    print(json.dumps(log_entry), file=sys.stderr)

def validar_archivo(ruta_archivo):
    """Validar que el archivo existe y es accesible"""
    try:
        if not os.path.exists(ruta_archivo):
            raise FileNotFoundError(f"El archivo no existe: {ruta_archivo}")
        
        if not os.path.isfile(ruta_archivo):
            raise ValueError(f"La ruta no apunta a un archivo: {ruta_archivo}")
        
        if os.path.getsize(ruta_archivo) == 0:
            raise ValueError(f"El archivo está vacío: {ruta_archivo}")
        
        log_info("Archivo validado correctamente", {
            "ruta": ruta_archivo,
            "tamaño_bytes": os.path.getsize(ruta_archivo)
        })
        
    except Exception as e:
        log_error("Error en validación de archivo", {
            "ruta": ruta_archivo,
            "error": str(e)
        })
        raise

def detectar_encabezado(ruta_archivo, claves_objetivo, encoding='latin1', sep=';'):
    """Busca automáticamente la fila que contiene los encabezados correctos"""
    with open(ruta_archivo, 'r', encoding=encoding, errors='ignore') as f:
        for idx, linea in enumerate(f):
            columnas = [col.strip().lower() for col in linea.strip().split(sep)]
            if any(clave in columnas for clave in claves_objetivo):
                log_info("Encabezado detectado", {
                    "fila_encabezado": idx,
                    "columnas_detectadas": columnas
                })
                return idx
    raise ValueError("No se encontró una fila con encabezados válidos.")

def cargar_archivo(ruta_archivo):
    log_info("Iniciando carga de archivo", {"ruta": ruta_archivo})
    
    validar_archivo(ruta_archivo)
    ext = os.path.splitext(ruta_archivo)[-1].lower()
    log_info("Extensión detectada", {"extension": ext})

    claves_normalizadas = {k.lower().strip().replace(" ", "_") for k in columnas_clave}

    try:
        if ext == '.csv':
            intentos = [
                {"encoding": "utf-8", "sep": ','},
                {"encoding": "utf-8", "sep": ';'},
                {"encoding": "latin1", "sep": ','},
                {"encoding": "latin1", "sep": ';'},
            ]
            for intento in intentos:
                try:
                    header_idx = detectar_encabezado(ruta_archivo, claves_normalizadas, intento['encoding'], intento['sep'])
                    df = pd.read_csv(
                        ruta_archivo,
                        dtype=str,
                        encoding=intento['encoding'],
                        sep=intento['sep'],
                        header=header_idx
                    )
                    log_info("CSV cargado exitosamente", {
                        "encoding": intento['encoding'],
                        "sep": intento['sep'],
                        "header_fila": header_idx
                    })
                    break
                except Exception as e:
                    log_warning("Error leyendo CSV en intento", {
                        "error": str(e),
                        "encoding": intento['encoding'],
                        "sep": intento['sep']
                    })
                    continue
            else:
                raise ValueError("No se pudo cargar el archivo CSV con ningún intento válido")

        # (resto de casos para xlsx y txt se mantiene igual...)

        if df.empty:
            raise ValueError("El archivo no contiene datos")

        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        
        log_info("Archivo cargado exitosamente", {
            "filas": len(df),
            "columnas": len(df.columns),
            "nombres_columnas": list(df.columns)
        })
        
        return df

    except Exception as e:
        log_error("Error general cargando archivo", {
            "ruta": ruta_archivo,
            "extension": ext,
            "error": str(e),
            "traceback": traceback.format_exc()
        })
        raise


def extraer_columnas_interes(df, claves):
    log_info("Iniciando extracción de columnas de interés")
    
    columnas_df = [col.lower().strip() for col in df.columns]
    columnas_mapeadas = dict(zip(columnas_df, df.columns))
    
    log_info("Columnas disponibles procesadas", {
        "columnas_originales": list(df.columns),
        "columnas_normalizadas": columnas_df
    })
    
    # Copiar claves y agregar 'rut' si está presente
    claves_a_buscar = set(claves)
    if 'rut' in columnas_df:
        claves_a_buscar.add('rut')
        log_info("Columna RUT encontrada, agregada a búsqueda")
    
    log_info("Claves a buscar", {"claves": list(claves_a_buscar)})
    
    columnas_encontradas = [
        columnas_mapeadas[col]
        for col in columnas_df
        if col in claves_a_buscar
    ]
    
    if columnas_encontradas:
        log_info("Columnas encontradas", {
            "columnas_encontradas": columnas_encontradas,
            "total_encontradas": len(columnas_encontradas)
        })
        return df[columnas_encontradas]
    else:
        log_warning("No se encontraron columnas de interés", {
            "claves_buscadas": list(claves_a_buscar),
            "columnas_disponibles": columnas_df
        })
        return pd.DataFrame()

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            log_error("No se proporcionó ruta de archivo")
            print(json.dumps({"error": "Debe proporcionar la ruta del archivo como argumento"}))
            sys.exit(1)

        ruta = sys.argv[1]
        log_info("Script iniciado", {"ruta_archivo": ruta})

        df = cargar_archivo(ruta)
        columnas_extraidas = extraer_columnas_interes(df, columnas_clave)

        data = {}

        if not columnas_extraidas.empty:
            log_info("Procesando datos extraídos")
            for columna in columnas_extraidas.columns:
                valores = columnas_extraidas[columna].fillna('').astype(str).tolist()
                clave = columna.lower().strip().replace(' ', '_')
                data[clave] = valores
                log_info(f"Procesada columna: {columna}", {
                    "clave_generada": clave,
                    "total_valores": len(valores),
                    "valores_vacios": valores.count('')
                })
        else:
            log_warning("No se extrajeron datos")

        log_info("Proceso completado exitosamente", {
            "total_columnas_procesadas": len(data),
            "claves_finales": list(data.keys())
        })

        print(json.dumps(data))  # Salida limpia en formato JSON

    except Exception as e:
        log_error("Error fatal en script", {
            "error": str(e),
            "traceback": traceback.format_exc()
        })
        print(json.dumps({"error": str(e)}))
        sys.exit(1)