// routes/bancoRoutes.js
import express from 'express';
import { 
  getCuentasBancarias, 
  getCuentaBancariaByUserId, 
  //createCuentaBancaria, 
  //updateCuentaBancaria, 
  //deleteCuentaBancaria 
} from './banco.controller.js'; 

const router = express.Router();


// TODO: arreglar rutas
router.get('/cuentas', getCuentasBancarias);
router.get('/cuentas/:id', getCuentaBancariaByUserId);
//router.post('/cuentas', createCuentaBancaria);
//router.put('/cuentas/:id', updateCuentaBancaria);
//router.delete('/cuentas/:id', deleteCuentaBancaria);

export default router;
