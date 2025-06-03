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
// Controlador para calcular la liquidación con AFP, salud y cesantía (trabajador)
const calcularLiquidacion = async (req, res) => {
    try {
        const { sueldoBase, horasExtras, diasTrabajados, afp } = req.body;

        console.log("afp ID:", afp);

        if (!sueldoBase || isNaN(sueldoBase)) {
            return res.status(400).json({ success: false, message: 'Sueldo base inválido' });
        }

        // Obtener datos de AFP seleccionada
        const [afpData] = await executeQuery('SELECT * FROM afp WHERE id = ?', [afp]);
        if (!afpData) {
            return res.status(400).json({ success: false, message: 'AFP no encontrada' });
        }
        const tasaAFP = parseFloat(afpData.tasa);
        console.log("Tasa AFP seleccionada:", tasaAFP);

        // Obtener índices base
        const indices = await executeQuery(`
            SELECT nombre, valor FROM indices_comerciales
            WHERE nombre IN ("horas_legales", "rmi_general", "plan_salud");
        `);
        const getIndice = (nombre) => parseFloat(indices.find(i => i.nombre === nombre)?.valor || 0);

        const horasLegales = getIndice("horas_legales");
        const sueldoMinimo = getIndice("rmi_general");
        const planSalud = getIndice("plan_salud"); // 7%

        // Gratificación legal
        let gratificacion = sueldoBase * 0.25;
        const topeGratificacion = (sueldoMinimo * 4.75) / 12;
        if (gratificacion > topeGratificacion) {
            gratificacion = topeGratificacion;
        }

        // FHE
        const factorBase = (28 / 30) / (horasLegales * 4);
        const fhe = factorBase * 1.5;
        const horasExtrasCalculadas = sueldoBase * fhe * horasExtras;

        // Sueldo bruto

        // agregar aguinaldo por UF de la fecha seleccionada

        const sueldoBruto = sueldoBase + gratificacion + horasExtrasCalculadas;
        console.log("Sueldo Bruto:", sueldoBruto);

        // Obtener tasa cesantía desde tabla afc (id = 1 = Plazo Indefinido)
        const [afcData] = await executeQuery('SELECT fi_trabajador FROM afc WHERE id = 1');
        const tasaCesantia = parseFloat(afcData?.fi_trabajador) || 0;

        // Descuentos (todos sobre sueldo bruto)
        const descuentoAFP = sueldoBruto * (tasaAFP / 100);
        const descuentoSalud = sueldoBruto * (planSalud / 100);
        const descuentoCesantia = sueldoBruto * (tasaCesantia / 100);

        console.log("Descuento AFP:", descuentoAFP);
        console.log("Descuento Salud:", descuentoSalud);
        console.log("Descuento Cesantía:", descuentoCesantia);

        const tablaIUSC = await executeQuery(`SELECT * FROM valores_iusc;`);
        //console.log("Tabla IUSC obtenida:", tablaIUSC);

        const utmData = await cmfClient.getCurrentUTM();
        if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UTM del mes para calcular el impuesto'
            });
        }

        const valorUTM = parseFloat(utmData.UTMs[0].Valor.replace(/\./g, '').replace(',', '.'));
        console.log("Valor UTM del mes:", valorUTM);


        // Convertir sueldo bruto a UTM
        const sueldoBrutoUTM = sueldoBruto / valorUTM;
        console.log("Sueldo bruto en UTM:", sueldoBrutoUTM);

        // Buscar el tramo correspondiente
        let tramoIUSC = null;
        for (const tramo of tablaIUSC) {
            const desdeUTM = parseFloat(tramo.desde_utm);
            const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;

            if (sueldoBrutoUTM > desdeUTM && sueldoBrutoUTM <= hastaUTM) {
                tramoIUSC = tramo;
                break;
            }
        }

        // Calcular impuesto si corresponde
        let impuestoIUSC = 0;
        if (tramoIUSC && tramoIUSC.tasa !== null) {
            const tasa = parseFloat(tramoIUSC.tasa);
            const rebajar = parseFloat(tramoIUSC.rebajar_utm);
            impuestoIUSC = (sueldoBrutoUTM * (tasa / 100) - rebajar) * valorUTM;
            impuestoIUSC = Math.max(0, impuestoIUSC); // Asegurar que no sea negativo
        }
        console.log("Impuesto IUSC:", impuestoIUSC);

        // Sueldo líquido
        const sueldoLiquido = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia - impuestoIUSC;
        console.log("Sueldo Líquido:", sueldoLiquido);

        // Respuesta
        return res.status(200).json({
            success: true,
            message: 'OK',
            result: {
                sueldoBruto,
                fhe,
                gratificacion,
                horasExtrasCalculadas,
                descuentoAFP,
                descuentoSalud,
                descuentoCesantia,
                impuestoIUSC,
                tramoImpuesto: tramoIUSC ? tramoIUSC.tramo : 0,
                sueldoLiquido
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
};



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