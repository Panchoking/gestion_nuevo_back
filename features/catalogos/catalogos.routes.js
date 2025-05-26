import express from 'express';

import {
    getComunas,
    getNacionalidades,
    getRegiones,
    getEntidadesPrevisionales,
    getBancos
} from './catalogos.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// Obtener todas las comunas (disponible para cualquier usuario autenticado)
router.get('/comunas', authenticateToken, getComunas);
// Obtener todas las nacionalidades (disponible para cualquier usuario autenticado)
router.get('/nacionalidades', authenticateToken, getNacionalidades);
// Obtener todas las regiones (disponible para cualquier usuario autenticado)
router.get('/regiones', authenticateToken, getRegiones);
// Obtener todas las entidades previsionales (disponible para cualquier usuario autenticado)
router.get('/entidades-previsionales', authenticateToken, getEntidadesPrevisionales);
// Obtener todos los bancos (disponible para cualquier usuario autenticado)
router.get('/bancos', authenticateToken, getBancos);

export default router;