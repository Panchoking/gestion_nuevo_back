import fitz  # PyMuPDF
import re
from datetime import datetime

def extraer_datos(path_pdf):
    doc = fitz.open(path_pdf)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    # print(f"DEBUG: Texto extraído ({len(text)} caracteres)")
    # print("DEBUG: Primeras 10 líneas del texto:")
    lines = text.split('\n')
    # for i, line in enumerate(lines[:10]):
    #     print(f"  Línea {i}: '{line}'")

    bloques = re.findall(r'(\d{1,2}\.\d{3}\.\d{3}-[\dkK].+?)(?=\n\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\Z)', text, re.DOTALL)
    # print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Total bloques detectados: {len(bloques)}")

    # print("DEBUG: Primeros 3 bloques encontrados:")
    # for i, bloque in enumerate(bloques[:3]):
    #     print(f"  Bloque {i}: '{bloque[:100]}...'")

    data = {
        "rut": [],
        "folio": [],
        "cuotas_pagadas": [],
        "total_cuotas": [],
        "monto_total": []
    }

    for i, bloque in enumerate(bloques):
        try:
            # print(f"\nDEBUG: Procesando bloque {i}")
            lineas_bloque = bloque.strip().split('\n')
            lineas_validas = []

            for linea in lineas_bloque:
                linea = linea.strip()
                if not linea:
                    continue
                if any(palabra in linea.upper() for palabra in [
                    'LA ARAUCANA', 'SOLUCIONES SOCIALES', 'NOMINA Y COMPROBANTE',
                    'CORRESPONDIENTE A:', 'PAGAR HASTA EL:', 'ANTECEDENTES DEL DEUDOR',
                    'TOTAL COBRANZA', 'FOLIO CREDITO', 'VALOR CUOTA'
                ]):
                    # print(f"DEBUG: Deteniendo en línea de encabezado: '{linea[:50]}...'")
                    break
                lineas_validas.append(linea)

            linea = " ".join(lineas_validas)
            # print(f"DEBUG: Línea limpia (solo parte válida): '{linea}'")

            rut_match = re.search(r'(\d{1,2}\.\d{3}\.\d{3}-[\dkK])', linea)
            if not rut_match:
                # print("DEBUG: No se encontró RUT")
                continue
            rut = rut_match.group(1)
            # print(f"DEBUG: RUT encontrado: {rut}")

            if rut.startswith("76."):
                # print(f"DEBUG: RUT de empresa filtrado: {rut}")
                continue

            rut_end = rut_match.end()
            texto_despues_rut = linea[rut_end:].strip()
            # print(f"DEBUG: Texto después del RUT: '{texto_despues_rut}'")

            folio_match = re.search(r'(\d{2,3}-\d{4,})', texto_despues_rut)
            if not folio_match:
                folio_match = re.search(r'(\d{1,3}-\d{3,})', texto_despues_rut)
            if not folio_match:
                # print("DEBUG: No se encontró folio")
                continue
            folio = folio_match.group(1)
            # print(f"DEBUG: Folio encontrado: {folio}")

            cuotas_match = re.search(r'(\d{1,2})/(\d{1,2})', linea)
            if cuotas_match:
                cuotas_pagadas = int(cuotas_match.group(1))
                total_cuotas = int(cuotas_match.group(2))
                # print(f"DEBUG: Cuotas encontradas: {cuotas_pagadas}/{total_cuotas}")
            else:
                # print("DEBUG: No se encontraron cuotas, asignando 1/1")
                cuotas_pagadas = 1
                total_cuotas = 1

            monto_total = 0
            if cuotas_match:
                texto_despues_cuotas = linea[cuotas_match.end():].strip()
                # print(f"DEBUG: Texto después de cuotas: '{texto_despues_cuotas}'")
                monto_match = re.search(r'(\d{1,3}\.\d{3})', texto_despues_cuotas)
                if monto_match:
                    monto_str = monto_match.group(1)
                    # print(f"DEBUG: Monto encontrado después de cuotas: '{monto_str}'")
                    monto_total = int(monto_str.replace('.', ''))
                else:
                    monto_match = re.search(r'(\d{4,6})', texto_despues_cuotas)
                    if monto_match:
                        monto_str = monto_match.group(1)
                        # print(f"DEBUG: Monto sin formato encontrado: '{monto_str}'")
                        monto_total = int(monto_str)
            else:
                cero_match = re.search(r'\s0\s', linea)
                if cero_match:
                    texto_despues_cero = linea[cero_match.end():].strip()
                    # print(f"DEBUG: Texto después de 0: '{texto_despues_cero}'")
                    monto_match = re.search(r'(\d{1,3}\.\d{3})', texto_despues_cero)
                    if monto_match:
                        monto_str = monto_match.group(1)
                        # print(f"DEBUG: Monto encontrado después de 0: '{monto_str}'")
                        monto_total = int(monto_str.replace('.', ''))

            if monto_total == 0:
                # print("DEBUG: No se encontró monto válido")
                continue

            # print(f"DEBUG: Monto procesado: {monto_total}")
            if total_cuotas > 100 or cuotas_pagadas > total_cuotas or monto_total < 1000:
                # print(f"DEBUG: Validación fallida - cuotas: {cuotas_pagadas}/{total_cuotas}, monto: {monto_total}")
                continue

            data["rut"].append(rut)
            data["folio"].append(folio)
            data["cuotas_pagadas"].append(cuotas_pagadas if cuotas_pagadas > 0 else 1)
            data["total_cuotas"].append(total_cuotas if total_cuotas > 0 else 1)
            data["monto_total"].append(monto_total)

            # print(f"DEBUG:  REGISTRO AGREGADO - RUT: {rut}, Folio: {folio}, Cuotas: {cuotas_pagadas}/{total_cuotas}, Monto: {monto_total}")

        except Exception as e:
            # print(f" Error al procesar bloque {i}: {e}")
            # print(f"   Contenido del bloque: '{bloque[:200]}...'")
            continue

    # print(f"\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Procesamiento completado")
    # print(f"INFO: Total registros procesados: {len(data['rut'])}")
    return data

if __name__ == "__main__":
    import sys
    import json
    path_pdf = sys.argv[1]
    #print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} INFO: Script iniciado")
    datos = extraer_datos(path_pdf)

    resultado = {
        "rut": datos["rut"],
        "folio": datos["folio"],
        "cuotas_pagadas": datos["cuotas_pagadas"],
        "total_cuotas": datos["total_cuotas"],
        "monto_total": datos["monto_total"]
    }

    print(json.dumps(resultado, indent=2, ensure_ascii=False))
