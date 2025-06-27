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
  const rutaArchivo = path.join(rutaArchivosScrap, archivo);

  // Verificar que el archivo existe antes de procesarlo
  if (!fs.existsSync(rutaArchivo)) {
    console.error(`❌ Archivo no encontrado: ${rutaArchivo}`);
    return res.status(404).json({ error: 'El archivo especificado no existe.' });
  }

  const comando = `python "${rutaScript}" "${rutaArchivo}"`;
  
  console.log(`🔄 Iniciando procesamiento de: ${archivo}`);

  exec(comando, (error, stdout, stderr) => {
    // Array para almacenar todos los logs
    const logs = [];
    
    // Procesar logs de stderr si existen
    if (stderr) {
      const stderrLines = stderr.trim().split('\n');
      
      stderrLines.forEach(line => {
        if (line.trim()) {
          try {
            // Intentar parsear como JSON (logs estructurados)
            const logEntry = JSON.parse(line);
            logs.push(logEntry);
            
            // Mostrar logs en consola con formato amigable
            const timestamp = logEntry.timestamp || new Date().toISOString();
            const level = logEntry.level || 'INFO';
            const message = logEntry.message || '';
            
            console.log(`[${level}] ${timestamp}: ${message}`);
            
            // Mostrar detalles adicionales si existen
            if (logEntry.details) {
              console.log('   📋 Detalles:', JSON.stringify(logEntry.details, null, 2));
            }
            if (logEntry.data) {
              console.log('   📊 Datos:', JSON.stringify(logEntry.data, null, 2));
            }
            
          } catch (parseError) {
            // Si no es JSON válido, tratarlo como log plano
            console.log(`[LOG] ${line}`);
            logs.push({
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: line,
              raw: true
            });
          }
        }
      });
    }

    // Eliminar el archivo procesado
    try {
      fs.unlinkSync(rutaArchivo);
      console.log('🧹 Archivo temporal eliminado correctamente');
    } catch (err) {
      console.warn('⚠️ No se pudo eliminar el archivo:', err.message);
    }

    // Manejar errores de ejecución
    if (error) {
      console.error('❌ Error al ejecutar script:', error.message);
      
      // Buscar logs de error específicos
      const errorLogs = logs.filter(log => log.level === 'ERROR');
      
      return res.status(500).json({ 
        error: error.message,
        logs: logs,
        errorDetails: errorLogs.length > 0 ? errorLogs : null,
        processingInfo: {
          archivo: archivo,
          rutaCompleta: rutaArchivo,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Intentar parsear la salida principal (stdout)
    try {
      const data = JSON.parse(stdout);
      
      // Verificar si la respuesta contiene un error
      if (data.error) {
        console.error('❌ Error reportado por script:', data.error);
        
        return res.status(400).json({
          error: data.error,
          logs: logs,
          processingInfo: {
            archivo: archivo,
            rutaCompleta: rutaArchivo,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Respuesta exitosa
      console.log('✅ Script ejecutado correctamente');
      
      // Mostrar estadísticas de procesamiento
      const totalColumnas = Object.keys(data).length;
      const totalRegistros = totalColumnas > 0 ? Math.max(...Object.values(data).map(arr => arr.length)) : 0;
      
      console.log(`📊 Procesamiento completado: ${totalColumnas} columnas, ${totalRegistros} registros`);
      
      res.json({
        mensaje: '✅ Script ejecutado correctamente',
        data,
        logs: logs,
        processingStats: {
          totalColumnas,
          totalRegistros,
          columnasEncontradas: Object.keys(data),
          archivo: archivo,
          timestamp: new Date().toISOString()
        }
      });

    } catch (parseError) {
      console.error('❌ Error al parsear salida del script:', parseError.message);
      console.error('📄 Salida recibida:', stdout);
      
      res.status(500).json({ 
        error: 'Error al procesar datos del script.',
        logs: logs,
        rawOutput: stdout,
        parseError: parseError.message,
        processingInfo: {
          archivo: archivo,
          rutaCompleta: rutaArchivo,
          timestamp: new Date().toISOString()
        }
      });
    }
  });
};