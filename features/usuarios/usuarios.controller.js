import executeQuery from "../../database/executeQuery.js";
import bcrypt, { hash } from 'bcrypt';

// services
import userService from './usuarios.service.js';

const getUsers = async (req, res) => { // get general
    console.log("getUsers");

    // Check if the user is an admin
    const isAdmin = req.user?.is_admin || false;

    // Base query with user data
    let query = `
        SELECT 
            u.id,
            u.username, 
            u.activo,
            r.nombre AS rol,
            dp.nombre AS dp_nombre,
            dp.apellido AS dp_apellido,
            dp.rut AS dp_rut,
            dp.correo AS dp_correo
        FROM usuario u
        LEFT JOIN usuario_rol_plataforma urp ON urp.id_usuario = u.id
        LEFT JOIN rol_plataforma r ON r.id = urp.id_rol_plataforma
        LEFT JOIN datos_personales dp ON dp.id_usuario = u.id
    `;

    // Add WHERE clause to filter out dummy and admin users for non-admin users
    if (!isAdmin) {
        query += `
        WHERE (u.is_dummy IS NULL OR u.is_dummy = FALSE)
        AND (u.is_admin IS NULL OR u.is_admin = FALSE)
        `;
    }

    try {
        const result = await executeQuery(query);
        res.status(200).json({ success: true, usuarios: result });
    } catch (err) {
        console.error("Error obteniendo usuarios:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener usuarios." });
    }
}

// crear colaborador
const postColaborador = async (req, res) => {
    console.log("postColaborador");
    try {
        const resultado = await userService.createColaborador(req.body);

        // responser con exito
        return res.status(200).json({
            success: true,
            message: "Colaborador creado exitosamente.",
            data: resultado
        });
    } catch (err) {
        console.error("Error creando colaborador:", err.message);
        let statusCode = 500;

        if (err.message.includes('ya está registrado') ||
            err.message.includes('son obligatorios')) {
            statusCode = 400;
        }

        return res.status(statusCode).json({
            success: false,
            message: err.message || 'Error al crear colaborador'
        });
    }
};

// editar colaborador
const updateColaborador = async (req, res) => {
    console.log("updateColaborador");

    try {
        // Ejecuta la lógica de actualización con los datos enviados
        const resultado = await userService.editarColaborador(req.body); // Asume que ya importaste esta función

        // responder con éxito
        return res.status(200).json({
            success: true,
            message: "Colaborador actualizado exitosamente.",
            data: resultado
        });
    } catch (err) {
        console.error("Error actualizando colaborador:", err.message);
        let statusCode = 500;

        // errores comunes del mensaje
        if (
            err.message.includes("ya está registrado") ||
            err.message.includes("son obligatorios") ||
            err.message.includes("válido")
        ) {
            statusCode = 400;
        }

        return res.status(statusCode).json({
            success: false,
            message: err.message || "Error al actualizar colaborador"
        });
    }
};

const getCount = async (req, res) => {
    console.log("getColaboradores", req.user);
    // obtener la plataforma de los headers
    try {
        // obtener todos los colaboradores
        const query = `
            SELECT COUNT(*) AS count 
            FROM usuario u
            WHERE u.is_admin = FALSE AND u.is_dummy = FALSE
        `;

        const [result] = await executeQuery(query);

        res.status(200).json({
            success: true,
            message: "Total de colaboradores obtenidos correctamente.",
            result: result.count
        });

    } catch (err) {
        console.error("Error obteniendo colaboradores:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener colaboradores." });
    }
};

// nueva funcion dependiendo de plataforma
const getColaboradores = async (req, res) => {
    console.log("getColaboradores", req.user);
    // obtener la plataforma de los headers
    try {
        // obtener todos los colaboradores
        const query = `
                SELECT 
                    u.id,
                    u.is_admin,
                    u.is_dummy,
                    u.username,
                    u.activo,
                    c.codigo AS c_codigo,
                    c.cargo AS c_cargo,
                    dp.rut AS dp_rut,
                    COALESCE(dp.nombre, '') AS dp_nombre,
                    COALESCE(dp.apellido, '') AS dp_apellido,
                    p.nombre AS proyecto_nombre,
                    p.codigo AS proyecto_codigo,
                    cc.codigo AS cc_codigo,
                    dp.telefono AS dp_telefono,
                    dp.telefono_emergencia AS dp_emergencia,
                    dp.correo AS dp_correo,
                    dp.correo_corporativo AS dp_corporativo,
                    c.id_horario as id_horario
                FROM usuario u
                LEFT JOIN datos_personales dp ON dp.id_usuario = u.id
                LEFT JOIN contrato c ON c.id_usuario = u.id
                LEFT JOIN centro_costo cc ON cc.id = c.id_centro_costo
                LEFT JOIN proyecto p ON p.id = cc.id_proyecto
                WHERE u.is_admin = FALSE AND u.is_dummy = FALSE
            `;

        const colaboradores = await executeQuery(query);

        res.status(200).json({
            success: true,
            result: colaboradores
        });

    } catch (err) {
        console.error("Error obteniendo colaboradores:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener colaboradores." });
    }
};

const getColaboradorPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await executeQuery(`
            SELECT 
                u.id, 
                u.username, 
                u.activo,
                -- Datos personales
                dp.id AS id_datos_personales, 
                dp.nombre AS dp_nombre, 
                dp.apellido AS dp_apellido, 
                dp.rut AS dp_rut, 
                dp.fecha_nacimiento AS dp_fechanac, 
                dp.estado_civil AS dp_estadocivil, 
                dp.sexo AS dp_sexo,
                dp.direccion AS direccion,
                dp.correo AS dp_correo, 
                dp.correo_corporativo AS dp_corporativo, 
                dp.telefono AS dp_telefono, 
                dp.telefono_emergencia AS dp_emergencia,
                dp.id_nacionalidad,
                n.nombre AS nacionalidad_nombre,
                dp.id_comuna,

                -- Región
                r.id AS id_region, 
                r.nombre AS region_nombre,

                -- Información bancaria
                ib.id_banco, 
                ib.cuenta AS cuenta, 
                ib.numero_cuenta AS numero_cuenta,

                -- Contrato
                c.codigo , 
                c.mandante AS c_mandante, 
                c.cargo AS c_cargo, 
                c.calificacion AS c_calificacion, 
                c.titulo AS c_titulo,
                c.sueldo_base, 
                c.valor_plan_isapre, 
                c.ist,
                c.seguro_cesantia, 
                c.anticipo, 
                c.porcentaje_anticipo,
                c.colacion,
                c.fecha_contratacion,
                c.termino_plazo_fijo,
                c.fonasa_tramo AS fonasatramo, 
                c.fonasa, 
                c.id_isapre, 
                c.id_afp, 
                c.id_caja_compensacion,
                c.id_tipo_contrato, 
                c.id_horario, 
                c.id_centro_costo,

                -- Lógica para campo simbólico
                CASE
                    WHEN c.id_isapre IS NOT NULL THEN 'isapre'
                    WHEN c.fonasa_tramo IS NOT NULL THEN 'fonasa'
                    ELSE NULL
                END AS centroSaludSeleccionado

            FROM usuario u
            JOIN datos_personales dp ON u.id = dp.id_usuario
            LEFT JOIN nacionalidad n ON dp.id_nacionalidad = n.id
            LEFT JOIN comuna co ON dp.id_comuna = co.id
            LEFT JOIN region r ON co.id_region = r.id
            LEFT JOIN informacion_bancaria ib ON ib.id_datos_personales = dp.id
            LEFT JOIN contrato c ON u.id = c.id_usuario
            WHERE u.id = ?
        `, [id]);

        if (!result) {
            return res.status(404).json({ message: 'Colaborador no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Colaborador encontrado',
            result
        });
    } catch (error) {
        console.error('Error al obtener colaborador por ID:', error.message);
        res.status(500).json({ success: false, message: 'Error al obtener colaborador' });
    }
};


// Eliminar colaborador y toda su información relacionada (incluye logs)
const deleteColaborador = async (req, res) => {
    console.log("deleteColaborador");
    try {
        const { id } = req.params;
        const usuarioId = Number(id);
        if (!usuarioId || Number.isNaN(usuarioId)) {
            throw new Error("ID de usuario no válido.");
        }

        await executeQuery('START TRANSACTION');

        // Verificar existencia del usuario
        const [usuario] = await executeQuery(
            `SELECT id FROM usuario WHERE id = ?`,
            [usuarioId]
        );

        if (!usuario) {
            throw new Error("El usuario no existe.");
        }

        // Obtener ID de datos personales
        const [datosPersonales] = await executeQuery(
            `SELECT id FROM datos_personales WHERE id_usuario = ?`,
            [usuarioId]
        );
        const datosPersonalesId = datosPersonales?.id;

        // Eliminar notificaciones asociadas a logs
        await executeQuery(
            `DELETE FROM notificaciones_estado WHERE id_log IN (
                SELECT id FROM logs WHERE id_usuario_accion = ? OR id_usuario_afectado = ?
            )`,
            [usuarioId, usuarioId]
        );

        // Eliminar logs donde el usuario haya actuado o haya sido afectado
        await executeQuery(
            `DELETE FROM logs WHERE id_usuario_accion = ? OR id_usuario_afectado = ?`,
            [usuarioId, usuarioId]
        );

        // Eliminar notificaciones pendientes
        await executeQuery(
            `DELETE FROM notificaciones_pendientes WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar feedback
        await executeQuery(
            `DELETE FROM feedback WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar firmas de los registros de este usuario
        await executeQuery(
            `DELETE FROM registro_firma WHERE id_registro IN (
                SELECT id FROM registro WHERE id_usuario = ?
            )`,
            [usuarioId]
        );

        // Eliminar firmas hechas por este usuario (aunque no sean sus propios registros)
        await executeQuery(
            `DELETE FROM registro_firma WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar registros del usuario
        await executeQuery(
            `DELETE FROM registro WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar contrato
        await executeQuery(
            `DELETE FROM contrato WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar información bancaria
        if (datosPersonalesId) {
            await executeQuery(
                `DELETE FROM informacion_bancaria WHERE id_datos_personales = ?`,
                [datosPersonalesId]
            );
        }

        // Eliminar relación con roles en plataforma
        await executeQuery(
            `DELETE FROM usuario_rol_plataforma WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar datos personales
        await executeQuery(
            `DELETE FROM datos_personales WHERE id_usuario = ?`,
            [usuarioId]
        );

        // Eliminar usuario
        await executeQuery(
            `DELETE FROM usuario WHERE id = ?`,
            [usuarioId]
        );

        await executeQuery('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Colaborador eliminado exitosamente',
            id: usuarioId
        });

    } catch (err) {
        await executeQuery('ROLLBACK');
        console.error("Error eliminando colaborador:", err.message);
        res.status(500).json({ error: 'Error eliminando colaborador: ' + err.message });
    }
};



// Obtener supervisores de la plataforma CHECK
const getSupervisores = async (req, res) => {
    console.log("getSupervisores");

    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.activo, 
            'Supervisor' AS rol,
            dp.nombre AS dp_nombre, 
            dp.apellido AS dp_apellido
        FROM usuario u
        JOIN usuario_rol_plataforma urp ON u.id = urp.id_usuario
        JOIN rol_plataforma rp ON urp.id_rol_plataforma = rp.id
        JOIN plataforma p ON rp.id_plataforma = p.id
        LEFT JOIN datos_personales dp ON dp.id_usuario = u.id
        WHERE p.codigo = 'CHECK' 
          AND rp.nombre = 'Supervisor'
          AND p.activo = TRUE
    `;

    try {
        const result = await executeQuery(query);
        console.log("result getSupervisores", result);
        res.status(200).json({ success: true, supervisores: result });
    } catch (err) {
        console.error("Error obteniendo los supervisores:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener los supervisores" });
    }
};

const getAuthData = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
        SELECT 
            u.id, 
            u.username,
            u.is_admin AS is_admin,
            dp.nombre AS dp_nombre, 
            dp.apellido AS dp_apellido
        FROM usuario u
        LEFT JOIN datos_personales dp ON dp.id_usuario = u.id
        WHERE u.id = ?;
        `;
        const [user] = await executeQuery(query, [userId]);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // get roles
        const rolesQuery = `
            SELECT
                p.codigo AS plataforma_codigo,
                rp.nombre AS rp_nombre
            FROM usuario_rol_plataforma urp
            LEFT JOIN rol_plataforma rp ON urp.id_rol_plataforma = rp.id
            LEFT JOIN plataforma p ON rp.id_plataforma = p.id
            WHERE urp.id_usuario = ? AND p.activo = TRUE
        `;

        const rolesPlataforma = await executeQuery(rolesQuery, [userId]);

        // formatear roles
        const formatearRoles = rolesPlataforma.map(r => ({
            plataforma: r.plataforma_codigo,
            rol: r.rp_nombre
        }));

        // verificar si el usuario es supervisor general en algun cliente
        const supervisorGeneralQuery = `
            SELECT
                sg.id_cliente,
                c.nombre AS cliente_nombre,
                af.id AS id_area_firma,
                af.nombre AS area_nombre
            FROM supervisor_general sg
            JOIN cliente c ON sg.id_cliente = c.id
            LEFT JOIN area_firma af ON af.id_cliente = c.id
            WHERE sg.id_usuario = ?;
        `;

        const supervisorGeneralData = await executeQuery(supervisorGeneralQuery, [userId]);

        // Procesar los resultados para estructurar correctamente la información
        // Un supervisor general puede tener acceso a múltiples áreas de un cliente
        const clientesMap = new Map();

        supervisorGeneralData.forEach(row => {
            if (!clientesMap.has(row.id_cliente)) {
                clientesMap.set(row.id_cliente, {
                    id: row.id_cliente,
                    nombre: row.cliente_nombre,
                    areas: []
                });
            }

            // Solo agregar el área si tiene un id válido
            if (row.id_area_firma) {
                const cliente = clientesMap.get(row.id_cliente);
                // Verificar si el área ya está en el array para evitar duplicados
                if (!cliente.areas.some(area => area.id === row.id_area_firma)) {
                    cliente.areas.push({
                        id: row.id_area_firma,
                        nombre: row.area_nombre
                    });
                }
            }
        });

        // Convertir el Map a un array
        const clientes = Array.from(clientesMap.values());

        // crear objeto con la info del supervisor general
        const esSupervisorGeneral = clientes.length > 0;
        const supervisorGeneralInfo = {
            esSupervisorGeneral,
            clientes
        };

        res.status(200).json({
            ...user,
            roles: formatearRoles,
            supervisorGeneral: supervisorGeneralInfo,
        });
    } catch (err) {
        console.error("Error al obtener usuario:", err.message);
        res.status(500).json({ message: "Error en el servidor.", error: err.message });
    }
};

const getPerfil = async (req, res) => {
    console.log("getPerfil");
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const targetId = id || userId;

        const [result] = await executeQuery(`
            SELECT 
              u.id, u.username, u.activo,

              -- Datos personales

              dp.id AS id_datos_personales, 
              dp.nombre AS dp_nombre, 
              dp.apellido AS dp_apellido,  
              dp.rut AS dp_rut, 
              dp.fecha_nacimiento, 
              dp.estado_civil AS dp_estadocivil, 
              dp.sexo AS dp_sexo,
              dp.correo AS dp_correo, 
              dp.correo_corporativo AS dp_corporativo, 
              dp.telefono AS dp_telefono, 
              dp.telefono_emergencia AS dp_emergencia,
              dp.id_nacionalidad, 
              dp.direccion as dp_direccion,
              dp.id_comuna,

              -- Región
              r.id AS id_region, r.nombre AS region_nombre,

              -- Datos bancarios
              ib.id_banco, ib.cuenta, ib.numero_cuenta,

              -- Contrato
              c.codigo AS c_codigo, 
              c.mandante AS c_mandante,  
              c.cargo AS c_cargo, 
              c.calificacion AS c_calificacion, 
              c.titulo AS c_titulo,
              c.sueldo_base, c.valor_plan_isapre, c.ist,
              c.seguro_cesantia, c.anticipo, c.porcentaje_anticipo,
              c.fecha_contratacion, c.termino_plazo_fijo,
              c.fonasa_tramo AS fonasatramo, c.fonasa, c.id_isapre, c.id_afp, c.id_caja_compensacion,
              c.id_tipo_contrato, c.id_horario, c.id_centro_costo,

              -- Campo simbólico
              CASE
                WHEN c.id_isapre IS NOT NULL THEN 'isapre'
                WHEN c.fonasa_tramo IS NOT NULL THEN 'fonasa'
                ELSE NULL
              END AS centroSaludSeleccionado

            FROM usuario u
            JOIN datos_personales dp ON u.id = dp.id_usuario
            LEFT JOIN comuna co ON dp.id_comuna = co.id
            LEFT JOIN region r ON co.id_region = r.id
            LEFT JOIN informacion_bancaria ib ON ib.id_datos_personales = dp.id
            LEFT JOIN contrato c ON u.id = c.id_usuario

            WHERE u.id = ?
        `, [targetId]);

        if (!result) {
            console.log("no se encontró el usuario");
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ success: true, perfil: result });
    } catch (err) {
        console.error("Error obteniendo perfil:", err.message);
        res.status(500).json({ message: "Error del servidor", error: err.message });
    }
};

const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id; // ID del usuario autenticado
        const { password } = req.body;
        console.log("updatePassword: ", password);

        if (!password) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
        }

        // encriptar nueuva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // actualizar la contraseña en la base de datos
        await executeQuery("UPDATE usuario SET password = ? WHERE id = ?", [hashedPassword, userId]);

        res.status(200).json({ success: true, message: "Contraseña actualizada correctamente." });

    } catch (err) {
        console.error("Error actualizando la contraseña:", err.message);
        res.status(500).json({ success: false, message: "Error en el servidor", error: err.message });
    }
};

const updateEstadoColaborador = async (req, res) => {
    const { id } = req.params;
    let { activo } = req.body;
    try {
        // actualizar estado en service
        const resultado = await userService.cambiarEstadoUsuario(id, activo);

        res.status(200).json({
            success: true,
            message: 'Estado actualizado correctamente.'
        });


    } catch (error) {
        console.error(" Error en PUT /usuario/estado/:id:", error.message);
        res.status(500).json({
            success: false,
            message: 'Error del servidor.'
        });
    }
};



const getAllNombreRutContrato = async (req, res) => {
    try {
        const query = `
            SELECT 
                dp.nombre AS dp_nombre,
                dp.rut AS dp_rut,
                tc.nombre AS tipo_contrato,
                CAST(c.sueldo_base AS DECIMAL(15,2)) AS sueldo_base,
                c.cargo AS c_cargo,
                c.codigo AS c_codigo,
                CAST(c.id_afp AS UNSIGNED) AS id_afp
            FROM usuario u
            JOIN datos_personales dp ON u.id = dp.id_usuario
            LEFT JOIN contrato c ON u.id = c.id_usuario
            LEFT JOIN tipo_contrato tc ON tc.id = c.id_tipo_contrato
            WHERE u.is_admin = FALSE AND u.is_dummy = FALSE
        `;

        const result = await executeQuery(query);

        res.status(200).json({
            success: true,
            message: "Datos de todos los usuarios obtenidos correctamente",
            result
        });
    } catch (error) {
        console.error('Error al obtener datos de usuarios:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
    }
};


export {
    getCount,
    getUsers,
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
    getAllNombreRutContrato
}
