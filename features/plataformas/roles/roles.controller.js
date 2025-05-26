import executeQuery from "../../../database/executeQuery.js";

const getRoles = async (req, res) => {
    console.log("getRoles");
    try {
        const roles = await executeQuery(`
            SELECT
                rp.id,
                rp.id_plataforma,
                rp.nombre AS rp_nombre,
                rp.descripcion AS rp_descripcion
            FROM rol_plataforma rp    
        `);
        res.status(200).json({ success: true, roles });
    } catch (err) {
        console.error("Error obteniendo roles:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo roles" });
    }
};

const getRol = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await executeQuery(`
            SELECT 
                rp.id,
                rp.id_plataforma,
                rp.nombre AS rp_nombre,
                rp.descripcion AS rp_descripcion
            FROM rol_plataforma WHERE id = ?;
        `, [id]);
        if (!result) {
            return res.status(404).json({ success: false, message: "Rol no encontrado" });
        }
        res.status(200).json({ success: true, rol: result });
    } catch (err) {
        console.error("Error obteniendo rol:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo rol" });
    }
}
const createRol = async (req, res) => {
    const { id_plataforma, nombre, descripcion } = req.body;
    console.log("id_plataforma, nombre, descripcion");
    try {
        await executeQuery("INSERT INTO rol_plataforma (id_plataforma, nombre, descripcion) VALUES (?, ?, ?)", [id_plataforma, nombre, descripcion]);
        res.status(201).json({ success: true, message: "Rol creado" });
    } catch (err) {
        console.error("Error creando rol:", err.message);
        res.status(500).json({ success: false, message: "Error creando rol" });
    }
};

const updateRol = async (req, res) => {
    const { id } = req.params;
    const { id_plataforma, nombre, descripcion } = req.body;
    try {
        await executeQuery("UPDATE rol_plataforma SET id_plataforma = ?, nombre = ?, descripcion = ? WHERE id = ?", [id_plataforma, nombre, descripcion, id]);
        res.status(200).json({ success: true, message: "Rol actualizado" });
    } catch (err) {
        console.error("Error actualizando rol:", err.message);
        res.status(500).json({ success: false, message: "Error actualizando rol" });
    }
};
const deleteRol = async (req, res) => {
    const { id } = req.params;
    try {
        await executeQuery("DELETE FROM rol_plataforma WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Rol eliminado" });
    } catch (err) {
        console.error("Error eliminando rol:", err.message);
        res.status(500).json({ success: false, message: "Error eliminando rol" });
    }
};

export {
    getRoles,
    getRol,
    createRol,
    updateRol,
    deleteRol
};