import executeQuery from "../../database/executeQuery.js";

const getCentros = async (req, res) => {
    console.log("getCentros");
    try {
        const centros = await executeQuery(`
            SELECT 
                cc.id,
                cc.codigo AS cc_codigo,
                p.nombre AS proyecto_nombre
            FROM centro_costo cc
            LEFT JOIN proyecto p ON cc.id_proyecto = p.id;
        `);
        res.status(200).json({ success: true, centros });
    } catch (err) {
        console.error("Error obteniendo centros:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo centros" });
    }
};

const getCentro = async (req, res) => {
    res.status(200).json({ success: true, message: "getCentro" });
};

const createCentro = async (req, res) => {
    res.status(200).json({ success: true, message: "getCentro" });
};
const updateCentro = async (req, res) => {
    res.status(200).json({ success: true, message: "getCentro" });
};
const deleteCentro = async (req, res) => {
    res.status(200).json({ success: true, message: "getCentro" });
};

export {
    getCentros,
    getCentro,
    createCentro,
    updateCentro,
    deleteCentro,
};