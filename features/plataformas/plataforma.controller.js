// database queries
import executeQuery from "../../database/executeQuery.js";

const getPlataformas = async (req, res) => {
    console.log("getPlataformas");
    try {
        const plataformas = await executeQuery(`
            SELECT 
                p.id,
                p.activo,
                p.codigo AS plataforma_codigo,
                p.nombre AS plataforma_nombre,
                p.url AS plataforma_url
            FROM plataforma p;
        `);
        res.status(200).json({ success: true, plataformas });
    } catch (err) {
        console.error("Error obteniendo plataformas:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo plataformas" });
    }
};

const getPlataforma = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await executeQuery(`
            SELECT 
                p.id,
                p.activo,
                p.codigo AS plataforma_codigo,
                p.nombre AS plataforma_nombre,
                p.url AS plataforma_url
            FROM plataforma p
            WHERE p.id = ?;    
        `, [id]);
        if (!result) {
            return res.status(404).json({ success: false, message: "Plataforma no encontrada" });
        }
        res.status(200).json({ success: true, plataforma: result });
    } catch (err) {
        console.error("Error obteniendo plataforma:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo plataforma" });
    }
};

const createPlataforma = async (req, res) => {
    const { codigo, nombre, url } = req.body;
    try {
        await executeQuery("INSERT INTO plataforma (codigo, nombre, url) VALUES (?, ?, ?)", [codigo, nombre, url]);
        res.status(201).json({ success: true, message: "Plataforma creada" });
    } catch (err) {
        console.error("Error creando plataforma:", err.message);
        res.status(500).json({ success: false, message: "Error creando plataforma" });
    }
};


const updatePlataforma = async (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, url } = req.body;
    try {
        await executeQuery("UPDATE plataforma SET codigo = ?, nombre = ?, url = ? WHERE id = ?", [codigo, nombre, url, id]);
        res.status(200).json({ success: true, message: "Plataforma actualizada" });
    } catch (err) {
        console.error("Error actualizando plataforma:", err.message);
        res.status(500).json({ success: false, message: "Error actualizando plataforma" });
    }
};


const deletePlataforma = async (req, res) => {
    const { id } = req.params;
    try {
        await executeQuery("DELETE FROM plataforma WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Plataforma eliminada" });
    } catch (err) {
        console.error("Error eliminando plataforma:", err.message);
        res.status(500).json({ success: false, message: "Error eliminando plataforma" });
    }
};

export {
    getPlataforma,
    getPlataformas,
    createPlataforma,
    updatePlataforma,
    deletePlataforma,
}