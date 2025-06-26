import path from 'path';
import fs from 'fs';

export const cargarArchivo = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const archivoTemporal = req.file;
    const nombreOriginal = archivoTemporal.originalname;
    const nombreArchivo = `${Date.now()}-${nombreOriginal}`;
    const rutaCarpeta = path.join(process.cwd(), 'archivos_scrap'); // Usa process.cwd() para obtener ruta raíz
    const rutaDestino = path.join(rutaCarpeta, nombreArchivo);

    // Si no existe la carpeta scrap, créala
    if (!fs.existsSync(rutaCarpeta)) {
      fs.mkdirSync(rutaCarpeta);
    }

    fs.writeFileSync(rutaDestino, archivoTemporal.buffer);

    res.json({ success: true, nombre: nombreArchivo });
  } catch (err) {
    console.error('Error al guardar archivo:', err);
    res.status(500).json({ error: 'Error interno al guardar el archivo.' });
  }
};
