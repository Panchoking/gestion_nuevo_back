//índice.routes.js
import express from 'express';
import { 
  getAllIndices, 
  getIndexByField, 
  updateIndexByField,
  getDailyUF,
  getUTM,
  obtenerIPC,
  getHistorialUTM,
  getTramosIUSC,
  getAFP,
  getUFByDate,
  getAFC,
  calcularSueldoTotal
} from './indices.controller.js';
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// Public routes
router.get('/generales/', authenticateToken, getAllIndices);
router.get('/generales/:field', authenticateToken, getIndexByField);
router.put('/generales/:field', authenticateToken, verificarAcceso(), updateIndexByField);

// AFP
router.get('/afp', authenticateToken, getAFP);

// SEGURO CESANTIA AFC
router.get('/afc', authenticateToken, getAFC);

// UF Y UTM
router.get('/uf', getDailyUF);
router.get('/uf/date', authenticateToken, getUFByDate);

router.get('/utm', authenticateToken, getUTM);
router.get('/utm/historial', authenticateToken, getHistorialUTM); // Nueva ruta para historial

//iusc
router.get('/iusc', authenticateToken, getTramosIUSC);

// IPC
router.get('/ipc/anual', authenticateToken, obtenerIPC);


//calculo sueldo

router.post('/calcular-sueldo', authenticateToken, (req, res) => {
    const { sueldoBase, horasExtras, imm, horasSemanales } = req.body;

    if (
        isNaN(sueldoBase) ||
        isNaN(horasExtras) ||
        isNaN(imm) ||
        isNaN(horasSemanales)
    ) {
        return res.status(400).json({
            success: false,
            message: "Todos los parámetros deben ser números válidos",
        });
    }

    try {
        const resultado = calcularSueldoTotal(sueldoBase, horasExtras, imm, horasSemanales);
        return res.status(200).json({
            success: true,
            result: resultado
        });
    } catch (error) {
        console.error("Error al calcular sueldo total:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error al calcular sueldo total",
            error: error.message
        });
    }
});

export default router;