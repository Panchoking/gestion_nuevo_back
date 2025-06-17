import express from 'express';
import executeQuery from "../../database/executeQuery.js";

import {
    getAuthData,
    postColaborador,
    getColaboradores,
    getColaboradorPorId,
    updateColaborador,
    updateEstadoColaborador,
    deleteColaborador,
    getSupervisores,
    getPerfil,
    updatePassword,
    getUsers,
    getCount,
    getAllNombreRutContrato,
    crearPrestamoContrato,
    eliminarPrestamo   
} from './usuarios.controller.js';

// middlewares
import verificarAcceso from '../../middlewares/verificarAcceso.js';
import { authenticateToken } from '../../middlewares/authenticateToken.js';

const router = express.Router();

router.get('/auth-data', authenticateToken, getAuthData); // datos de inicio de sesion

router.get('/', authenticateToken, verificarAcceso([ // getUsers (general)
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getUsers);

router.get('/count', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getCount);

// supervisores 
router.get('/supervisores', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getSupervisores);

// colaboradores
router.get('/colaboradores', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getColaboradores);

router.get('/colaboradores/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), getColaboradorPorId);

// crud colaborador
router.post('/colaborador', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), postColaborador);

router.put('/colaborador/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), updateColaborador);

router.delete('/colaborador/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] },
]), deleteColaborador);

// actualizar estado de colaborador
router.put('/colaborador/cambiar-estado/:id', authenticateToken, verificarAcceso([
    { plataforma: 'GESTION', roles: ['RRHH'] }
]), updateEstadoColaborador);

router.get('/perfil', authenticateToken, getPerfil);
router.put('/cambiar-password', authenticateToken, updatePassword);

router.get('/nombres-rut-contrato', authenticateToken, getAllNombreRutContrato);

//prestamos
// En las rutas
router.post('/prestamos', crearPrestamoContrato);
router.delete('/prestamos/:id', eliminarPrestamo);

export default router;
