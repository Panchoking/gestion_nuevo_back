import express from 'express';

import {
    getHorarios,
    updateHorario,
    createHorario,
    deleteHorario,

    updateEstadoHorario,
    verificarRegistroHorario,
    activateHorario,
} from './horarios.controller.js';

//middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';

import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// RUTAS REVISADAS
router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getHorarios);

// RUTAS PENDIENTES
router.post('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), createHorario);

router.delete('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), deleteHorario);

router.put('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), updateHorario);

router.put('/estado/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), updateEstadoHorario);

router.put('/activate/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), activateHorario);

router.get('/verificar-registros/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), verificarRegistroHorario);

export default router;