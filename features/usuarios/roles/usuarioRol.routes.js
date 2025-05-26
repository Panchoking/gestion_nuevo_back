import express from 'express';

import {
    getAsignacion,
    getAsignaciones,
    createAsignacion,
    deleteAsignacion,
} from './usuarioRol.controller.js';

// middlewares
import verificarAcceso from '../../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../../middlewares/authenticateToken.js';

const router = express.Router();

// rutas RESTful -> ya se especifica que es cada una con el .post, .get etc
router.post('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), createAsignacion);

router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getAsignaciones);

router.get('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getAsignacion);

router.delete('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), deleteAsignacion);

export default router;