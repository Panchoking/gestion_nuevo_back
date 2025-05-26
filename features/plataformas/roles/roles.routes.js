import express from 'express';

import {
    getRol,
    getRoles,
    createRol,
    updateRol,
    deleteRol,
} from './roles.controller.js';

// middlewares
import verificarAcceso from '../../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../../middlewares/authenticateToken.js';

const router = express.Router();

// rutas RESTful -> ya se especifica que es cada una con el .post, .get etc
router.post('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), createRol);

router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getRoles);

router.get('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getRol);

router.put('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), updateRol);

router.delete('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), deleteRol);

export default router;