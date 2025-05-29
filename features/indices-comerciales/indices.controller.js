import axios from 'axios';
import { format } from 'date-fns';
import dotenv from 'dotenv';

// API
import cmfClient from "../../api/cmf/client.js"; // cliente para la api CMF

// database
import executeQuery from "../../database/executeQuery.js";

dotenv.config();

const BASE_URL = process.env.SBIF_BASE_URL;
const API_KEY = process.env.SBIF_API_KEY;

// para modificar los indices logica put
const getAllIndices = async (req, res) => {
    try {
        console.log("Fetching all indices comerciales");
        const indices = await executeQuery(`
            SELECT * FROM indices_comerciales ORDER BY id
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
        const [result] = await executeQuery(
            "SELECT * FROM indices_comerciales WHERE nombre = ? LIMIT 1",
            [field]
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: `Indice ${field} no encontrado`
            });
        }

        return res.status(200).json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error(`Error consiguiendo el indice ${field}:`, error);
        return res.status(500).json({
            success: false,
            message: `Error consiguiendo el indice ${field}`
        });
    }
};

const updateIndexByField = async (req, res) => {
    const { field } = req.params;
    const { value } = req.body;

    console.log(`Updating index value for field: ${field} with value: ${value}`);

    try {
        // verificar si el indice existe
        const [existingIndex] = await executeQuery(`
            SELECT * FROM indices_comerciales WHERE nombre = ? LIMIT 1
        `, [field]);

        if (existingIndex) {
            // actualizar el indice existente
            await executeQuery(`
                UPDATE indices_comerciales SET valor = ? WHERE nombre = ?
            `, [value, field]);
        } else {
            // si no existe crear un nuevo registro
            await executeQuery(`
                INSERT INTO indices_comerciales (nombre, valor) VALUES (?, ?)
            `, [field, value]);
        }

        return res.status(200).json({
            success: true,
            message: `indice ${field} actualizado correctamente`,
            result: { nombre: field, valor: value }
        });
    } catch (err) {
        console.error(`Error actualizando indice ${field}:`, err);
        return res.status(500).json({
            success: false,
            message: `Error actualizando indice ${field}`,
            error: err.message
        });
    }
};

// OBTENER TRAMOS DEL IUSC
const getTramosIUSC = async (req, res) => {
    try {
        console.log("Fetching IUSC tramos");

        // consulta a la base de datos para obtener todos los tramos
        const tramosIUSC = await executeQuery(`
        `);
    }
};


// CONSEGUIR UF DEL DIA - COMBINADO CON API
const getDailyUF = async (req, res) => {
    try {
        const ufData = await cmfClient.getDailyUF();
        if (!ufData || !ufData.UFs || ufData.UFs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UF del día'
            });
        }

        const uf = ufData.UFs[0];
        console.log('UF del día obtenida:', uf);

        return res.status(200).json({
            success: true,
            message: "Valor UF del día encontrado",
            result: {
                fecha: uf.Fecha,
                valor: uf.Valor
            }
        });
    } catch (err) {
        console.error('Error obteniendo UF del día:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo UF del día',
            error: err.message
        });
    }
};


// FUNCIONES QUE DEBERIAN ELIMINARSE 
// CONSEGUIR UTM DEL MES - CORREGIDO PARA BUSCAR POR MES
const getUTM = async (req, res) => {
    try {
        // obtener año y mes actual
        const now = new Date();
        const [currentYear, currentMonth] = [now.getFullYear(), now.getMonth() + 1];

        // buscar UTM actual sin considerar el dia
        const [utmRecord] = await executeQuery(`
            SELECT fecha, valor_utm FROM valores_tributarios
            WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
            ORDER BY fecha DESC
            LIMIT 1
        `, [currentYear, currentMonth]);

        // si hay un valor, devolverlo
        if (utmRecord && utmRecord.valor_utm) {
            return res.status(200).json({
                success: true,
                message: "Valor UTM del mes encontrado",
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

                    // guardar en la base de datos
                    await executeQuery(`
                        INSERT INTO valores_tributarios (fecha, valor_utm) VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE valor_utm = VALUES(valor_utm)
                    `, [fecha, valor]);

                    console.log(`[UTM] UTM insertada/actualizada: ${fecha} - ${valor}`);

                    return res.status(200).json({
                        success: true,
                        message: "Valor UTM del mes obtenido desde la API",
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
        console.error('Error haciendo fetch del valor UTM del mes:', err);
        return res.status(500).json({
            success: false,
            message: 'Error haciendo fetch del valor UTM del mes',
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
    getDailyUF,
    getUTM,
    obtenerYGuardarIPC,
    getHistorialUTM
};