import express from 'express';

import {
    getFeriados,
    updateFeriado,
    createFeriado,
    deleteFeriado,

} from './feriados.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// obtener todos los feriados (disponible para cualquier usuario autenticado)
router.get('/', authenticateToken, getFeriados);

// crear feriado
router.post('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] }
]), createFeriado);

// editar feriado
router.put('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] }
]), updateFeriado);

// eliminar feriado
router.delete('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] }
]), deleteFeriado);


export default router;
