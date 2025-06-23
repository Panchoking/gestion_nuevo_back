//índice.routes.js
import express from 'express';
import multer from 'multer';
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
  obtenerHistorialLiquidaciones,
  calcularCotizacionEmpresa,
  crearPrestamoInterno,
  getPrestamos,
  updateAFPById,
  updateIUSCByTramo,
  updateAFCById,
  eliminarLiquidaciones
} from './indices.controller.js';
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';
import {
  guardarPDF,
  obtenerPDFsUsuario,
  descargarPDF,
  obtenerTodosPDFs
} from './pdfs/pdf.controller.js';


const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});


// Public routes
router.get('/generales/', authenticateToken, getAllIndices);
router.get('/generales/:field', authenticateToken, getIndexByField);
router.put('/generales/:field', authenticateToken, verificarAcceso(), updateIndexByField);

// AFP
router.get('/afp', authenticateToken, getAFP);
router.put('/afp/:id', updateAFPById);

// SEGURO CESANTIA AFC
router.get('/afc', authenticateToken, getAFC);
router.put('/afc/:id', updateAFCById);

// UF Y UTM
router.get('/uf', getDailyUF);
router.get('/uf/date', authenticateToken, getUFByDate);

router.get('/utm', authenticateToken, getUTM);
router.get('/utm/date', authenticateToken, getUTMbyDate);

router.get('/utm/historial', authenticateToken, getHistorialUTM); // Nueva ruta para historial

//iusc
router.get('/iusc', authenticateToken, getTramosIUSC);
router.put('/iusc/:tramo', updateIUSCByTramo);


// IPC
router.get('/ipc/anual', authenticateToken, obtenerIPC);

// CALCULOS
router.post('/calculos/liquidacion', calcularLiquidacion);
router.post('/calculos/sueldo-base', calcularSueldoBaseDesdeNeto);
//liquidaciones multiples
router.post('/calculos/liquidaciones', calcularLiquidacionesMultiples);
router.get('/historial', obtenerHistorialLiquidaciones);

//eliminar registor por id
router.post('/eliminar-liquidaciones', eliminarLiquidaciones);

// PDF routes
// Rutas para PDF
router.post('/pdf/guardar', upload.single('pdf'), guardarPDF);
router.get('/pdf/usuario/:id_usuario', authenticateToken, obtenerPDFsUsuario);
router.get('/pdf/descargar/:id_pdf', authenticateToken, descargarPDF);
router.get('/pdf/todos', authenticateToken, obtenerTodosPDFs);


router.post('/cotizacion-empresa', calcularCotizacionEmpresa);

router.post('/prestamo-interno', authenticateToken, crearPrestamoInterno);
router.get('/prestamos-activos', authenticateToken, getPrestamos);

export default router;