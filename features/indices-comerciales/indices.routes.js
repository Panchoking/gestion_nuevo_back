//índice.routes.js
import express from 'express';
import { 
  getAllIndices, 
  getIndexByField, 
  updateIndexByField,
  getDailyUF,
  getUTMbyDate,
  getUTM,
  obtenerIPC,
  getHistorialUTM,
  getTramosIUSC,
  getAFP,
  getUFByDate,
  getAFC,
  calcularLiquidacion,
  calcularSueldoBaseDesdeNeto,
  calcularLiquidacionesMultiples,
  calcularCotizacionEmpresa,
  crearPrestamoInterno,
  getPrestamosActivos
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
router.get('/utm/date', authenticateToken, getUTMbyDate);

router.get('/utm/historial', authenticateToken, getHistorialUTM); // Nueva ruta para historial

//iusc
router.get('/iusc', authenticateToken, getTramosIUSC);

// IPC
router.get('/ipc/anual', authenticateToken, obtenerIPC);

// CALCULOS
router.post('/calculos/liquidacion', calcularLiquidacion);
router.post('/calculos/sueldo-base', calcularSueldoBaseDesdeNeto);
router.post('/calculos/liquidaciones', calcularLiquidacionesMultiples);


router.post('/cotizacion-empresa', calcularCotizacionEmpresa);

router.post('/prestamo-interno', authenticateToken, crearPrestamoInterno);
router.get('/prestamos-activos/:userId', authenticateToken, getPrestamosActivos);

export default router;