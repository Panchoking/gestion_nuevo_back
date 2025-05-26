import executeQuery from "../../../database/executeQuery.js";

const getAsignaciones = async (req, res) => {
    console.log("getAsignaciones");
    try {
        const asignaciones = await executeQuery("SELECT * FROM usuario_rol_plataforma;");
        res.status(200).json({ success: true, asignaciones });
    } catch (err) {
        console.error("Error obteniendo asignaciones:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo asignaciones" });
    }
};

const getAsignacion = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await executeQuery("SELECT * FROM usuario_rol_plataforma WHERE id = ?;", [id]);
        if (!result) {
            return res.status(404).json({ success: false, message: "Asignación no encontrada" });
        }
        res.status(200).json({ success: true, asignacion: result });
    } catch (err) {
        console.error("Error obteniendo asignación:", err.message);
        res.status(500).json({ success: false, message: "Error obteniendo asignación" });
    }
}
const createAsignacion = async (req, res) => {
    try {
        const { id_usuario, id_rol_plataforma } = req.body;
        
        if (!id_usuario || !id_rol_plataforma) {
            return res.status(400).json({ success: false, message: "Faltan datos requeridos." });
        }

        const existeAsignacion = await executeQuery(
            "SELECT id FROM usuario_rol_plataforma WHERE id_usuario = ? AND id_rol_plataforma = ?",
            [id_usuario, id_rol_plataforma]
        );

        if (existeAsignacion && existeAsignacion.length > 0) {
            return res.status(409).json({ success: false, message: "El usuario ya tiene este rol." });
        }

        await executeQuery("INSERT INTO usuario_rol_plataforma (id_usuario, id_rol_plataforma) VALUES (?, ?)", [id_usuario, id_rol_plataforma]);
        res.status(201).json({ success: true, message: "Asignación creada" });
    } catch (err) {
        console.error("Error creando asignación:", err.message);
        res.status(500).json({ success: false, message: "Error creando asignación" });
    }
}

const deleteAsignacion = async (req, res) => {
    const { id } = req.params;
    try {
        await executeQuery("DELETE FROM usuario_rol_plataforma WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Asignación eliminada" });
    } catch (err) {
        console.error("Error eliminando asignación:", err.message);
        res.status(500).json({ success: false, message: "Error eliminando asignación" });
    }
}

export {
    getAsignaciones,
    getAsignacion,
    createAsignacion,
    deleteAsignacion
}