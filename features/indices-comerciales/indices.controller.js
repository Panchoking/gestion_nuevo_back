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

const getTramosIUSC = async (req, res) => {
    try {
        const tramos = await executeQuery(`
            SELECT tramo, desde_utm, hasta_utm, tasa, rebajar_utm, tasa_maxima 
            FROM valores_iusc 
            ORDER BY tramo
        `);

        return res.status(200).json({
            success: true,
            result: tramos
        });
    } catch (error) {
        console.error('Error al obtener tramos IUSC:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener tramos IUSC',
            error: error.message
        });
    }
};

const getAFC = async (req, res) => {
    try {
        const afcData = await executeQuery('SELECT * FROM afc ORDER BY id');

        return res.status(200).json({
            success: true,
            result: afcData
        });
    } catch (err) {
        console.error('Error obteniendo datos de AFC:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de AFC',
            error: err.message
        });
    }
};

//obtencion de la uf con api

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

const getUFByDate = async (req, res) => {
    try {
        const fecha = req.query.fecha; // fecha obtenida del front

        const ufData = await cmfClient.getUFByDate(fecha);
        if (!ufData || !ufData.UFs || ufData.UFs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UF para la fecha proporcionada'
            });
        }

        const uf = ufData.UFs[0];
        console.log('UF obtenida para la fecha:', uf);


        return res.status(200).json({
            success: true,
            result: {
                fecha: uf.Fecha,
                valor: uf.Valor,
            }
        });

    } catch (error) {
        console.error("Error al obtener UF:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error al obtener el valor de la UF",
            error: error.message
        });
    }
};

// CONSEGUIR UTM DEL MES - CORREGIDO PARA BUSCAR POR MES
const getUTM = async (req, res) => {
    try {
        const utmData = await cmfClient.getCurrentUTM();
        if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UTM del mes'
            });
        }

        const utm = utmData.UTMs[0];
        console.log('UTM del mes obtenida:', utm);

        return res.status(200).json({
            success: true,
            message: "Valor UTM del mes encontrado",
            result: {
                fecha: utm.Fecha,
                valor: utm.Valor
            }
        });
    } catch (err) {
        console.error('Error obteniendo UTM del mes:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo UTM del mes',
            error: err.message
        });
    }
};

const getUTMbyDate = async (req, res) => {
    try {
        const fecha = req.query.fecha; // fecha obtenida del front

        const utmData = await cmfClient.getUTMbyDate(fecha);
        if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UTM del mes'
            });
        }

        const utm = utmData.UTMs[0];
        console.log('UTM del mes obtenida:', utm);

        return res.status(200).json({
            success: true,
            message: "Valor UTM del mes encontrado",
            result: {
                fecha: utm.Fecha,
                valor: utm.Valor
            }
        });
    } catch (err) {
        console.error('Error obteniendo UTM del mes:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo UTM del mes',
            error: err.message
        });
    }
};



// CONSEGUIR HISTORICO UTM DE LOS ULTIMOS 6 MESES
const getHistorialUTM = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const url = `http://api.cmfchile.cl/api-sbifv3/recursos_api/utm/${currentYear}?apikey=${API_KEY}&formato=json`;

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
const obtenerIPC = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear() - 1;
        const url = `http://api.cmfchile.cl/api-sbifv3/recursos_api/ipc/${currentYear}?apikey=${process.env.CMF_API_KEY}&formato=json`;

        const response = await axios.get(url);
        const ipcData = response.data.IPCs || [];

        if (ipcData.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'No hay suficientes datos de IPC mensual para calcular el anual'
            });
        }

        const acumuladoAnual = ipcData.reduce((acc, item) => {
            const valor = parseFloat(item.Valor.replace(',', '.'));
            return acc + (isNaN(valor) ? 0 : valor);
        }, 0);

        const ipcAnual = parseFloat(acumuladoAnual.toFixed(2));

        return res.status(200).json({
            success: true,
            message: 'IPC acumulado anual obtenido correctamente',
            result: {
                year: currentYear,
                valor: ipcAnual
            }
        });

    } catch (error) {
        console.error("Error al obtener IPC anual:", error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener IPC anual',
            error: error.message
        });
    }
};

const getAFP = async (req, res) => {
    try {
        const response = await executeQuery('SELECT * FROM AFP ORDER BY id');
        if (response.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron datos de AFP'
            });
        }
        return res.status(200).json({
            success: true,
            result: response
        });
    } catch (err) {
        console.error('Error obteniendo datos de AFP:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de AFP',
            error: err.message
        });
    }
};

const calcularLiquidacion = async (req, res) => {
    try {
        const { sueldoBase, horasExtras, diasTrabajados, afp } = req.body;
        // por ahora solo usaremos sueldoBase
        console.log("afp:", afp);
        const [afpData] = await executeQuery('SELECT * FROM afp WHERE id = ?', [afp]); // extraer tasa de aca
        console.log("afpData:", afpData);

        if (!sueldoBase || isNaN(sueldoBase)) { // validar sueldo base
            return res.status(400).json({
                success: false,
                message: 'Sueldo base inválido'
            });
        }

        // obtener las horas legales
        const [{ valor: horasLegales }] = await executeQuery('SELECT valor FROM indices_comerciales WHERE nombre = "horas_legales" LIMIT 1;');
        const [{ valor: sueldoMinimo }] = await executeQuery('SELECT valor FROM indices_comerciales WHERE nombre = "rmi_general" LIMIT 1;');
        const [{ valor: planSalud }] = await executeQuery('SELECT valor FROM indices_comerciales WHERE nombre = "plan_salud" LIMIT 1;');
        console.log('Horas legales:', horasLegales);

        // obtener gratificación
        let gratificacion = sueldoBase * 0.25; // 25% del sueldo base
        // calcular tope gratificacion
        const topeGratificacion = (sueldoMinimo * 4.75) / 12;

        if (gratificacion > topeGratificacion) { // si la gratificación excede el tope, ajustarla
            console.log('Gratificación excede el tope, ajustando a:', topeGratificacion);
            gratificacion = topeGratificacion;
        }

        // calcular FHE (factor horas extras)
        const factorBase = (28 / 30) / (horasLegales * 4); // 28 días al mes, 30 días al mes, horas legales por 4 semanas
        const fhe = factorBase * 1.5; // factor horas extras, 1.5 = factor constante
        console.log('Factor Horas Extras (FHE):', fhe);

        // calcular horas extras
        const horasExtrasCalculadas = (sueldoBase * fhe) * horasExtras;
        console.log('Horas Extras Calculadas:', horasExtrasCalculadas);

        // calcular sueldo bruto
        let sueldoBruto = sueldoBase + gratificacion + horasExtrasCalculadas;
        console.log('Sueldo Bruto:', sueldoBruto);

        // descuento afp
        const descuentoAFP = (afpData.tasa / 100) * sueldoBruto;
        console.log('Descuento AFP:', descuentoAFP);
        
        sueldoBruto -= descuentoAFP; // restar descuento AFP al sueldo bruto
        console.log('Sueldo Bruto después de AFP:', sueldoBruto);


        // retornar respuesta para testing
        return res.status(200).json({
            success: true,
            message: 'OK',
            result: {
                sueldoBruto: sueldoBruto,
                fhe: fhe,
                gratificacion: gratificacion,
                horasExtrasCalculadas: horasExtrasCalculadas,
            }
        });
    } catch (err) {
        console.error('Error calculando liquidación:', err);
        return res.status(500).json({
            success: false,
            message: 'Error calculando liquidación',
            error: err.message
        });
    }
}


export {
    getAllIndices,
    getIndexByField,
    updateIndexByField,
    getDailyUF,
    getUFByDate,
    getUTMbyDate,
    getUTM,
    obtenerIPC,
    getHistorialUTM,
    getTramosIUSC,
    getAFP,
    getAFC,
    calcularLiquidacion
};