// indicadores.routes.js
import express from 'express';
import { obtenerYGuardarUF, obtenerYGuardarUTM,obtenerHistorialUTMDesdeSBIF,obtenerYGuardarIPC } from './indicadores_F.js';

const router = express.Router();

// Ruta para actualizar UF
router.get('/uf', async (req, res) => {
  try {
    const uf = await obtenerYGuardarUF(); // llama a función que guarda en la BD
    console.log('UF actualizada:', uf);
    res.json({ success: true, uf });
  } catch (error) {
    console.error('Error al obtener o guardar UF:', error.message);
    res.status(500).json({ success: false, message: 'Error al obtener o guardar UF' });
  }
});

// Ruta para actualizar UTM
router.get('/utm', async (req, res) => {
  try {
    const utm = await obtenerYGuardarUTM(); // llama a función que guarda en la BD
    console.log('UTM actualizada:', utm);
    res.json({ success: true, utm });
  } catch (error) {
    console.error('Error al obtener o guardar UTM:', error.message);
    res.status(500).json({ success: false, message: 'Error al obtener o guardar UTM' });
  }
});
// funcion para traer utm ultimo 6 meses

router.get('/utm/historico', async (req, res) => {
  try {
    const historial = await obtenerHistorialUTMDesdeSBIF();
    res.json({ success: true, historial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener historial desde SBIF' });
  }
});
export default router;


router.get('/ipc', async (req, res) => {
  try {
    const ipc = await obtenerYGuardarIPC();
    res.json({ success: true, ipc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener IPC' });
  }
});
