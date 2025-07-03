import re
import sys
import json
import traceback
import pandas as pd
from PyPDF2 import PdfReader
from datetime import datetime

# Claves que nos interesan
columnas_clave = {'rut', 'cuotas_pagadas', 'total_cuotas', 'monto_total'}

# --- Funciones de logging estructurado ---
def log_info(message, details=None):
    log("INFO", message, details)

def log_warning(message, details=None):
    log("WARNING", message, details)

def log_error(message, details=None):
    log("ERROR", message, details)

def log(level, message, details=None):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message,
    }
    if details:
        log_entry["details"] = details
    print(json.dumps(log_entry), file=sys.stderr)

# --- Función para extraer cuotas desde PDF ---
def extraer_prestamos_desde_pdf(ruta_pdf):
    try:
        reader = PdfReader(ruta_pdf)
        texto_total = "\n".join(p.extract_text() for p in reader.pages if p.extract_text())

        resultados = []

        # Buscar cuotas tipo x/y
        patron_cuotas = re.compile(r"(\d{1,2}\.\d{3}\.\d{3}-[\dkK])\s+.*?\s+[\w\-]+\s+(\d{1,2})/(\d{1,2})\s+([\d.]+)")
        for match in patron_cuotas.finditer(texto_total):
            resultados.append({
                "rut": match.group(1),
                "cuotas_pagadas": int(match.group(2)),
                "total_cuotas": int(match.group(3)),
                "monto_total": int(match.group(4).replace('.', ''))
            })

        # Buscar RUT con 0 cuotas
        patron_cero_cuota = re.compile(r"(\d{1,2}\.\d{3}\.\d{3}-[\dkK])\s+.*?\s+[\w\-]+\s+0\s+([\d.]+)")
        for match in patron_cero_cuota.finditer(texto_total):
            resultados.append({
                "rut": match.group(1),
                "cuotas_pagadas": 1,
                "total_cuotas": 1,
                "monto_total": int(match.group(2).replace('.', ''))
            })

        df = pd.DataFrame(resultados).drop_duplicates()
        return df

    except Exception as e:
        log_error("Error procesando PDF", {"error": str(e), "traceback": traceback.format_exc()})
        return pd.DataFrame()

# --- Función para extraer columnas clave ---
def extraer_columnas_interes(df, claves):
    log_info("Iniciando extracción de columnas de interés")

    columnas_df = [col.lower().strip() for col in df.columns]
    columnas_mapeadas = dict(zip(columnas_df, df.columns))

    log_info("Columnas disponibles procesadas", {
        "columnas_originales": list(df.columns),
        "columnas_normalizadas": columnas_df
    })

    claves_a_buscar = set(claves)
    if 'rut' in columnas_df:
        claves_a_buscar.add('rut')
        log_info("Columna RUT encontrada, agregada a búsqueda")

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

# --- Ejecución principal ---
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            log_error("No se proporcionó ruta de archivo")
            print(json.dumps({"error": "Debe proporcionar la ruta del archivo como argumento"}))
            sys.exit(1)

        ruta = sys.argv[1]
        log_info("Script iniciado", {"ruta_archivo": ruta})

        df = extraer_prestamos_desde_pdf(ruta)
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

        print(json.dumps(data))

    except Exception as e:
        log_error("Error fatal en script", {
            "error": str(e),
            "traceback": traceback.format_exc()
        })
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
