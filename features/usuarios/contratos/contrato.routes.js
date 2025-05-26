// routes/contratoRoutes.js
import express from 'express';
import {
  getContratos,
  getTipoContrato,
  getContratoByUsuario,
  createContrato,
  updateContrato,
  deleteContrato,
} from './contrato.controller.js';

// middlewares
import verificarAcceso from '../../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../../middlewares/authenticateToken.js';

const router = express.Router();

router.get('/tipos', authenticateToken, getTipoContrato);
router.get('/', authenticateToken, getContratos);
router.get('/:usuario_id', authenticateToken, getContratoByUsuario); // siempre al ultimo por la :id

// solo RRHH
router.post('/', authenticateToken, verificarAcceso([
  { plataforma: 'GESTION', roles: ['RRHH'] }
]), createContrato);

router.put('/:usuario_id', authenticateToken, verificarAcceso([
  { plataforma: 'GESTION', roles: ['RRHH'] }
]), updateContrato);

router.delete('/:usuario_id', authenticateToken, verificarAcceso([
  { plataforma: 'GESTION', roles: ['RRHH'] }
]), deleteContrato);


export default router;
