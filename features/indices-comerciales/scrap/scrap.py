import pandas as pd
import os
import sys
import json

# Palabras clave a buscar en los nombres de columnas
columnas_clave = {'sueldo', 'sueldos', 'sueldo base', 'anticipo'}

def cargar_archivo(ruta_archivo):
    ext = os.path.splitext(ruta_archivo)[-1].lower()

    if ext == '.csv':
        df = pd.read_csv(ruta_archivo, dtype=str)
    elif ext == '.xlsx':
        df = pd.read_excel(ruta_archivo, dtype=str)
    elif ext == '.txt':
        # Supongamos que el archivo txt está separado por tabulaciones o punto y coma
        try:
            df = pd.read_csv(ruta_archivo, sep='\t', dtype=str)
        except:
            df = pd.read_csv(ruta_archivo, sep=';', dtype=str)
    else:
        raise ValueError("Tipo de archivo no soportado: debe ser .csv, .xlsx o .txt")

    return df

def extraer_columnas_interes(df, claves):
    columnas_df = [col.lower().strip() for col in df.columns]
    columnas_mapeadas = dict(zip(columnas_df, df.columns))

    columnas_encontradas = [columnas_mapeadas[col] for col in columnas_df if col in claves]

    if columnas_encontradas:
        return df[columnas_encontradas]
    else:
        return pd.DataFrame()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Debe proporcionar la ruta del archivo como argumento"}))
        sys.exit(1)

    ruta = sys.argv[1]

    try:
        df = cargar_archivo(ruta)
        columnas_extraidas = extraer_columnas_interes(df, columnas_clave)

        data = {}

        if not columnas_extraidas.empty:
            for columna in columnas_extraidas.columns:
                valores = columnas_extraidas[columna].fillna('').astype(str).tolist()
                clave = columna.lower().strip().replace(' ', '_')
                data[clave] = valores

        print(json.dumps(data))  # ✅ Salida limpia en formato JSON

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
