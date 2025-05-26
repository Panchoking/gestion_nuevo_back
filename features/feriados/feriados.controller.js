import executeQuery from "../../database/executeQuery.js";

const getFeriados = async (req, res) => {
    const query = 'SELECT * FROM feriado;';
    try {
        const result = await executeQuery(query);
        res.status(200).json({ success: true, feriados: result });
    } catch (err) {
        console.error("Error obteniendo los feriados:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener los feriados:", error: err.message });
    }
};

const updateFeriado = async (req, res) => {
    console.log("updateFeriado");
    const { id } = req.params;
    const { fecha, descripcion } = req.body;

    // validar la fecha
    if (!fecha || isNaN(Date.parse(fecha))) {
        console.log("fecha inválida");
        return res.status(400).json({ success: false, message: "La fecha es inválida o está vacía." });
    }

    try {
        // revisar si existe el feriado en la db
        const existingFeriado = await executeQuery("SELECT * FROM feriado WHERE id = ?", [id]);
        if (existingFeriado.length === 0) {
            console.log("feriado no encontrado");
            return res.status(404).json({ success: false, message: "Feriado no encontrado." });
        }

        await executeQuery("UPDATE feriado SET fecha = ?, descripcion = ? WHERE id = ?", [fecha, descripcion, id]);
        console.log("exito");
        res.status(200).json({ success: true, message: "Feriado actualizado exitosamente." });
    } catch (err) {
        console.error("Error actualizando el feriado:", err.message);
        res.status(500).json({ success: false, message: "Error del servidor.", error: err.message });
    }
};

const createFeriado = async (req, res) => {
    console.log("createFeriado");
    const { fecha, descripcion } = req.body;

    // validar la fecha
    if (!fecha || isNaN(Date.parse(fecha))) {
        console.log("fecha inválida");
        return res.status(400).json({ success: false, message: "La fecha es inválida o está vacía." });
    }

    try {
        // validar fecha ya existe
        const existingFeriado = await executeQuery("SELECT * FROM feriado WHERE fecha = ?", [fecha]);
        if (existingFeriado.length > 0) {
            console.log("feriado ya existe");
            return res.status(409).json({ success: false, message: "La fecha del feriado ya está en uso." });
        }

        console.log("fecha recibida:", req.body.fecha);
        console.log("fecha interpretada en backend:", new Date(req.body.fecha));


        await executeQuery("INSERT INTO feriado (fecha, descripcion) VALUES (?, ?)", [fecha, descripcion]);
        console.log("exito");
        res.status(201).json({ success: true, message: "Feriado creado exitosamente." });
    } catch (err) {
        console.error("Error creando el feriado:", err.message);
        res.status(500).json({ success: false, message: "Error del servidor.", error: err.message });
    }
};

const deleteFeriado = async (req, res) => {
    const { id } = req.params;
    console.log("deleteFeriado", id);
    try {
        // verificar si el feriado existe
        const existingFeriado = await executeQuery("SELECT * FROM feriado WHERE id = ?", [id]);
        if (existingFeriado.length === 0) {
            console.log("feriado no encontrado");
            return res.status(404).json({ success: false, message: "Feriado no encontrado." });
        }

        await executeQuery("DELETE FROM feriado WHERE id = ?", [id]);
        console.log("success");
        res.status(200).json({ success: true, message: "Feriado eliminado exitosamente." });
    } catch (err) {
        console.error("Error eliminando el feriado:", err.message);
        res.status(500).json({ success: false, message: "Error del servidor.", error: err.message });
    }
};

export {
    getFeriados,
    updateFeriado,
    createFeriado,
    deleteFeriado
}