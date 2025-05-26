// routes/datosPersonalesRoutes.js
import express from 'express';
import { 
    getDatosPersonales, 
    getDatosPersonalesByUserId, 
    createDatosPersonales, 
    updateDatosPersonales, 
    deleteDatosPersonales 
} 
from './dp.controller.js'; 

// middlewares
import verificarAcceso from '../../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../../middlewares/authenticateToken.js';

const router = express.Router();


router.get('/get-all', authenticateToken, verificarAcceso(), getDatosPersonales); 
router.get('/:id_usuario', authenticateToken, verificarAcceso(), getDatosPersonalesByUserId);
router.post('/', authenticateToken, verificarAcceso(), createDatosPersonales);
router.put('/:id_usuario', authenticateToken, verificarAcceso(), updateDatosPersonales);
router.delete('/:id_usuario', authenticateToken, verificarAcceso(), deleteDatosPersonales);

export default router;