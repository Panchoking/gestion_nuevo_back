//índice.routes.js
import express from 'express';
import { 
  getAllIndices, 
  getIndexByField, 
  updateIndexByField,
  getDailyUF,
  getUTM,
  obtenerYGuardarIPC,
  getHistorialUTM 
} from './indices.controller.js';
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// Public routes
router.get('/generales/', authenticateToken, getAllIndices);
router.get('/generales/:field', authenticateToken, getIndexByField);
router.put('/generales/:field', authenticateToken, verificarAcceso(), updateIndexByField);



// YA NO SE DEBERIAN USAR
// UF Y UTM
router.get('/uf', authenticateToken, getDailyUF);
router.get('/utm', authenticateToken, getUTM);
router.get('/utm/historial', authenticateToken, getHistorialUTM); // ← Nueva ruta para historial

// IPC (opcional) - Solo admins pueden actualizar IPC
router.post('/ipc/actualizar', authenticateToken, verificarAcceso(), async (req, res) => {
    try {
        const result = await obtenerYGuardarIPC();
        res.status(200).json({
            success: true,
            message: 'IPC actualizado correctamente',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error actualizando IPC',
            error: error.message
        });
    }
});

export default router;