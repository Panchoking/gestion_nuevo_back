import express from 'express';

import { 
  getAllIndices, 
  getIndexByField, 
  updateIndexByField,
  updateMultipleIndices,
  getDailyUF,
  getUTM
} from './indices.controller.js';

import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

// Public routes
router.get('/generales/', authenticateToken, getAllIndices);
router.get('/generales/:field', authenticateToken ,getIndexByField);

// Protected routes - only admins or users with RRHH role
router.put('/generales/:field', authenticateToken, verificarAcceso(), updateIndexByField);
router.put('/generales/', authenticateToken, verificarAcceso(), updateMultipleIndices);


// UF Y UTM
router.get('/uf', authenticateToken, getDailyUF);
router.get('/utm', authenticateToken, getUTM);

export default router;