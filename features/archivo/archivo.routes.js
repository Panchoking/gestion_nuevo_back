import express from 'express';
import multer from 'multer';
import { cargarArchivo } from './archivo.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/cargar', upload.single('archivo'), cargarArchivo);

export default router;
//