// controllers/contratoController.js
import executeQuery from '../../../database/executeQuery.js';


// Obtener todos los contratos laborales
const getContratos = async (req, res) => {
    try {
        const query = `
      SELECT 
        c.id,
        c.codigo AS c_codigo,
        c.mandante AS c_mandante,
        c.cargo AS c_cargo,
        c.calificacion AS c_calificacion,
        c.titulo AS c_titulo,
        c.sueldo_base,
        c.valor_plan_isapre,
        c.ist,
        c.seguro_cesantia,
        c.anticipo,
        c.porcentaje_anticipo,
        c.colacion,
        c.fecha_contrato,
        c.termino_plazo_fijo,
        c.fonasa,
        c.fonasa_tramo,
        c.id_centro_costo,
        c.id_horario,
        c.id_tipo_contrato,
        c.id_isapre,
        c.id_afp,
        c.id_caja_compensacion,
        p.nombre AS proyecto_nombre,
        h.nombre AS nombre_horario,
        tc.nombre AS tipo_contrato,
        a.nombre AS nombre_afp,
        i.nombre AS nombre_isapre,
        cc.nombre AS nombre_caja
      FROM contrato c
      JOIN proyecto p ON c.id_proyecto = p.id
      JOIN horario h ON c.horario_id = h.id
      JOIN tipo_contrato tc ON c.tipo_contrato_id = tc.id
      JOIN afp a ON c.afp_id = a.id
      JOIN isapre i ON c.isapre_id = i.id
      JOIN caja_de_compensacion cc ON c.caja_de_compensacion_id = cc.id
    `;
        const result = await executeQuery(query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener contratos", error });
    }
};


// Obtener contrato por ID de usuario
const getContratoByUsuario = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const query = `
      SELECT 
        c.id,
        c.codigo AS c_codigo,
        c.mandante AS c_mandante,
        c.cargo AS c_cargo,
        c.calificacion AS c_calificacion,
        c.titulo AS c_titulo,
        c.sueldo_base,
        c.valor_plan_isapre,
        c.ist,
        c.seguro_cesantia,
        c.anticipo,
        c.porcentaje_anticipo,
        c.colacion,
        c.fecha_contrato,
        c.termino_plazo_fijo,
        c.fonasa,
        c.fonasa_tramo,
        c.id_centro_costo,
        c.id_horario,
        c.id_tipo_contrato,
        c.id_isapre,
        c.id_afp,
        c.id_caja_compensacion,
        p.nombre AS proyecto_nombre,
        h.nombre AS nombre_horario,
        tc.nombre AS tipo_contrato,
        a.nombre AS nombre_afp,
        i.nombre AS nombre_isapre,
        cc.nombre AS nombre_caja
      FROM contrato c
      JOIN proyecto p ON c.id_proyecto = p.id
      JOIN horario h ON c.horario_id = h.id
      JOIN tipo_contrato tc ON c.tipo_contrato_id = tc.id
      JOIN afp a ON c.afp_id = a.id
      JOIN isapre i ON c.isapre_id = i.id
      JOIN caja_de_compensacion cc ON c.caja_de_compensacion_id = cc.id
      WHERE c.usuario_id = ?
    `;
        const result = await executeQuery(query, [usuario_id]);
        res.json(result.length > 0 ? result[0] : { message: "Contrato no encontrado" });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener contrato del usuario", error });
    }
};


// Crear un nuevo contrato

const createContrato = async (req, res) => {
    const {
        usuario_id, mandante, cargo, calificacion, titulo, sueldo_base,
        valor_plan_isapre, ist, seguro_cesantia, anticipo, porcentaje_anticipo,colacion,
        id_proyecto, horario_id, tipo_contrato_id, isapre_id, afp_id, caja_de_compensacion_id
    } = req.body;

    try {
        const query = `
      INSERT INTO contrato (
        usuario_id, mandante, cargo, calificacion, titulo, sueldo_base,
        valor_plan_isapre, ist, seguro_cesantia, anticipo, porcentaje_anticipo,colacion,
        id_proyecto, horario_id, tipo_contrato_id, isapre_id, afp_id, caja_de_compensacion_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
    const istValue = Number(ist); 
        await executeQuery(query, [
            usuario_id, mandante, cargo, calificacion, titulo, sueldo_base,
            valor_plan_isapre, istValue, seguro_cesantia, anticipo, porcentaje_anticipo,colacion,
            id_proyecto, horario_id, tipo_contrato_id, isapre_id, afp_id, caja_de_compensacion_id
        ]);

        res.status(201).json({ message: 'Contrato creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear contrato', error });
    }
};

// Actualizar contrato por usuario_id

const updateContrato = async (req, res) => {
    const { usuario_id } = req.params;
    const {
        mandante, cargo, calificacion, titulo, sueldo_base,
        valor_plan_isapre, ist, seguro_cesantia, anticipo, porcentaje_anticipo,colacion,
        id_proyecto, horario_id, tipo_contrato_id, isapre_id, afp_id, caja_de_compensacion_id
    } = req.body;

    try {
        const query = `
      UPDATE contrato SET 
        mandante = ?, cargo = ?, calificacion = ?, titulo = ?, sueldo_base = ?,
        valor_plan_isapre = ?, ist = ?, seguro_cesantia = ?, anticipo = ?, porcentaje_anticipo = ?,colacion = ?,
        id_proyecto = ?, horario_id = ?, tipo_contrato_id = ?, isapre_id = ?, afp_id = ?, caja_de_compensacion_id = ?
      WHERE usuario_id = ?
    `;
    const istValue = Number(ist); 
        await executeQuery(query, [
            mandante, cargo, calificacion, titulo, sueldo_base,
            valor_plan_isapre, istValue, seguro_cesantia, anticipo, porcentaje_anticipo,colacion,
            id_proyecto, horario_id, tipo_contrato_id, isapre_id, afp_id, caja_de_compensacion_id,
            usuario_id
        ]);

        res.json({ message: 'Contrato actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar contrato', error });
    }
};

// Eliminar contrato por usuario_id

const deleteContrato = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        await executeQuery('DELETE FROM contrato WHERE usuario_id = ?', [usuario_id]);
        res.json({ message: 'Contrato eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar contrato', error });
    }
};

const getTipoContrato = async (req, res) => {
    try {
        const tipo_contrato = await executeQuery("SELECT * FROM tipo_contrato");
        console.log("TIPO CONTRATO", tipo_contrato);
        res.status(200).json({
            success: true,
            message: "Tipo de contrato obtenido correctamente",
            result: tipo_contrato
        });
    } catch (err) {
        console.error("Error al obtener tipo de contrato:", err.message);
        res.status(500).json({
            error: "Error obteniendo tipo de contrato",
            message: err.message
        });
    }
};

export {
    getContratos,
    getContratoByUsuario,
    createContrato,
    updateContrato,
    deleteContrato,
    getTipoContrato
}