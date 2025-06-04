import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

// importar rutas
import authRoutes from './features/auth/auth.routes.js';
import bancoRoutes from './features/banco/banco.routes.js';
import centroCostosRoutes from './features/centro-costos/centro.routes.js';

// feriados y horarios routes
import horarioRoutes from './features/horarios/horarios.routes.js';
import feriadoRoutes from './features/feriados/feriados.routes.js';

// catalogo routes
import catalogoRoutes from './features/catalogos/catalogos.routes.js';

// plataformas routes
import plataformaRoutes from './features/plataformas/plataforma.routes.js';
import rolRoutes from './features/plataformas/roles/roles.routes.js';

// usuarios routes
import dpRoutes from './features/usuarios/datos-personales/dp.routes.js';
import userRoutes from './features/usuarios/usuarios.routes.js';
import contratoRoutes from './features/usuarios/contratos/contrato.routes.js';
import asignacionRoutes from './features/usuarios/roles/usuarioRol.routes.js';

// clientes routes
import clientesRoutes from './features/clientes/cliente.routes.js';
import organizacionalRoutes from './features/clientes/organizacional/organizacion.routes.js';

// indices comerciales
import indicesRoutes from './features/indices-comerciales/indices.routes.js';


// init
const app = express();

// middlewares init
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors
const allowedOrigins = [ // TODO: no deberia ser necesario darle permisos a CHECK
    'http://localhost:5173', // desarrollo frontend
    'http://localhost:5175', // desarrollo frontend 2
    'http://192.168.5.228:5173', // desarrollo front end network
    'https://check.altimec.cl', // VPS
    'https://gestion.altimec.cl', // VPS'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-plataforma'],
    optionsSuccessStatus: 200,
}));


// rutas
app.use('/api/auth', authRoutes);
app.use('/api/banco', bancoRoutes);
app.use('/api/centro-costos', centroCostosRoutes);
app.use('/api/horario', horarioRoutes);
app.use('/api/feriado', feriadoRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/plataforma', plataformaRoutes);
app.use('/api/rol', rolRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/datos-personales', dpRoutes);
app.use('/api/contrato', contratoRoutes);
app.use('/api/asignacion', asignacionRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/organizacion', organizacionalRoutes);
app.use('/api/indices', indicesRoutes);

export default app;