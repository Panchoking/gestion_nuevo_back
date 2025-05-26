import express from 'express';

import {
    getClientes,
    getClienteById,
} from './cliente.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// rutas
router.get('/', authenticateToken, verificarAcceso([
    { plataforma: 'CHECK', roles: ['ADMINISTRADOR'] },
]), getClientes);

router.get('/:id', authenticateToken, verificarAcceso([
    { plataforma: 'CHECK', roles: ['ADMINISTRADOR'] },
]), getClienteById);

export default router;