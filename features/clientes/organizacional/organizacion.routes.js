import express from 'express';
import {
  crearCliente,
  crearProyecto,
  getCatalogoClientes,
  crearCentroCosto,
  getCatalogoAreas,
  getCatalogoProyectos,
  getCentrosCosto
} from './organizacion.controller.js';

const router = express.Router();

// TODO: arreglar rutas
router.post('/cliente', crearCliente);
router.post('/proyecto', crearProyecto);
router.post('/centro-costo', crearCentroCosto); 

router.get('/catalogos/clientes', getCatalogoClientes);
router.get('/catalogos/areas', getCatalogoAreas);
router.get('/catalogos/proyectos', getCatalogoProyectos);
router.get('/centros-costo', getCentrosCosto);


export default router;
