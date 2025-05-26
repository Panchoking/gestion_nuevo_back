import executeQuery from "../../database/executeQuery.js";

const createHorario = async (req, res) => {
    try {
        const { nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo, dias } = req.body;
        console.log("createHorario dias", dias);

        // Validaciones
        if (!nombre || !tipo_ciclo || !fecha_inicio_ciclo || !duracion_ciclo || !dias || !Array.isArray(dias)) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos o incorrectos para crear el horario'
            });
        }

        // Validar que el nombre no esté ocupado
        const [existingHorarios] = await executeQuery('SELECT * FROM horario WHERE nombre = ?', [nombre]);
        if (existingHorarios) {
            return res.status(409).json({ success: false, message: 'El nombre del horario ya está en uso' });
        }

        // Iniciamos una transacción
        await executeQuery('START TRANSACTION');

        try {
            // Insertar el horario
            const result = await executeQuery(
                `INSERT INTO horario (nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo) 
                VALUES (?, ?, ?, ?)`,
                [nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo]
            );

            const horarioId = result.insertId;

            // Insertar los días del horario
            for (const dia of dias) {
                if (dia.dia < 1 || dia.dia > duracion_ciclo) {
                    await executeQuery('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `Los días deben estar entre 1 y ${duracion_ciclo}`
                    });
                }

                // Verificar si hay horas asignadas o información de horario
                if (dia.horas !== undefined && dia.horas > 0) {
                    // Si tenemos horas y adicionalmente hora_ingreso/hora_salida
                    if (dia.hora_ingreso && dia.hora_salida) {
                        await executeQuery(
                            `INSERT INTO horario_dia (id_horario, dia, horas, hora_ingreso, hora_salida) 
                            VALUES (?, ?, ?, ?, ?)`,
                            [horarioId, dia.dia, dia.horas, dia.hora_ingreso, dia.hora_salida]
                        );
                    } else {
                        // Solo tenemos horas (para compatibilidad con el formato anterior)
                        await executeQuery(
                            `INSERT INTO horario_dia (id_horario, dia, horas) 
                            VALUES (?, ?, ?)`,
                            [horarioId, dia.dia, dia.horas]
                        );
                    }
                } else {
                    // Si no hay horas definidas, se considera día libre
                    await executeQuery(
                        `INSERT INTO horario_dia (id_horario, dia) VALUES (?, ?)`,
                        [horarioId, dia.dia]
                    );
                }
            }

            // Confirmamos la transacción
            await executeQuery('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Horario creado exitosamente.',
                id: horarioId
            });
        } catch (error) {
            await executeQuery('ROLLBACK');
            throw error;
        }
    } catch (err) {
        console.error('Error creando el horario:', err);
        res.status(500).json({ success: false, message: 'Error del servidor', error: err.message });
    }
};

const getHorarios = async (req, res) => {
    try {
        const horarios = await executeQuery(`
            SELECT id, nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo, activo
            FROM horario
            ORDER BY nombre ASC
        `);

        for (const horario of horarios) {
            const dias = await executeQuery(`
                SELECT dia, horas, hora_ingreso, hora_salida
                FROM horario_dia
                WHERE id_horario = ?
                ORDER BY dia ASC
            `, [horario.id]);

            horario.horario_dias = dias;
        }

        res.status(200).json({ success: true, result: horarios });
    } catch (err) {
        console.error("Error obteniendo los horarios:", err.message);
        res.status(500).json({ success: false, message: "Error al obtener los horarios", error: err.message });
    }
};

const updateHorario = async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo, dias } = req.body;

    if (!nombre || !tipo_ciclo || !fecha_inicio_ciclo || !duracion_ciclo || !dias || !Array.isArray(dias)) {
        return res.status(400).json({
            success: false,
            message: 'Datos incompletos o incorrectos para actualizar el horario'
        });
    }

    try {
        // Validar que el horario existe
        const [existingHorario] = await executeQuery('SELECT * FROM horario WHERE id = ?', [id]);
        if (existingHorario.length === 0) {
            return res.status(404).json({ success: false, message: 'Horario no encontrado' });
        }

        // Iniciar transacción
        await executeQuery('START TRANSACTION');

        // Actualizar el horario
        await executeQuery(
            `UPDATE horario 
             SET nombre = ?, tipo_ciclo = ?, fecha_inicio_ciclo = ?, duracion_ciclo = ? 
             WHERE id = ?`,
            [nombre, tipo_ciclo, fecha_inicio_ciclo, duracion_ciclo, id]
        );

        // Eliminar los días existentes
        await executeQuery('DELETE FROM horario_dia WHERE id_horario = ?', [id]);

        // Insertar los nuevos días
        for (const dia of dias) {
            if (dia.dia < 1 || dia.dia > duracion_ciclo || isNaN(parseInt(dia.horas)) || parseInt(dia.horas) < 0) {
                // Rollback en caso de error
                await executeQuery('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Los días deben estar entre 1 y ${duracion_ciclo} y las horas deben ser números positivos`
                });
            }

            // Verificar si hay horas asignadas y horarios
            if (dia.horas > 0) {
                await executeQuery(
                    `INSERT INTO horario_dia (id_horario, dia, horas, hora_ingreso, hora_salida) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [id, dia.dia, dia.horas, dia.hora_ingreso, dia.hora_salida]
                );
            } else {
                // Si no hay horas (día libre), no guardamos hora_ingreso/hora_salida
                await executeQuery(
                    `INSERT INTO horario_dia (id_horario, dia, horas) 
                    VALUES (?, ?, ?)`,
                    [id, dia.dia, 0]
                );
            }
        }

        // Confirmar cambios
        await executeQuery('COMMIT');

        res.status(200).json({ success: true, message: 'Horario actualizado exitosamente.' });
    } catch (err) {
        await executeQuery('ROLLBACK');
        console.error('Error actualizando el horario:', err);
        res.status(500).json({ success: false, message: 'Error del servidor', error: err.message });
    }
};

const deleteHorario = async (req, res) => {
    const { id } = req.params;

    try {
        const [usuariosAsociados] = await executeQuery("SELECT COUNT(*) as cantidad FROM contrato WHERE id_horario = ?", [id]);

        if (usuariosAsociados.cantidad > 0) {
            // Si hay usuarios asociados, solo desactivamos el horario
            await executeQuery("UPDATE horario SET activo = 0 WHERE id = ?", [id]);
            return res.status(200).json({
                success: true,
                message: "Horario desactivado por tener usuarios asociados."
            });
        }

        // Si no hay asociaciones, eliminamos el horario y sus días
        await executeQuery('START TRANSACTION');

        // Eliminar primero los días del horario
        await executeQuery("DELETE FROM horario_dia WHERE id_horario = ?", [id]);

        // Luego eliminar el horario
        await executeQuery("DELETE FROM horario WHERE id = ?", [id]);

        await executeQuery('COMMIT');

        res.status(200).json({ success: true, message: "Horario eliminado exitosamente." });
    } catch (err) {
        await executeQuery('ROLLBACK');
        console.error("Error eliminando el horario", err.message);
        res.status(500).json({ success: false, message: "Error del servidor.", error: err.message });
    }
};


const verificarRegistroHorario = async (req, res) => {
    const { id } = req.params;

    try {
        const [registrosAsociados] = await executeQuery(`
            SELECT EXISTS(
                SELECT 1 FROM contrato WHERE id_horario = ?
            ) as result;
        `, [id]);

        const tieneRegistros = registrosAsociados.result === 1;

        res.status(200).json({ success: true, tieneRegistros });
    } catch (err) {
        console.error("Error verificando registros del horario", err.message);
        res.status(500).json({ success: false, message: "Error del servidor", error: err.message });
    }
};

const updateEstadoHorario = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined || activo === null) {
        return res.status(400).json({ success: false, message: "El estado activo es requerido" });
    }

    try {
        await executeQuery("UPDATE horario SET activo = ? WHERE id = ?", [activo, id]);
        res.status(200).json({ success: true, message: "Estado actualizado exitosamente." });
    } catch (err) {
        console.error("Error actualizando estado del horario:", err.message);
        res.status(500).json({ success: false, message: "Error del servidor", error: err.message });
    }
};




// Actualizar la función createHorario y updateHorario


const activateHorario = async (req, res) => {
    const { id } = req.params;

    try {
        await executeQuery("UPDATE horario SET activo = true WHERE id = ?", [id]);
        res.status(200).json({ success: true, message: "Horario activado." });
    } catch (err) {
        console.error("Error activando horario:", err.message);
        res.status(500).json({ success: false, message: "Error del servidor", error: err.message });
    }
};
export {
    activateHorario,
    verificarRegistroHorario,
    getHorarios,
    updateHorario,
    updateEstadoHorario,
    createHorario,
    deleteHorario,
}