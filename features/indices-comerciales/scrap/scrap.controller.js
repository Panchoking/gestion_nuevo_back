import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta correcta a la carpeta de archivos cargados
const rutaArchivosScrap = path.join(__dirname, '../../../archivos_scrap');

export const ejecutarScraping = (req, res) => {
  const { archivo } = req.query;

  if (!archivo) {
    return res.status(400).json({ error: 'Debes proporcionar el nombre del archivo a procesar.' });
  }

  const rutaScript = path.join(__dirname, 'scrap.py');
  const rutaArchivo = path.join(rutaArchivosScrap, archivo); // <--- ahora sí apunta bien

  const comando = `python "${rutaScript}" "${rutaArchivo}"`;

  exec(comando, (error, stdout, stderr) => {
    // Eliminar el archivo procesado
    try {
      fs.unlinkSync(rutaArchivo);
      console.log('🧹 Archivo temporal eliminado correctamente');
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar el archivo:', err.message);
    }

    if (error) {
      console.error('❌ Error al ejecutar script:', error);
      return res.status(500).json({ error: error.message });
    }

    if (stderr) {
      console.warn('⚠️ stderr:', stderr);
    }

    try {
      const data = JSON.parse(stdout);
      res.json({
        mensaje: '✅ Script ejecutado correctamente',
        data
      });
    } catch (err) {
      console.error('❌ Error al parsear salida del script:', err.message);
      res.status(500).json({ error: 'Error al procesar datos del script.' });
    }
  });
};
