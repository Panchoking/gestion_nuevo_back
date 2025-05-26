import express from 'express';

import {
    getCentro,
    getCentros,
    createCentro,
    updateCentro,
    deleteCentro,
} from './centro.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// rutas RESTful -> ya se especifica que es cada una con el .post, .get etc
router.post('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), createCentro);

router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getCentros);

router.get('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getCentro);

router.put('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), updateCentro);

router.delete('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), deleteCentro);

export default router;