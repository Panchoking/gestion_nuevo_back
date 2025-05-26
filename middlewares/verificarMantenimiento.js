import executeQuery from "../database/executeQuery.js";

const verificarMantenimiento = (excluirRutas = []) => {
    return async (req, res, next) => {
        // Si la ruta está en la lista de exclusiones, continuar sin verificar
        const rutaActual = req.path;
        for (const ruta of excluirRutas) {
            if (rutaActual.startsWith(ruta)) {
                return next();
            }
        }

        try {
            const plataforma = req.headers['x-plataforma'] || 'CHECK';

            // Si es una ruta de mantenimiento, permitir el acceso
            if (rutaActual.startsWith('/mantenimiento')) {
                return next();
            }

            // Verificar si hay mantenimiento activo para esta plataforma
            const query = `
                SELECT pm.activo, pm.mensaje
                FROM plataforma_mantenimiento pm
                JOIN plataforma p ON p.id = pm.id_plataforma
                WHERE p.codigo = ?
                ORDER BY pm.createdAt DESC
                LIMIT 1;
            `;

            const [result] = await executeQuery(query, [plataforma]);

            // Si hay un mantenimiento activo, rechazar la solicitud
            if (result && result.activo) {
                return res.status(503).json({
                    success: false,
                    enMantenimiento: true,
                    mensaje: result.mensaje || "Sistema en mantenimiento",
                    code: "MAINTENANCE_MODE"
                });
            }

            next();
        } catch (err) {
            console.error("Error al verificar estado de mantenimiento:", err.message);
            // En caso de error, permitimos el acceso para no bloquear el sistema
            next();
        }
    };
};

export default verificarMantenimiento;