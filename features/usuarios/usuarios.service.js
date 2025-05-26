import bcrypt from 'bcrypt';
import executeQuery from '../../database/executeQuery.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import validator from 'validator';
import { validate, format } from 'rut.js';

const findUserByUsername = async (username) => {
    console.log("finduserbyusername", username);
    try {
        const query = `
            SELECT
                u.*,
                dp.nombre as dp_nombre,
                dp.apellido as dp_apellido
            FROM usuario u
            LEFT JOIN datos_personales dp ON u.id = dp.id_usuario
            WHERE u.username = ?
        ;`;
        const [result] = await executeQuery(query, [username]);
        console.log("result", result);
        return result;
    } catch (err) {
        console.log("no se encontro al usuario", err.message);
        throw new Error("error findusername service");
    }
};

const getUsernameByRut = async (rutPlano) => {
    try {
        // 1. Recuperar todos los usuarios con sus datos personales
        const query = `
            SELECT
                u.username,
                dp.rut as dp_rut
            FROM usuario u
            LEFT JOIN datos_personales dp ON u.id = dp.id_usuario
        `;
        const users = await executeQuery(query);
        // 2. El sistema ya desencripta automáticamente el RUT en executeQuery
        // 3. Buscar el usuario con el RUT proporcionado
        const user = users.find(u => u.dp_rut === rutPlano);
        
        if (user) {
            return user.username;
        }
        
        return null;
    } catch (err) {
        console.log("Error en find username by rut:", err.message);
        throw new Error("Error buscando usuario por RUT");
    }
};

const findUserById = async (id) => {
    try {
        const query = `
            SELECT
                u.*,
                dp.nombre as dp_nombre,
                dp.apellido as dp_apellido
            FROM usuario u
            LEFT JOIN datos_personales dp ON u.id = dp.id_usuario
            WHERE u.id = ?
        `;
        const [result] = await executeQuery(query, [id]);
        return result;
    } catch (err) {
        console.log("no se encontro al usuario", err.message);
        throw new Error("error findusername service");
    }
};

const getUserName = async (id) => {
    try {
        // Traer los campos por separado en lugar de usar CONCAT en SQL
        const [result] = await executeQuery(
            'SELECT nombre, apellido FROM datos_personales WHERE id_usuario = ?', 
            [id]
        );
        
        // La desencriptación ocurrirá automáticamente por executeQuery
        // Concatenar después de la desencriptación
        const nombreCompleto = result ? `${result.nombre || ''} ${result.apellido || ''}`.trim() : '';
        
        return nombreCompleto;
    } catch (err) {
        console.log("Error obteniendo el nombre del usuario: ", err.message);
        throw new Error("Error obteniendo el nombre del usuario.");
    }
};

const createColaborador = async (colaboradorData) => {
    console.log("createColaborador", colaboradorData);
    try {
        // Desestructurar datos
        const {
            // Datos de inicio de sesion
            username, password,
            //datos personales
            nombre, apellido, rut, sexo, estado_civil, fecha_nacimiento,
            direccion, correo, correo_corporativo,
            telefono, telefono_emergencia,
            id_comuna, id_nacionalidad,
            // datos bancarios
            id_banco, cuenta, numero_cuenta,
            //datos contrato
            codigo_contrato, mandante, cargo, calificacion, titulo,
            sueldo_liquido, valor_plan_isapre, ist,
            seguro_cesantia, anticipo, porcentaje_anticipo,
            fecha_contratacion, termino_plazo_fijo, fonasa, fonasatramo,
            id_centro_costo, id_horario, id_tipo_contrato,
            id_isapre, id_afp, id_caja_compensacion,

            //rol plataforma
            id_rol_Plataforma,
        } = colaboradorData;

        // Validaciones mínimas obligatorias
        if (!username || !password || !nombre || !apellido || !rut ||  !correo || !correo_corporativo) {
            throw new Error('Faltan campos obligatorios.');
        }

        await executeQuery('START TRANSACTION');

        // Verificar existencia de username
        const [existingUser] = await executeQuery(
            'SELECT id FROM usuario WHERE username = ?',
            [username]
        );
        if (existingUser) {
            throw new Error('El nombre de usuario ya está en uso');
        }

        // verificar existencia de rut
        const users = await executeQuery( // los ruts llegan desencriptados
            `SELECT rut as dp_rut FROM datos_personales;`
        );
        if (users.find(u => u.dp_rut === rut)) {
            throw new Error('El RUT ya está registrado.');
        }

        // Hashear contraseña segura
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const userResult = await executeQuery(
            `INSERT INTO usuario (username, password, activo, is_admin) 
             VALUES (?, ?, 1, 0);`,
            [username, hashedPassword]
        );

        const userId = userResult.insertId;

        // Insertar datos personales
        await executeQuery(
            `INSERT INTO datos_personales (
                id_usuario, rut, nombre, apellido, sexo,
                telefono, telefono_emergencia, estado_civil, 
                fecha_nacimiento, direccion, correo, correo_corporativo,
                id_comuna, id_nacionalidad
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, rut, nombre, apellido, sexo,
                telefono, telefono_emergencia, estado_civil,
                fecha_nacimiento, direccion, correo, correo_corporativo,
                id_comuna, id_nacionalidad
            ]
        );
        const [datosPersonales] = await executeQuery('SELECT id FROM datos_personales WHERE id_usuario = ?', [userId]);
        const idDatosPersonales = datosPersonales.id;

        // Insertar relación usuario - rol de plataforma
        if (id_rol_Plataforma) {
            await executeQuery(
                `INSERT INTO usuario_rol_plataforma (id_usuario, id_rol_plataforma)
                VALUES (?, ?)`,
                [userId, id_rol_Plataforma]
            );
        }

        // insercion de informacion bancaria
        if (id_banco && cuenta && numero_cuenta) {
            await executeQuery(`
                INSERT INTO informacion_bancaria (
                    id_datos_personales, id_banco, cuenta, numero_cuenta
                ) VALUES (?, ?, ?, ?)`,
                [idDatosPersonales, id_banco, cuenta, numero_cuenta]
            );
        }

        // Insertar contrato
        await executeQuery(
            `INSERT INTO contrato (
                id_usuario, codigo, mandante, cargo, calificacion, titulo,
                sueldo_liquido, valor_plan_isapre, ist, seguro_cesantia,
                anticipo, porcentaje_anticipo, fecha_contratacion, termino_plazo_fijo,fonasa,fonasa_tramo,
                id_centro_costo, id_horario, id_tipo_contrato, id_isapre,
                id_afp, id_caja_compensacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`,

            [
                userId, codigo_contrato, mandante, cargo, calificacion, titulo,
                sueldo_liquido, valor_plan_isapre, ist, seguro_cesantia || 1,
                anticipo || 0, porcentaje_anticipo || 0, fecha_contratacion, termino_plazo_fijo, fonasa, fonasatramo,
                id_centro_costo, id_horario, id_tipo_contrato, id_isapre,
                id_afp, id_caja_compensacion
            ]
        );

        await executeQuery('COMMIT');

        return {
            success: true,
            id: userId,
            username,
            nombre,
            apellido,
            rut,
            message: 'Colaborador creado exitosamente'
        };

    } catch (err) {
        await executeQuery('ROLLBACK');
        console.error("Error creando colaborador:", err);

        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('username')) {
                await executeQuery('ROLLBACK');
                throw new Error('El nombre de usuario ya está registrado');
            }
            if (err.message.includes('rut')) {
                await executeQuery('ROLLBACK');
                throw new Error('El RUT ya está registrado');
            }
        }

        throw new Error('Error creando colaborador: ' + err.message);
    }
};

const cambiarEstadoUsuario = async (idUsuario, activo) => {
    try {
        // 🟡 Log de entrada
        console.log(" Solicitud de cambio de estado:");
        console.log("ID de usuario:", idUsuario);
        console.log("Nuevo estado (activo):", activo);

        // Validar entrada
        if (typeof activo !== 'boolean' || !idUsuario) {
            console.warn(" Parámetros inválidos:", { idUsuario, activo });
            throw new Error("Parámetros inválidos.");
        }

        // Ejecutar actualización
        const result = await executeQuery(`
            UPDATE usuario
            SET activo = ?
            WHERE id = ?
        `, [activo ? 1 : 0, idUsuario]);

        console.log(" Resultado de la query:", result);

        // Confirmar si se modificó algo
        if (result.affectedRows === 0) {
            console.warn(" No se encontró el usuario o no hubo cambios (id:", idUsuario, ")");
            throw new Error("Usuario no encontrado o sin cambios.");
        }

        //  Éxito
        const mensaje = `Usuario ${activo ? 'activado' : 'desactivado'} correctamente.`;
        console.log("", mensaje);

        return {
            success: true,
            message: mensaje
        };

    } catch (err) {
        console.error(" Error cambiando estado del usuario:", err.message);
        return {
            success: false,
            error: err.message
        };
    }
};


const editarColaborador = async (colaboradorData) => {
    console.log("Datos recibidos para editar:", colaboradorData);

    try {
        const id_usuario = colaboradorData.id_usuario || colaboradorData.id;

        const {
            // Datos personales
            nombre, apellido, rut, sexo, estado_civil, fecha_nacimiento,
            direccion, correo, correo_corporativo,
            telefono, telefono_emergencia,
            id_comuna, id_nacionalidad,

            // Información bancaria
            id_banco, cuenta, numero_cuenta,

            // Contrato
            codigo_contrato, mandante, cargo, calificacion, titulo,
            sueldo_liquido, valor_plan_isapre, ist,
            seguro_cesantia, anticipo, porcentaje_anticipo,
            fecha_contratacion, termino_plazo_fijo, fonasa, fonasatramo,
            id_centro_costo, id_horario, id_tipo_contrato,
            id_isapre, id_afp, id_caja_compensacion,

            // Rol plataforma
            id_rol_Plataforma,
        } = colaboradorData;

        // Validaciones mínimas obligatorias
        if (
            !id_usuario || !nombre || !apellido || !rut ||
            !id_comuna || !id_nacionalidad || !telefono || !telefono_emergencia ||
            !correo || !correo_corporativo || !fecha_contratacion
        ) {
            throw new Error('Faltan campos obligatorios.');
        }
        // Mantener el formato para almacenamiento
        const rutFormateado = rut.trim().toUpperCase(); // ej: 87.654.321-9

        // Limpieza para validación: quita puntos y guión
        const rutLimpio = rutFormateado.replace(/[.\-]/g, ''); // ej: 876543219

        const cuerpo = rutLimpio.slice(0, -1);
        const dv = rutLimpio.slice(-1).toUpperCase();

        console.log("Recibido:", rut);
        console.log("Formateado para guardar:", rutFormateado);
        console.log("Para validar:", rutLimpio);
        console.log("Cuerpo:", cuerpo);
        console.log("DV:", dv);

        // Validaciones
        if (!/^\d{7,8}$/.test(cuerpo) || !/^[\dK]$/.test(dv)) {
            throw new Error('El RUT ingresado no tiene el formato correcto.');
        }

        if (!validate(cuerpo + dv)) {
            throw new Error('El RUT ingresado no es válido (dígito verificador incorrecto).');
        }



        if (!isValidPhoneNumber(telefono, 'CL') || !isValidPhoneNumber(telefono_emergencia, 'CL')) {
            throw new Error('Teléfono inválido.');
        }

        if (!validator.isEmail(correo) || !validator.isEmail(correo_corporativo)) {
            throw new Error('Correo electrónico inválido.');
        }

        await executeQuery('START TRANSACTION');

        // Actualizar datos personales
        await executeQuery(`
            UPDATE datos_personales SET 
                rut = ?, nombre = ?, apellido = ?, sexo = ?, 
                telefono = ?, telefono_emergencia = ?, estado_civil = ?, 
                fecha_nacimiento = ?, direccion = ?, correo = ?, correo_corporativo = ?, 
                id_comuna = ?, id_nacionalidad = ?
            WHERE id_usuario = ?
        `, [
            rutFormateado, nombre, apellido, sexo,
            telefono, telefono_emergencia, estado_civil,
            fecha_nacimiento, direccion, correo, correo_corporativo,
            id_comuna, id_nacionalidad, id_usuario
        ]);

        // ID datos personales
        const [datosPersonales] = await executeQuery(
            `SELECT id FROM datos_personales WHERE id_usuario = ?`,
            [id_usuario]
        );
        const idDatosPersonales = datosPersonales.id;

        // Rol plataforma
        await executeQuery(`DELETE FROM usuario_rol_plataforma WHERE id_usuario = ?`, [id_usuario]);
        if (id_rol_Plataforma) {
            await executeQuery(
                `INSERT INTO usuario_rol_plataforma (id_usuario, id_rol_plataforma)
                 VALUES (?, ?)`,
                [id_usuario, id_rol_Plataforma]
            );
        }

        // Información bancaria (opcional)
        const [infoBancaria] = await executeQuery(
            `SELECT id FROM informacion_bancaria WHERE id_datos_personales = ?`,
            [idDatosPersonales]
        );

        if (id_banco && cuenta && numero_cuenta) {
            if (infoBancaria) {
                await executeQuery(`
                    UPDATE informacion_bancaria SET 
                        id_banco = ?, cuenta = ?, numero_cuenta = ?
                    WHERE id_datos_personales = ?
                `, [id_banco, cuenta, numero_cuenta, idDatosPersonales]);
            } else {
                await executeQuery(`
                    INSERT INTO informacion_bancaria (id_datos_personales, id_banco, cuenta, numero_cuenta)
                    VALUES (?, ?, ?, ?)`,
                    [idDatosPersonales, id_banco, cuenta, numero_cuenta]
                );
            }
        } else if (infoBancaria) {
            await executeQuery(`DELETE FROM informacion_bancaria WHERE id = ?`, [infoBancaria.id]);
        }

        // Contrato
        const terminoFinal = termino_plazo_fijo?.trim() === '' ? null : termino_plazo_fijo;

        // Normalizar valores vacíos en campos opcionales
        const idIsapreFinal = id_isapre === '' ? null : id_isapre;
        const idAfpFinal = id_afp === '' ? null : id_afp;
        const idCajaFinal = id_caja_compensacion === '' ? null : id_caja_compensacion;
        const idTipoContratoFinal = id_tipo_contrato === '' ? null : id_tipo_contrato;
        const idHorarioFinal = id_horario === '' ? null : id_horario;
        const idCentroCostoFinal = id_centro_costo === '' ? null : id_centro_costo;

        await executeQuery(`
            UPDATE contrato SET
                codigo = ?, mandante = ?, cargo = ?, calificacion = ?, titulo = ?,
                sueldo_liquido = ?, valor_plan_isapre = ?, ist = ?, seguro_cesantia = ?,
                anticipo = ?, porcentaje_anticipo = ?, fecha_contratacion = ?, termino_plazo_fijo = ?, fonasa = ?, fonasa_tramo = ?,
                id_centro_costo = ?, id_horario = ?, id_tipo_contrato = ?, id_isapre = ?, id_afp = ?, id_caja_compensacion = ?
            WHERE id_usuario = ?
        `, [
            codigo_contrato, mandante, cargo, calificacion, titulo,
            sueldo_liquido, valor_plan_isapre, ist, seguro_cesantia || 1,
            anticipo || 0, porcentaje_anticipo || 0, fecha_contratacion, terminoFinal,
            fonasa, fonasatramo,
            idCentroCostoFinal, idHorarioFinal, idTipoContratoFinal,
            idIsapreFinal, idAfpFinal, idCajaFinal,
            id_usuario
        ]);
        

        await executeQuery('COMMIT');

        return {
            success: true,
            id: id_usuario,
            nombre,
            apellido,
            rut: rutFormateado,
            message: 'Colaborador actualizado exitosamente'
        };

    } catch (err) {
        await executeQuery('ROLLBACK');
        console.error("Error actualizando colaborador:", err.message);
        throw new Error('Error actualizando colaborador: ' + err.message);
    }
};

export default {
    findUserByUsername,
    findUserById,
    getUserName,
    getUsernameByRut,
    createColaborador,
    cambiarEstadoUsuario,
    editarColaborador
};