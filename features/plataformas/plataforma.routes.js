import express from 'express';

import {
    getPlataforma,
    getPlataformas,
    createPlataforma,
    updatePlataforma,
    deletePlataforma,
} from './plataforma.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// rutas RESTful -> ya se especifica que es cada una con el .post, .get etc 
router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getPlataformas);

router.get('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getPlataforma);

// solo admins
router.post('/', authenticateToken, verificarAcceso(), createPlataforma);
router.put('/:id', authenticateToken, verificarAcceso(), updatePlataforma);
router.delete('/:id', authenticateToken, verificarAcceso(), deletePlataforma);

export default router;