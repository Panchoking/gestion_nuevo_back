import executeQuery from '../../database/executeQuery.js';

const getComunas = async (req, res) => {
    try {
        const comunas = await executeQuery(`
            SELECT id, nombre as comuna_nombre, id_region
            FROM comuna;
        `);

        const comunasOrder = comunas.sort((a, b) =>
            a.comuna_nombre.localeCompare(b.comuna_nombre, 'es', { sensitivity: 'base' })
        );

        res.status(200).json({
            success: true,
            message: "Comunas obtenidas correctamente",
            result: comunasOrder
        });
    } catch (err) {
        console.error("Error al obtener comunas:", err.message);
        res.status(500).json({
            error: "Error obteniendo comunas",
            message: err.message
        });
    }
};

const getNacionalidades = async (req, res) => {
    try {
        const nacionalidades = await executeQuery(`
            SELECT id, nombre as nacionalidad_nombre
            FROM nacionalidad;
        `);

        const nacionalidadesOrder = nacionalidades.sort((a, b) =>
            a.nacionalidad_nombre.localeCompare(b.nacionalidad_nombre, 'es', { sensitivity: 'base' })
        );
        
        res.status(200).json({
            success: true,
            message: "Nacionalidades obtenidas correctamente",
            result: nacionalidadesOrder
        });
    } catch (err) {
        console.error("Error al obtener nacionalidades:", err.message);
        res.status(500).json({
            error: "Error obteniendo nacionalidades",
            message: err.message
        });
    }
};

const getRegiones = async (req, res) => {
    try {
        const regiones = await executeQuery(`
            SELECT id, nombre as region_nombre
            FROM region
            ORDER BY id ASC;
        `);

        res.status(200).json({
            success: true,
            message: "Regiones y comunas obtenidas correctamente",
            result: regiones
        });

    } catch (err) {
        console.error("Error al obtener catálogos:", err.message);
        res.status(500).json({
            error: "Error obteniendo catálogos",
            message: err.message
        });
    }
};

const getEntidadesPrevisionales = async (req, res) => {
    try {
        // afp
        const afp = await executeQuery("SELECT id, nombre FROM afp ORDER BY nombre;");

        // isapres
        const isapres = await executeQuery("SELECT id, nombre FROM isapre ORDER BY nombre;");

        // caja de compensacion
        const cajas = await executeQuery("SELECT id, nombre FROM caja_de_compensacion ORDER BY nombre;");

        res.status(200).json({
            success: true,
            message: "Entidades previsionales obtenidas correctamente",
            result: {
                afp,
                isapres,
                cajas
            }
        });
    } catch (err) {
        console.error("Error al obtener entidades previsionales:", err.message);
        res.status(500).json({
            error: "Error obteniendo entidades previsionales",
            message: err.message
        });
    }
};

const getBancos = async (req, res) => {
    try {
        const bancos = await executeQuery("SELECT b.id, b.nombre AS banco_nombre FROM banco b ORDER BY banco_nombre;");
        console.log("BANCOS", bancos);
        res.status(200).json({
            success: true,
            message: "Bancos obtenidos correctamente",
            result: bancos
        });
    } catch (err) {
        console.error("Error al obtener bancos:", err.message);
        res.status(500).json({
            error: "Error obteniendo bancos",
            message: err.message
        });
    }
};

export {
    getComunas,
    getNacionalidades,
    getRegiones,
    getEntidadesPrevisionales,
    getBancos
}