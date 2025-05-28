import axios from 'axios';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import executeQuery from "../../database/executeQuery.js";

dotenv.config();

const BASE_URL = process.env.SBIF_BASE_URL;
const API_KEY = process.env.SBIF_API_KEY;

// para modificar los indices logica put
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

// CONSEGUIR UF DEL DIA - COMBINADO CON API
const getDailyUF = async (req, res) => {
    try {
        const hoy = format(new Date(), 'yyyy-MM-dd');

        // ver si existe un registro para hoy
        const [ufRecord] = await executeQuery(`
            SELECT fecha, valor_diario FROM valor_uf
            WHERE fecha = ?
            LIMIT 1
        `, [hoy]);

        // si hay un valor, devolverlo
        if (ufRecord && ufRecord.valor_diario) {
            return res.status(200).json({
                success: true,
                message: "Valor UF del día encontrado",
                result: {
                    fecha: ufRecord.fecha,
                    valor: ufRecord.valor_diario
                }
            });
        } else {
            // si no hay un valor, fetch desde la API
            try {
                const url = `${BASE_URL}/api-sbifv3/recursos_api/uf?apikey=${API_KEY}&formato=json`;
                const response = await axios.get(url);
                const uf = response.data.UFs?.[0];

                if (uf) {
                    const fecha = new Date(uf.Fecha).toISOString().split('T')[0];
                    const valor = parseFloat(uf.Valor.replace(/\./g, '').replace(',', '.'));

                    // Guardar en la base de datos
                    await executeQuery(`
                        INSERT INTO valor_uf (fecha, valor_diario) VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE valor_diario = VALUES(valor_diario)
                    `, [fecha, valor]);

                    console.log(`[UF] UF insertada/actualizada: ${fecha} - ${valor}`);

                    return res.status(200).json({
                        success: true,
                        message: "Valor UF del día obtenido desde la API",
                        result: {
                            fecha: fecha,
                            valor: valor
                        }
                    });
                } else {
                    throw new Error('No se pudo obtener valor UF de la API');
                }
            } catch (apiError) {
                console.error('Error llamando a la API de UF:', apiError);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo valor UF desde la API',
                    error: apiError.message
                });
            }
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

// CONSEGUIR UTM DEL DIA - COMBINADO CON API
const getUTM = async (req, res) => {
    try {
        const hoy = format(new Date(), 'yyyy-MM-dd');

        // ver si existe un registro para hoy
        const [utmRecord] = await executeQuery(`
            SELECT fecha, valor_utm FROM valores_tributarios
            WHERE fecha = ?
            LIMIT 1
        `, [hoy]);
        
        // si hay un valor, devolverlo
        if (utmRecord && utmRecord.valor_utm) {
            return res.status(200).json({
                success: true,
                message: "Valor UTM del día encontrado",
                result: {
                    fecha: utmRecord.fecha,
                    valor: utmRecord.valor_utm
                }
            });
        } else {
            // si no hay un valor, fetch desde la API
            try {
                const url = `${BASE_URL}/api-sbifv3/recursos_api/utm?apikey=${API_KEY}&formato=json`;
                const response = await axios.get(url);
                const utm = response.data.UTMs?.[0];

                if (utm) {
                    const fecha = new Date(utm.Fecha).toISOString().split('T')[0];
                    const valor = parseFloat(utm.Valor.replace(/\./g, '').replace(',', '.'));

                    // Guardar en la base de datos
                    await executeQuery(`
                        INSERT INTO valores_tributarios (fecha, valor_utm) VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE valor_utm = VALUES(valor_utm)
                    `, [fecha, valor]);

                    console.log(`[UTM] UTM insertada/actualizada: ${fecha} - ${valor}`);

                    return res.status(200).json({
                        success: true,
                        message: "Valor UTM del día obtenido desde la API",
                        result: {
                            fecha: fecha,
                            valor: valor
                        }
                    });
                } else {
                    throw new Error('No se pudo obtener valor UTM de la API');
                }
            } catch (apiError) {
                console.error('Error llamando a la API de UTM:', apiError);
                return res.status(500).json({
                    success: false,
                    message: 'Error obteniendo valor UTM desde la API',
                    error: apiError.message
                });
            }
        }
    } catch (err) {
        console.error('Error haciendo fetch del valor UTM del día:', err);
        return res.status(500).json({
            success: false,
            message: 'Error haciendo fetch del valor UTM del día',
            error: err.message
        });
    }
};


// CONSEGUIR HISTORICO UTM DE LOS ULTIMOS 6 MESES
const getHistorialUTM = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const url = `${BASE_URL}/api-sbifv3/recursos_api/utm/${currentYear}?apikey=${API_KEY}&formato=json`;

        const response = await axios.get(url);
        const utms = response.data.UTMs || [];

        // Obtener los últimos 6 meses
        const historial = utms.slice(0, 6).map(item => ({
            fecha: item.Fecha,
            valor: parseFloat(item.Valor.replace(/\./g, '').replace(',', '.')),
            mes: new Date(item.Fecha).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
        }));

        return res.status(200).json({
            success: true,
            message: "Historial UTM obtenido correctamente",
            result: {
                historial: historial,
                total: historial.length
            }
        });

    } catch (error) {
        console.error("Error al obtener historial UTM desde SBIF:", error.message);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo historial UTM',
            error: error.message
        });
    }
};



// FUNCIÓN ADICIONAL PARA OBTENER Y GUARDAR IPC (del segundo código)
const obtenerYGuardarIPC = async () => {
    try {
        const currentYear = new Date().getFullYear() - 1;
        const url = `${BASE_URL}/api-sbifv3/recursos_api/ipc/${currentYear}?apikey=${API_KEY}&formato=json`;

        const response = await axios.get(url);
        const ipcData = response.data.IPCs || [];

        if (ipcData.length < 12) {
            throw new Error('No hay suficientes datos de IPC mensual para calcular el anual');
        }

        // Sumar los valores mensuales (convertidos a número)
        const acumuladoAnual = ipcData.reduce((acc, item) => {
            const valor = parseFloat(item.Valor.replace(',', '.'));
            return acc + (isNaN(valor) ? 0 : valor);
        }, 0);

        // Guardar en base de datos
        const query = `
            INSERT INTO indices_comerciales (ipc)
            VALUES (?)
            ON DUPLICATE KEY UPDATE ipc = VALUES(ipc);
        `;

        await executeQuery(query, [acumuladoAnual]);

        console.log(`[IPC] Acumulado anual insertado/actualizado: ${acumuladoAnual.toFixed(2)}%`);

        return { ipcAnual: parseFloat(acumuladoAnual.toFixed(2)) };

    } catch (error) {
        console.error("Error al obtener o guardar IPC acumulado anual:", error.message);
        throw error;
    }
};

export {
    getAllIndices,
    getIndexByField,
    updateIndexByField,
    updateMultipleIndices,
    getDailyUF,
    getUTM,
    obtenerYGuardarIPC,
    getHistorialUTM
};