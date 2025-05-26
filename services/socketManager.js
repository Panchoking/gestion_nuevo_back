import executeQuery from "../database/executeQuery.js";

// estado compartido (privado mediante closure)
let io = null;
const usuariosConectados = {}; // userId -> Set([socketId1, socketId2...])
const socketToUser = {};       // socketId -> userId
const usuariosViendoRegistros = {}; // colaboradorId -> [{ userId, username, role, socketId }]

// inicializar socket
const initialize = (ioInstance) => {
    if (!io) {
        io = ioInstance;
        console.log('socketManager: inicializado con la instancia de socket.io');
    }
    return socketManager;
};

const handleConnection = (socket) => {
    console.log(`usuario conectado: ${socket.id}`);

    // registro de usuario
    socket.on("registrarUsuario", (userId) => registrarUsuario(socket, userId));

    // desconexión
    socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
};

// registra a un usuario en el sistema de webSockets
const registrarUsuario = (socket, userId) => {
    if (!userId || typeof userId !== "number") return;

    socket.join(`usuario-${userId}`);
    socketToUser[socket.id] = userId;

    if (!usuariosConectados[userId]) {
        usuariosConectados[userId] = new Set();
    }
    usuariosConectados[userId].add(socket.id);

    console.log(`usuario ${userId} registrado con socket ${socket.id}`);

    // entrega de notificaciones pendiente al conectarse
    entregarNotificacionesPendientes(socket, userId);
};

// envia una notificacion a un usuario especifico
const enviarNotificacion = async (userId, mensaje, datos = {}) => {
    if (!isUsuarioConectado(userId)) {
        console.log(`usuario ${userId} no esta conectado, guardando notificacion pendiente`);
        await guardarNotificacionPendiente(userId, mensaje, datos);
        return false;
    }

    console.log(`enviando notificacion a usuario ${userId}: ${mensaje}`);
    io.to(`usuario-${userId}`).emit("nuevaNotificacion", {
        mensaje,
        datos,
        timestamp: new Date().toISOString()
    });

    // activar indicador de notificacion pendiente
    io.to(`usuario-${userId}`).emit("notificacionPendiente");
    return true;
};

// enviar notificaciones a supervisores y administradores
const enviarNotificacionSupervisoresAdmin = async (mensaje, datos = {}) => {
    try {
        // obtener supervisores y admins del nuevo sistema de roles
        const usuarios = await executeQuery(`
            select distinct u.id 
            from usuario u
            left join usuario_rol_plataforma urp on u.id = urp.id_usuario
            left join rol_plataforma rp on urp.id_rol_plataforma = rp.id
            left join plataforma p on rp.id_plataforma = p.id
            where u.is_admin = 1 or (p.codigo = 'CHECK' and rp.nombre = 'Supervisor')
        `);

        console.log(`enviando notificacion a ${usuarios.length} supervisores/admins: ${mensaje}`);

        for (const usuario of usuarios) {
            await enviarNotificacion(usuario.id, mensaje, datos);
        }
    } catch (err) {
        console.error("error enviando notificaciones a supervisores/admin:", err);
    }
};


// guarda una notificacion para entrega posterior
const guardarNotificacionPendiente = async (userId, mensaje, datos = {}) => {
    try {
        await executeQuery(
            "insert into notificaciones_pendientes (id_usuario, mensaje, datos, fecha) values (?, ?, ?, now())",
            [userId, mensaje, JSON.stringify(datos)]
        );
        console.log(`notificacion guardada para entrega posterior a usuario ${userId}`);
    } catch (err) {
        console.error("error guardando notificacion pendiente:", err);
    }
};

// entrega notificacion pendiente cuando el usuario se conecta
const entregarNotificacionesPendientes = async (socket, userId) => {
    try {
        console.log("verificar notificaiones pendientes");
        // verificar si existen notificaciones pendientes
        const pendientes = await executeQuery(
            "select id, mensaje, fecha from notificaciones_pendientes where id_usuario = ? order by fecha limit 50",
            [userId]
        );
        console.log("pendientes:", pendientes);

        if (!pendientes.length) return console.log("no tienes notificaciones pendientes");
        console.log(`entregando ${pendientes.length} notificaciones pendientes a usuario ${userId}`);

        // enviar cada notificacion pendiente
        for (const notif of pendientes) {
            socket.emit("nuevaNotificacion", {
                mensaje: notif.mensaje,
                //datos: JSON.parse(notif.datos || "{}"), NO ESTA EN USO
                timestamp: notif.fecha,
                pendiente: true
            });

            // eliminar notificacion pendiente despues de entregar
            await executeQuery("delete from notificaciones_pendientes where id = ?", [notif.id]);
        }

        // activar indicador de notificaciones
        socket.emit("notificacionPendiente");
    } catch (err) {
        console.error(`error entregando notificaciones pendientes para usuario ${userId}:`, err);
    }
};

const notificarAccionAdministrativa = (colaboradorId, fecha, accion, adminNombre) => {
    let mensaje;
    const fechaFormateada = moment(fecha).format('DD-MM-YYYY');

    switch (accion) {
        case 'cambiarEstado':
            mensaje = `${adminNombre} ha cambiado el estado de tu registro del ${fechaFormateada}.`;
            break;
        case 'firmarDirecto':
            mensaje = `${adminNombre} ha aprobado directamente tu registro del ${fechaFormateada}.`;
            break;
        case 'deshacerFirmas':
            mensaje = `${adminNombre} ha eliminado las firmas de tu registro del ${fechaFormateada}.`;
            break;
        default:
            mensaje = `${adminNombre} ha realizado una acción administrativa en tu registro del ${fechaFormateada}.`;
    }

    // Emitir notificación al usuario
    emitToUser(colaboradorId, 'nuevaNotificacion', {
        tipo: 'registro_admin',
        mensaje,
        fecha: new Date(),
        leido: false
    });

    // Emitir evento para actualizar la interfaz
    emitToUser(colaboradorId, 'actualizar_registro', {
        colaboradorId,
        fecha
    });
};

// maneja la desconexión de un socket
const handleDisconnect = (socket, reason) => {
    console.log(`usuario desconectado: ${socket.id} - motivo: ${reason}`);

    // limpiar referencia de usuario
    const userId = socketToUser[socket.id];
    if (userId) {
        // eliminar socket del conjunto de sockets del usuario
        if (usuariosConectados[userId]) {
            usuariosConectados[userId].delete(socket.id);

            if (usuariosConectados[userId].size === 0) {
                delete usuariosConectados[userId];
            }
        }
        delete socketToUser[socket.id];
    }

    // limpiar referencias en usuarioViendoRegistros
    Object.keys(usuariosViendoRegistros).forEach(colaboradorId => {
        usuariosViendoRegistros[colaboradorId] = usuariosViendoRegistros[colaboradorId]
            .filter(u => u.socketId !== socket.id);

        if (usuariosViendoRegistros[colaboradorId].length === 0) {
            delete usuariosViendoRegistros[colaboradorId];
        } else {
            io.to(`colaborador-${colaboradorId}`).emit(
                `usuariosViendoRegistro-${colaboradorId}`,
                usuariosViendoRegistros[colaboradorId]
            );
        }
    });
};

// verificar si un usuario está conectado
const isUsuarioConectado = (userId) => {
    return usuariosConectados[userId] && usuariosConectados[userId].size > 0;
};

// obtener usuarios viendo un registro
const getUsuariosViendoRegistro = (colaboradorId) => {
    return usuariosViendoRegistros[colaboradorId] || [];
};

// obtiene la instancia actual de socket.io
const getIO = () => {
    if (!io) throw new Error("socket.io no ha sido inicializado en socketManager");
    return io;
};

// exportar servicio como object
const socketManager = {
    initialize,
    handleConnection,
    registrarUsuario,
    notificarAccionAdministrativa,
    enviarNotificacion,
    enviarNotificacionSupervisoresAdmin,
    isUsuarioConectado,
    getUsuariosViendoRegistro,
    getIO
};

export default socketManager;
