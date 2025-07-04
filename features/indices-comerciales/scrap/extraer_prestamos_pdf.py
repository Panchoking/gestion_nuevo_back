import fitz  # PyMuPDF
import re
from datetime import datetime

def extraer_datos(path_pdf):
    doc = fitz.open(path_pdf)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    print(f"DEBUG: Texto extraído ({len(text)} caracteres)")
    print("DEBUG: Primeras 10 líneas del texto:")
    lines = text.split('\n')
    for i, line in enumerate(lines[:10]):
        print(f"  Línea {i}: '{line}'")

    # Tu regex original
    bloques = re.findall(r'(\d{1,2}\.\d{3}\.\d{3}-[\dkK].+?)(?=\n\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\Z)', text, re.DOTALL)
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Total bloques detectados: {len(bloques)}")

    # Debug: mostrar los primeros bloques encontrados
    print("DEBUG: Primeros 3 bloques encontrados:")
    for i, bloque in enumerate(bloques[:3]):
        print(f"  Bloque {i}: '{bloque[:100]}...'")

    data = {
        "rut": [],
        "cuotas_pagadas": [],
        "total_cuotas": [],
        "monto_total": []
    }

    for i, bloque in enumerate(bloques):
        try:
            print(f"\nDEBUG: Procesando bloque {i}")
            
            # Limpiar el bloque - cortar en encabezados
            lineas_bloque = bloque.strip().split('\n')
            lineas_validas = []
            
            for linea in lineas_bloque:
                linea = linea.strip()
                if not linea:
                    continue
                    
                # Si encontramos una línea de encabezado, paramos
                if any(palabra in linea.upper() for palabra in [
                    'LA ARAUCANA', 'SOLUCIONES SOCIALES', 'NOMINA Y COMPROBANTE',
                    'CORRESPONDIENTE A:', 'PAGAR HASTA EL:', 'ANTECEDENTES DEL DEUDOR',
                    'TOTAL COBRANZA', 'FOLIO CREDITO', 'VALOR CUOTA'
                ]):
                    print(f"DEBUG: Deteniendo en línea de encabezado: '{linea[:50]}...'")
                    break
                
                lineas_validas.append(linea)
            
            # Unir solo las líneas válidas
            linea = " ".join(lineas_validas)
            print(f"DEBUG: Línea limpia (solo parte válida): '{linea}'")

            # Excluir RUTs que comiencen con 76
            rut_match = re.search(r'(\d{1,2}\.\d{3}\.\d{3}-[\dkK])', linea)
            if not rut_match:
                print("DEBUG: No se encontró RUT")
                continue
                
            rut = rut_match.group(1)
            print(f"DEBUG: RUT encontrado: {rut}")
            
            if rut.startswith("76."):
                print(f"DEBUG: RUT de empresa filtrado: {rut}")
                continue

            # Cuotas pagadas / totales
            cuotas_match = re.search(r'(\d{1,2})/(\d{1,2})', linea)
            if cuotas_match:
                cuotas_pagadas = int(cuotas_match.group(1))
                total_cuotas = int(cuotas_match.group(2))
                print(f"DEBUG: Cuotas encontradas: {cuotas_pagadas}/{total_cuotas}")
            else:
                print("DEBUG: No se encontraron cuotas, asignando 1/1")
                cuotas_pagadas = 1
                total_cuotas = 1

            # 🔧 MONTO CORREGIDO - Buscar el primer monto después de las cuotas
            print("DEBUG: Buscando monto...")
            
            # Estrategia: buscar el monto que viene después del patrón de cuotas X/Y o después de "0"
            monto_total = 0
            
            if cuotas_match:
                # Buscar después del patrón X/Y
                texto_despues_cuotas = linea[cuotas_match.end():].strip()
                print(f"DEBUG: Texto después de cuotas: '{texto_despues_cuotas}'")
                
                # Buscar el primer número con formato de monto
                monto_match = re.search(r'(\d{1,3}\.\d{3})', texto_despues_cuotas)
                if monto_match:
                    monto_str = monto_match.group(1)
                    print(f"DEBUG: Monto encontrado después de cuotas: '{monto_str}'")
                    monto_total = int(monto_str.replace('.', ''))
                else:
                    # Si no hay punto, buscar número simple
                    monto_match = re.search(r'(\d{4,6})', texto_despues_cuotas)
                    if monto_match:
                        monto_str = monto_match.group(1)
                        print(f"DEBUG: Monto sin formato encontrado: '{monto_str}'")
                        monto_total = int(monto_str)
            else:
                # Para pagos únicos (valor 0), buscar después del 0
                cero_match = re.search(r'\s0\s', linea)
                if cero_match:
                    texto_despues_cero = linea[cero_match.end():].strip()
                    print(f"DEBUG: Texto después de 0: '{texto_despues_cero}'")
                    
                    monto_match = re.search(r'(\d{1,3}\.\d{3})', texto_despues_cero)
                    if monto_match:
                        monto_str = monto_match.group(1)
                        print(f"DEBUG: Monto encontrado después de 0: '{monto_str}'")
                        monto_total = int(monto_str.replace('.', ''))
            
            if monto_total == 0:
                print("DEBUG: No se encontró monto válido")
                continue

            print(f"DEBUG: Monto procesado: {monto_total}")

            # Validaciones básicas
            if total_cuotas > 100 or cuotas_pagadas > total_cuotas or monto_total < 1000:
                print(f"DEBUG: Validación fallida - cuotas: {cuotas_pagadas}/{total_cuotas}, monto: {monto_total}")
                continue

            # Agregar a estructura
            data["rut"].append(rut)
            data["cuotas_pagadas"].append(cuotas_pagadas if cuotas_pagadas > 0 else 1)
            data["total_cuotas"].append(total_cuotas if total_cuotas > 0 else 1)
            data["monto_total"].append(monto_total)

            print(f"DEBUG: ✅ REGISTRO AGREGADO - RUT: {rut}, Cuotas: {cuotas_pagadas}/{total_cuotas}, Monto: {monto_total}")

        except Exception as e:
            print(f"⚠️ Error al procesar bloque {i}: {e}")
            print(f"   Contenido del bloque: '{bloque[:200]}...'")
            continue

    print(f"\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Procesamiento completado")
    print(f"INFO: Total registros procesados: {len(data['rut'])}")
    return data

if __name__ == "__main__":
    import sys
    import json
    path_pdf = sys.argv[1]
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Script iniciado")
    datos = extraer_datos(path_pdf)
    
    # Solo devolver las 4 columnas que necesitas
    resultado = {
        "rut": datos["rut"],
        "cuotas_pagadas": datos["cuotas_pagadas"],
        "total_cuotas": datos["total_cuotas"],
        "monto_total": datos["monto_total"]
    }
    
    print(json.dumps(resultado, indent=2, ensure_ascii=False))