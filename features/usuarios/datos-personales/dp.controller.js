// controllers/datospersonalesController.js
import executeQuery from '../../../database/executeQuery.js';

// Obtener todos los datos personales con nombres relacionados
const getDatosPersonales = async (req, res) => {
    try {
        const query = `
            SELECT 
                dp.id,
                dp.id_usuario,
                dp.rut as dp_rut,
                dp.nombre as dp_nombre,
                dp.apellido as dp_apellido,
                dp.sexo as dp_sexo,
                dp.telefono as dp_telefono,
                dp.telefono_emergencia as dp_emergencia,
                dp.estado_civil as dp_estadocivil,
                dp.fecha_nacimiento as dp_fechanac,
                dp.direccion as dp_direccion,
                dp.correo as dp_correo,
                dp.correo_corporativo as dp_corporativo,
                dp.id_comuna,
                dp.id_nacionalidad,
                c.nombre AS comuna_nombre,
                n.nombre AS nacionalidad_nombre
            FROM datos_personales dp
            JOIN comuna c ON dp.id_comuna = c.id
            JOIN nacionalidad n ON dp.nacionalidad_id = n.id
        `;
        const result = await executeQuery(query);

        res.status(200).json({
            status: "success",
            message: "Datos personales obtenidos correctamente",
            result
        });
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo datos personales", error });
    }
};

// Obtener datos personales por usuario con nombres relacionados
const getDatosPersonalesByUserId = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const query = `
            SELECT  
                dp.id,
                dp.id_usuario,
                dp.rut as dp_rut,
                dp.nombre as dp_nombre,
                dp.apellido as dp_apellido,
                dp.sexo as dp_sexo,
                dp.telefono as dp_telefono,
                dp.telefono_emergencia as dp_emergencia,
                dp.estado_civil as dp_estadocivil,
                dp.fecha_nacimiento as dp_fechanac,
                dp.direccion as dp_direccion,
                dp.correo as dp_correo,
                dp.correo_corporativo as dp_corporativo,
                dp.id_comuna,
                dp.id_nacionalidad,
                c.nombre AS comuna_nombre,
                n.nombre AS nacionalidad_nombre
            FROM datos_personales dp
            JOIN comuna c ON dp.id_comuna = c.id
            JOIN nacionalidad n ON dp.nacionalidad_id = n.id
            WHERE dp.id_usuario = ?
        `;
        const [result] = await executeQuery(query, [id_usuario]);

        res.status(200).json({
            status: "success",
            message: "Datos personales obtenidos correctamente",
            result: result || { message: "No encontrado" }
        });
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo datos del usuario", error });
    }
};


// Crear datos personales
const createDatosPersonales = async (req, res) => {
    const { id_usuario, rut, nombre, apellido, sexo, movil, calle, telefono_emergencia, estado_civil, fecha_nacimiento, id_comuna, nacionalidad_id } = req.body;
    try {
        await executeQuery(`
            INSERT INTO datos_personales (
                id_usuario, 
                rut, 
                nombre, 
                apellido, 
                sexo, 
                movil, 
                calle, 
                telefono_emergencia, 
                estado_civil, 
                fecha_nacimiento, 
                id_comuna, 
                nacionalidad_id
            )     
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            , [id_usuario, rut, nombre, apellido, sexo, movil, calle, telefono_emergencia, estado_civil, fecha_nacimiento, id_comuna, nacionalidad_id]);

        res.status(201).json({
            status: "success",
            message: "Datos personales agregados correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al agregar datos personales", error });
    }
};

// Actualizar datos personales
const updateDatosPersonales = async (req, res) => {
    const { id_usuario } = req.params;
    const { rut, nombre, apellido, sexo, movil, calle, telefono_emergencia, estado_civil, fecha_nacimiento, id_comuna, nacionalidad_id } = req.body;
    try {
        await executeQuery(`
            UPDATE datos_personales 
            SET rut = ?, 
                nombre = ?, 
                apellido = ?, 
                sexo = ?, 
                movil = ?, 
                calle = ?, 
                telefono_emergencia = ?, 
                estado_civil = ?, 
                fecha_nacimiento = ?, 
                id_comuna = ?, 
                nacionalidad_id = ?
            WHERE id_usuario = ?`, [rut, nombre, apellido, sexo, movil, calle, telefono_emergencia, estado_civil, fecha_nacimiento, id_comuna, nacionalidad_id, id_usuario]);
        res.status(200).json({
            status: "success",
            message: "Datos personales actualizados correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar datos personales", error });
    }
};

// Eliminar datos personales
const deleteDatosPersonales = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const query = "DELETE FROM datos_personales WHERE id_usuario = ?";
        await executeQuery(query, [id_usuario]);
        res.status(200).json({
            status: "success",
            message: "Datos personales eliminados correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar datos personales", error });
    }
};

export { 
    getDatosPersonales, 
    getDatosPersonalesByUserId, 
    createDatosPersonales, 
    updateDatosPersonales, 
    deleteDatosPersonales 
};
