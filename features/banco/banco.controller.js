
// controllers/bancoController.js
import executeQuery from '../../database/executeQuery.js';

// Obtener todas las cuentas bancarias con nombre del banco
const getCuentasBancarias = async (req, res) => {
    try {
        const query = `
            SELECT 
            ib.id,
            ib.datos_personales,
            ib.id_banco,
            ib.cuenta as ib_cuenta,
            ib.numero_cuenta as ib_numero, 
            b.nombre AS banco_nombre
            FROM informacion_bancaria ib
            JOIN banco b ON ib.banco_id = b.id
        `;
        const result = await executeQuery(query);

        res.status(200).json({
            status: "success",
            message: "Cuentas bancarias obtenidas correctamente",
            result
        });
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo cuentas bancarias", error });
    }
};

// Obtener cuenta bancaria por usuario con nombre del banco
const getCuentaBancariaByUserId = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const query = `
            SELECT 
            ib.id,
            ib.datos_personales,
            ib.id_banco,
            ib.cuenta as ib_cuenta,
            ib.numero_cuenta as ib_numero, 
            b.nombre AS banco_nombre
            FROM informacion_bancaria ib
            JOIN banco b ON ib.banco_id = b.id
            WHERE ib.id_usuario = ?
        `;
        const [result] = await executeQuery(query, [id_usuario]);

        res.status(200).json({
            status: "success",
            message: "Cuentas bancarias obtenidas correctamente",
            result
        });
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo cuenta bancaria del usuario", error });
    }
};


// TODAS ESTAS FUNCIONES ESTAN MALAS
/*
const createCuentaBancaria = async (req, res) => {
    const { datos_personales_id, banco_id, cuenta, numero_cuenta } = req.body;
    try {
        const query = `INSERT INTO informacion_bancaria (datos_personales_id, banco_id, cuenta, numero_cuenta) 
                        VALUES (?, ?, ?, ?)`;
        await executeQuery(query, [datos_personales_id, banco_id, cuenta, numero_cuenta]);
        res.status(201).json({
            status: "success",
            message: "Cuenta bancaria agregada correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al agregar cuenta bancaria", error });
    }
};

// Actualizar cuenta bancaria
const updateCuentaBancaria = async (req, res) => {
    const { id } = req.params;
    const { banco_id, cuenta, numero_cuenta } = req.body;
    try {
        const query = `UPDATE informacion_bancaria SET banco_id = ?, cuenta = ?, numero_cuenta = ?
                        WHERE datos_personales_id = ?`;
        await executeQuery(query, [banco_id, cuenta, numero_cuenta, id]);

        res.status(200).json({
            status: "success",
            message: "Cuenta bancaria actualizada correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar cuenta bancaria", error });
    }
};

// Eliminar cuenta bancaria
const deleteCuentaBancaria = async (req, res) => {
    const { id } = req.params;
    try {
        const query = "DELETE FROM informacion_bancaria WHERE datos_personales_id = ?";
        await executeQuery(query, [id]);
        res.status(200).json({
            status: "success",
            message: "Cuenta bancaria eliminada correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar cuenta bancaria", error });
    }
};
*/
export {
    getCuentasBancarias,
    getCuentaBancariaByUserId,
    //createCuentaBancaria,
    //updateCuentaBancaria,
    //deleteCuentaBancaria
};
