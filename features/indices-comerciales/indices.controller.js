import executeQuery from "../../database/executeQuery.js";

import { format } from 'date-fns';

const getAllIndices = async (req, res) => {
    try {
        console.log("Fetching all indices comerciales");
        const [indices] = await executeQuery(`
            SELECT * FROM indices_comerciales ORDER BY id DESC LIMIT 1
        `);
        console.log("indices:", indices);
        return res.status(200).json({
            success: true,
            result: indices
        });
    } catch (err) {
        console.error('Error fetching indices:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching indices',
            error: err.message
        });
    }
};

const getIndexByField = async (req, res) => {
    const { field } = req.params;

    try {
        // Validate that field exists in table
        const validFields = await getValidFields();
        if (!validFields.includes(field)) {
            return res.status(400).json({
                success: false,
                message: `Invalid field: ${field}`
            });
        }

        const query = `SELECT ${field} FROM indices_comerciales LIMIT 1`;
        const [result] = await executeQuery(query);

        return res.status(200).json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error(`Error fetching index value for ${field}:`, error);
        return res.status(500).json({
            success: false,
            message: `Error retrieving ${field} value`
        });
    }
};

const updateIndexByField = async (req, res) => {
    const { field } = req.params;
    const { value } = req.body;

    console.log(`Updating index value for field: ${field} with value: ${value}`);

    try {
        // Validate that field exists in table
        const validFields = await getValidFields();
        if (!validFields.includes(field)) {
            return res.status(400).json({
                success: false,
                message: `Invalid field: ${field}`
            });
        }

        // Check if we have a record
        const recordExists = await executeQuery("SELECT COUNT(*) as count FROM indices_comerciales");

        if (recordExists[0].count === 0) {
            // No record exists, create one
            const newRecord = {};
            newRecord[field] = value;

            const fields = [field];
            const values = [value];

            await executeQuery(
                `INSERT INTO indices_comerciales (${fields.join(', ')}) VALUES (?)`,
                [values]
            );
        } else {
            // Update the existing record
            await executeQuery(`UPDATE indices_comerciales SET ${field} = ? LIMIT 1`, [value]);
        }

        return res.status(200).json({
            success: true,
            message: `${field} updated successfully`,
            result: { [field]: value }
        });
    } catch (error) {
        console.error(`Error updating index value for ${field}:`, error);
        return res.status(500).json({
            success: false,
            message: `Error updating ${field} value`
        });
    }
};

const updateMultipleIndices = async (req, res) => {
    try {
        const updates = req.body;

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update provided"
            });
        }

        // Validate all fields
        const validFields = await getValidFields();
        const fields = Object.keys(updates);
        const invalidFields = fields.filter(field => !validFields.includes(field));

        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid fields: ${invalidFields.join(', ')}`
            });
        }

        // Check if we have a record
        const recordExists = await executeQuery("SELECT COUNT(*) as count FROM indices_comerciales");

        if (recordExists[0].count === 0) {
            // No record exists, create one
            const fieldsStr = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map(field => updates[field]);

            await executeQuery(
                `INSERT INTO indices_comerciales (${fieldsStr}) VALUES (${placeholders})`,
                values
            );
        } else {
            // Update the existing record
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updates[field]);

            await executeQuery(`UPDATE indices_comerciales SET ${setClause} LIMIT 1`, values);
        }

        return res.status(200).json({
            success: true,
            message: "Indices updated successfully",
            result: updates
        });
    } catch (error) {
        console.error("Error updating indices:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating indices"
        });
    }
};

const getValidFields = async () => {
    const query = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'indices_comerciales' 
    AND TABLE_SCHEMA = DATABASE()
    AND COLUMN_NAME NOT IN ('id')
  `;

    const result = await executeQuery(query);
    return result.map(row => row.COLUMN_NAME);
};

// CONSEGUIR UF DEL DIA
const getDailyUF = async (req, res) => {
    console.log("getDailyUF");
    try {
        const hoy = format(new Date(), 'yyyy-MM-dd');

        // ver si existe un registro para hoy
        const [ufRecord] = await executeQuery(`
            SELECT fecha, valor FROM valor_uf
            WHERE fecha = ?
            LIMIT 1
        `, [hoy]);

        // si hay un valor, devolverlo
        if (ufRecord && ufRecord.valor) {
            return res.status(200).json({
                success: true,
                message: "Valor UF del día encontrado",
                result: {
                    fecha: ufRecord.fecha,
                    valor: ufRecord.valor
                }
            });
        } else { // si no hay un valor, fetch desde la API
            /* const api... etc etc
            conseguir valores de la api...

            await executeQuery(`
                INSERT INTO valor_uf (fecha, valor) VALUES (?, ?)
            `, [hoy, valor]);

            return res.status(200).json({
                success: true,
                message: "Valor UF del día obtenido desde la API",
                result: {
                    fecha: hoy,
                    valor: valor
                }
            });
    
            */
        }
    } catch (err) {
        console.error('Error haciendo fetch del valor UF del día:', err);
        return res.status(500).json({
            success: false,
            message: 'Error haciendo fetch del valor UF del día',
            error: err.message
        });
    }
};

const getUTM = async (req, res) => {
    console.log("getUTM");
    try {
        // Formato año-mes (YYYY-MM) para buscar por mes en lugar de por día
        const mesActual = format(new Date(), 'yyyy-MM');
        
        // Ver si existe un registro para el mes actual
        const [utmRecord] = await executeQuery(`
            SELECT fecha, valor_utm FROM valores_tributarios
            WHERE DATE_FORMAT(fecha, '%Y-%m') = ?
            ORDER BY fecha DESC
            LIMIT 1
        `, [mesActual]);
        
        // Si hay un valor para este mes, devolverlo
        if (utmRecord && utmRecord.valor_utm) {
            return res.status(200).json({
                success: true,
                message: "Valor UTM del mes encontrado",
                result: {
                    fecha: utmRecord.fecha,
                    valor: utmRecord.valor_utm
                }
            });
        } else { // Si no hay un valor para este mes, fetch desde la API
            /* const api... etc etc
            conseguir valores de la api...
            
            // Al guardar, usamos el primer día del mes o fecha específica de publicación
            await executeQuery(`
                INSERT INTO valores_tributarios (fecha, valor_utm) VALUES (?, ?)
            `, [fechaPublicacion, valor_utm]);

            return res.status(200).json({
                success: true,
                message: "Valor UTM del mes obtenido desde la API",
                result: {
                    fecha: fechaPublicacion,
                    valor: valor_utm
                }
            });
            */
        }
    } catch (err) {
        console.error('Error haciendo fetch del valor UTM del mes:', err);
        return res.status(500).json({
            success: false,
            message: 'Error haciendo fetch del valor UTM del mes',
            error: err.message
        });
    }
};

export {
    getAllIndices,
    getIndexByField,
    updateIndexByField,
    updateMultipleIndices,
    getDailyUF,
    getUTM
};