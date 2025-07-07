import axios from 'axios';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';


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

// ENDPOINT PARA ACTUALIZAR IUSC
const updateIUSCByTramo = async (req, res) => {
    const { tramo } = req.params;
    const { desde_utm, hasta_utm, tasa, rebajar_utm, tasa_maxima } = req.body;

    try {
        // Verificar si el tramo existe
        const [existingTramo] = await executeQuery(`
            SELECT * FROM valores_iusc WHERE tramo = ? LIMIT 1
        `, [tramo]);

        if (!existingTramo) {
            return res.status(404).json({
                success: false,
                message: `Tramo IUSC ${tramo} no encontrado`
            });
        }

        // Preparar campos a actualizar
        const updates = [];
        const values = [];

        if (desde_utm !== undefined) {
            updates.push('desde_utm = ?');
            values.push(desde_utm);
        }

        if (hasta_utm !== undefined) {
            updates.push('hasta_utm = ?');
            values.push(hasta_utm);
        }

        if (tasa !== undefined) {
            updates.push('tasa = ?');
            values.push(tasa);
        }

        if (rebajar_utm !== undefined) {
            updates.push('rebajar_utm = ?');
            values.push(rebajar_utm);
        }

        if (tasa_maxima !== undefined) {
            updates.push('tasa_maxima = ?');
            values.push(tasa_maxima);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        values.push(tramo);

        await executeQuery(`
            UPDATE valores_iusc SET ${updates.join(', ')} WHERE tramo = ?
        `, values);

        return res.status(200).json({
            success: true,
            message: `Tramo IUSC ${tramo} actualizado correctamente`,
            result: { tramo, desde_utm, hasta_utm, tasa, rebajar_utm, tasa_maxima }
        });
    } catch (err) {
        console.error(`Error actualizando tramo IUSC ${tramo}:`, err);
        return res.status(500).json({
            success: false,
            message: `Error actualizando tramo IUSC`,
            error: err.message
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



const updateAFCById = async (req, res) => {
    const { id } = req.params;
    const { fi_empleador, fi_trabajador } = req.body;

    try {
        // Verificar si el AFC existe
        const [existingAFC] = await executeQuery(`
            SELECT * FROM afc WHERE id = ? LIMIT 1
        `, [id]);

        if (!existingAFC) {
            return res.status(404).json({
                success: false,
                message: `AFC con ID ${id} no encontrado`
            });
        }

        // Preparar campos a actualizar
        const updates = [];
        const values = [];

        if (fi_empleador !== undefined) {
            updates.push('fi_empleador = ?');
            values.push(fi_empleador);
        }

        if (fi_trabajador !== undefined) {
            updates.push('fi_trabajador = ?');
            values.push(fi_trabajador);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        values.push(id);

        await executeQuery(`
            UPDATE afc SET ${updates.join(', ')} WHERE id = ?
        `, values);

        return res.status(200).json({
            success: true,
            message: `AFC actualizado correctamente`,
            result: { id, fi_empleador, fi_trabajador }
        });
    } catch (err) {
        console.error(`Error actualizando AFC ${id}:`, err);
        return res.status(500).json({
            success: false,
            message: `Error actualizando AFC`,
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
        let fecha = req.query.fecha;

        if (!fecha) {
            return res.status(400).json({
                success: false,
                message: "Debe proporcionar una fecha válida en formato YYYY-MM-DD"
            });
        }

        // Normalizar a primer día del mes
        const fechaObj = new Date(fecha);
        const fechaPrimerDiaMes = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), 1)
            .toISOString()
            .split('T')[0]; // "YYYY-MM-DD"

        const utmData = await cmfClient.getUTMbyDate(fechaPrimerDiaMes);

        if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UTM del mes'
            });
        }

        const utm = utmData.UTMs[0];
        console.log('✅ UTM del mes obtenida:', utm);

        return res.status(200).json({
            success: true,
            message: "Valor UTM del mes encontrado",
            result: {
                fecha: utm.Fecha,
                valor: utm.Valor
            }
        });
    } catch (err) {
        console.error('❌ Error obteniendo UTM del mes:', err);
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
        const response = await executeQuery('SELECT * FROM afp ORDER BY id');
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

// ENDPOINT PARA ACTUALIZAR AFP
const updateAFPById = async (req, res) => {
    const { id } = req.params;
    const { tasa, sis } = req.body;

    try {
        // Verificar si el AFP existe
        const [existingAFP] = await executeQuery(`
            SELECT * FROM afp WHERE id = ? LIMIT 1
        `, [id]);

        if (!existingAFP) {
            return res.status(404).json({
                success: false,
                message: `AFP con ID ${id} no encontrada`
            });
        }

        // Preparar campos a actualizar
        const updates = [];
        const values = [];

        if (tasa !== undefined) {
            updates.push('tasa = ?');
            values.push(tasa);
        }

        if (sis !== undefined) {
            updates.push('sis = ?');
            values.push(sis);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        values.push(id);

        await executeQuery(`
            UPDATE afp SET ${updates.join(', ')} WHERE id = ?
        `, values);

        return res.status(200).json({
            success: true,
            message: `AFP actualizada correctamente`,
            result: { id, tasa, sis }
        });
    } catch (err) {
        console.error(`Error actualizando AFP ${id}:`, err);
        return res.status(500).json({
            success: false,
            message: `Error actualizando AFP`,
            error: err.message
        });
    }
};

const calcularSueldoBaseDesdeNeto = async (req, res) => {
    try {
        const { sueldoLiquidoDeseado, horasExtras, diasTrabajados, afp } = req.body;

        console.log("Sueldo líquido deseado:", sueldoLiquidoDeseado);
        console.log("AFP ID:", afp);

        if (!sueldoLiquidoDeseado || isNaN(sueldoLiquidoDeseado)) {
            return res.status(400).json({ success: false, message: 'Sueldo líquido deseado inválido' });
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

        // Obtener tasa cesantía desde tabla afc (id = 1 = Plazo Indefinido)
        const [afcData] = await executeQuery('SELECT fi_trabajador FROM afc WHERE id = 1');
        const tasaCesantia = parseFloat(afcData?.fi_trabajador) || 0;

        // Obtener tabla IUSC
        const tablaIUSC = await executeQuery(`SELECT * FROM valores_iusc;`);

        // Obtener UTM actual
        const utmData = await cmfClient.getCurrentUTM();
        if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el valor de la UTM del mes para calcular el impuesto'
            });
        }

        const valorUTM = parseFloat(utmData.UTMs[0].Valor.replace(/\./g, '').replace(',', '.'));
        console.log("Valor UTM del mes:", valorUTM);

        // Cálculo iterativo para encontrar el sueldo base
        let sueldoBaseEstimado = sueldoLiquidoDeseado; // Estimación inicial
        let iteracion = 0;
        const maxIteraciones = 50;
        const tolerancia = 1; // Tolerancia de $1 peso

        while (iteracion < maxIteraciones) {
            // Calcular gratificación
            let gratificacion = sueldoBaseEstimado * 0.25;
            const topeGratificacion = (sueldoMinimo * 4.75) / 12;
            if (gratificacion > topeGratificacion) {
                gratificacion = topeGratificacion;
            }

            // Calcular FHE
            const factorBase = (28 / 30) / (horasLegales * 4);
            const fhe = factorBase * 1.5;
            const horasExtrasCalculadas = sueldoBaseEstimado * fhe * (horasExtras || 0);

            // Sueldo bruto
            const sueldoBruto = sueldoBaseEstimado + gratificacion + horasExtrasCalculadas;

            // Descuentos sobre sueldo bruto
            const descuentoAFP = sueldoBruto * (tasaAFP / 100);
            const descuentoSalud = sueldoBruto * (planSalud / 100);
            const descuentoCesantia = sueldoBruto * (tasaCesantia / 100);

            // Base tributable
            const baseTributable = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia;
            const baseTributableUTM = baseTributable / valorUTM;

            // Buscar tramo IUSC
            let tramoIUSC = null;
            for (const tramo of tablaIUSC) {
                const desdeUTM = parseFloat(tramo.desde_utm);
                const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;

                if (baseTributableUTM > desdeUTM && baseTributableUTM <= hastaUTM) {
                    tramoIUSC = tramo;
                    break;
                }
            }

            // Calcular impuesto IUSC
            let impuestoIUSC = 0;
            if (tramoIUSC && tramoIUSC.tasa !== null) {
                const tasa = parseFloat(tramoIUSC.tasa);
                const rebajar = parseFloat(tramoIUSC.rebajar_utm);
                impuestoIUSC = (baseTributableUTM * (tasa / 100) - rebajar) * valorUTM;
                impuestoIUSC = Math.max(0, impuestoIUSC);
            }

            // Sueldo líquido calculado
            const sueldoLiquidoCalculado = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia - impuestoIUSC;

            // Diferencia entre el deseado y el calculado
            const diferencia = sueldoLiquidoDeseado - sueldoLiquidoCalculado;

            console.log(`Iteración ${iteracion + 1}: Base=${sueldoBaseEstimado.toFixed(2)}, Líquido=${sueldoLiquidoCalculado.toFixed(2)}, Diferencia=${diferencia.toFixed(2)}`);

            // Si la diferencia es menor que la tolerancia, hemos encontrado la solución
            if (Math.abs(diferencia) <= tolerancia) {
                console.log("Convergencia alcanzada en iteración:", iteracion + 1);

                return res.status(200).json({
                    success: true,
                    message: 'Cálculo inverso completado',
                    result: {
                        sueldoBaseNecesario: Math.round(sueldoBaseEstimado),
                        sueldoBruto,
                        fhe,
                        gratificacion,
                        horasExtrasCalculadas,
                        descuentoAFP,
                        descuentoSalud,
                        descuentoCesantia,
                        impuestoIUSC,
                        tramoImpuesto: tramoIUSC ? tramoIUSC.tramo : 0,
                        sueldoLiquidoObtenido: sueldoLiquidoCalculado,
                        sueldoLiquidoDeseado,
                        diferencia: Math.abs(diferencia),
                        iteraciones: iteracion + 1,
                        baseTributable,
                        leyesSociales: descuentoAFP + descuentoSalud + descuentoCesantia,
                        totalDescuentos: descuentoAFP + descuentoSalud + descuentoCesantia + impuestoIUSC
                    }
                });
            }

            // Ajustar estimación para próxima iteración
            // Factor de ajuste conservador para evitar oscilaciones
            const factorAjuste = 0.8;
            sueldoBaseEstimado += diferencia * factorAjuste;

            // Asegurar que el sueldo base no sea negativo
            if (sueldoBaseEstimado < 0) {
                sueldoBaseEstimado = sueldoLiquidoDeseado * 0.5;
            }

            iteracion++;
        }

        // Si no converge en el número máximo de iteraciones
        return res.status(400).json({
            success: false,
            message: `No se pudo calcular el sueldo base después de ${maxIteraciones} iteraciones. Intente con un valor diferente.`,
            ultimaEstimacion: sueldoBaseEstimado
        });

    } catch (err) {
        console.error('Error calculando sueldo base desde neto:', err);
        return res.status(500).json({
            success: false,
            message: 'Error calculando sueldo base desde neto',
            error: err.message
        });
    }
};
const calcularLiquidacion = async (req, res) => {
    try {
        const {
            sueldoBase,
            horasExtras,
            diasTrabajados,
            afp,
            tipoContrato,
            montoAnticipo = 0,
            aceptarExcesoAnticipo = false,
            fecha,
            valorUTM // ✅ RECIBIR VALOR UTM DEL FRONTEND
        } = req.body;

        if (!sueldoBase || isNaN(sueldoBase)) {
            return res.status(400).json({ success: false, message: 'Sueldo base inválido' });
        }

        const diasTrab = diasTrabajados && diasTrabajados > 0 ? diasTrabajados : 30;
        const sueldoBaseProrrateado = (sueldoBase / 30) * diasTrab;

        // Obtener datos de AFP
        const [afpData] = await executeQuery('SELECT * FROM afp WHERE id = ?', [afp]);
        if (!afpData) {
            return res.status(400).json({ success: false, message: 'AFP no encontrada' });
        }
        const tasaAFP = parseFloat(afpData.tasa);

        // Obtener índices
        const indices = await executeQuery(`
            SELECT nombre, valor FROM indices_comerciales
            WHERE nombre IN ("horas_legales", "rmi_general", "plan_salud");
        `);
        const getIndice = (nombre) => parseFloat(indices.find(i => i.nombre === nombre)?.valor || 0);

        const horasLegales = getIndice("horas_legales");
        const sueldoMinimo = getIndice("rmi_general");
        const planSalud = getIndice("plan_salud");

        // 1 Gratificación mensual para determinar tramo IUSC
        let gratificacionMensual = sueldoBase * 0.25;
        const topeGratificacionMensual = (sueldoMinimo * 4.75) / 12;
        if (gratificacionMensual > topeGratificacionMensual) {
            gratificacionMensual = topeGratificacionMensual;
        }
        const sueldoBrutoMensualPactado = sueldoBase + gratificacionMensual;
        console.log("SUELDO BRUTO PACTADO : ", sueldoBrutoMensualPactado)

        // 2 FHE (Horas extras siempre sobre sueldo mensual pactado)
        const factorBase = (28 / 30) / (horasLegales * 4);
        const fhe = factorBase * 1.5;
        const horasExtrasCalculadas = sueldoBase * fhe * horasExtras;

        // 3️ Obtener tasa cesantía
        const tipoContratoId = (tipoContrato === 2) ? 2 : 1;

        // Consultar tasa de cesantía según tipo de contrato
        const [afcData] = await executeQuery('SELECT fi_trabajador FROM afc WHERE id = ?', [tipoContratoId]);
        const tasaCesantia = parseFloat(afcData?.fi_trabajador) || 0;

        // 4 Obtener UTM - USAR EL VALOR DEL FRONTEND SI EXISTE
        let valorUTMFinal;

        if (valorUTM && !isNaN(valorUTM) && valorUTM > 0) {
            // ✅ USAR UTM DEL FRONTEND
            valorUTMFinal = parseFloat(valorUTM);
            console.log("Usando UTM del frontend:", valorUTMFinal);
        } else {
            // ❌ FALLBACK: calcular UTM del backend (como antes)
            let fechaParaUTM = new Date();
            if (fecha) {
                const fechaObj = new Date(fecha);
                fechaParaUTM = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), 1);
            }
            const fechaFormateada = fechaParaUTM.toISOString().split('T')[0];

            const utmData = await cmfClient.getUTMbyDate(fechaFormateada);
            if (!utmData || !utmData.UTMs || utmData.UTMs.length === 0) {
                return res.status(404).json({ success: false, message: 'No se encontró el valor de la UTM del mes' });
            }
            valorUTMFinal = parseFloat(utmData.UTMs[0].Valor.replace(/\./g, '').replace(',', '.'));
            console.log("Usando UTM del backend:", valorUTMFinal);
        }
        console.log("tasas : ");
        console.log("tasa cesantia : ", tasaCesantia);
        console.log("plan salud : ", planSalud);
        console.log("tasaa de afp : ", tasaAFP);
        // 5 Calcular tramo IUSC sobre base mensual pactada
        const baseTributableMensual = sueldoBrutoMensualPactado
            - (sueldoBrutoMensualPactado * (tasaAFP / 100))
            - (sueldoBrutoMensualPactado * (planSalud / 100))
            - (sueldoBrutoMensualPactado * (tasaCesantia / 100));

        console.log("base tributable mensual : ", baseTributableMensual);
        console.log("valor UTM final : ", valorUTMFinal);
        const baseTributableUTM = baseTributableMensual / valorUTMFinal;
        console.log("base tributable UTM : ", baseTributableUTM);

        const tablaIUSC = await executeQuery(`SELECT * FROM valores_iusc;`);
        let tramoIUSC = null;
        for (const tramo of tablaIUSC) {
            const desdeUTM = parseFloat(tramo.desde_utm);
            const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;
            if (baseTributableUTM > desdeUTM && baseTributableUTM <= hastaUTM) {
                tramoIUSC = tramo;
                break;
            }
        }

        let impuestoIUSC = 0;
        if (tramoIUSC && tramoIUSC.tasa !== null) {
            const tasa = parseFloat(tramoIUSC.tasa);
            const rebajar = parseFloat(tramoIUSC.rebajar_utm);
            console.log("rebajar UTM : ", rebajar);
            impuestoIUSC = (baseTributableUTM * (tasa / 100) - rebajar) * valorUTMFinal;
            impuestoIUSC = Math.max(0, impuestoIUSC);
        }
        console.log("utm valor : ", valorUTM);
        console.log("tramo IUSC : ", tramoIUSC);
        console.log("base tributable UTM : ", baseTributableUTM);

        console.log("impuesto IUSC : ", impuestoIUSC);

        // 6 Ahora sí: calcular gratificación prorrateada real
        let gratificacion = sueldoBaseProrrateado * 0.25;
        const topeGratificacion = (sueldoMinimo * 4.75) / 12;
        if (gratificacion > topeGratificacion) {
            gratificacion = topeGratificacion;
        }
        console.log("gratificacion : ", gratificacion);

        // 7 Sueldo Bruto devengado real
        const sueldoBruto = sueldoBaseProrrateado + gratificacion + horasExtrasCalculadas;
        console.log("sueldo bruto real con proraeteo : ", sueldoBruto);

        // 8 Descuentos sobre sueldo bruto devengado
        const descuentoAFP = sueldoBruto * (tasaAFP / 100);
        console.log("descuentos AFP : ", descuentoAFP);
        const descuentoSalud = sueldoBruto * (planSalud / 100);
        console.log("descuentos SALUD : ", descuentoSalud);
        const descuentoCesantia = sueldoBruto * (tasaCesantia / 100);
        console.log("descuento cesantia : ", descuentoCesantia);
        const leyesSociales = descuentoAFP + descuentoSalud + descuentoCesantia;
        console.log("leyes sociales : ", leyesSociales);

        // 9 Sueldo líquido inicial
        let sueldoLiquido = sueldoBruto - leyesSociales - impuestoIUSC;
        console.log("sueldo liquido: ", sueldoLiquido);

        // 10 Anticipo
        let anticipo = 0;
        let porcentajeAnticipo = 0;
        let errorAnticipo = null;
        if (montoAnticipo > 0) {
            porcentajeAnticipo = (montoAnticipo / sueldoLiquido) * 100;
            if (porcentajeAnticipo < 15) {
                errorAnticipo = 'El anticipo debe ser al menos un 15% del sueldo líquido.';
            } else if (porcentajeAnticipo > 25 && !aceptarExcesoAnticipo) {
                errorAnticipo = 'El anticipo supera el 25% y no fue autorizado.';
            }
            anticipo = Math.round(montoAnticipo);
            sueldoLiquido -= anticipo;
        }

        // 11 Base tributable real devengado (solo referencia contable)
        const baseTributable = sueldoBruto - leyesSociales;

        // 12 Total descuentos
        const totalDescuentos = leyesSociales + impuestoIUSC + anticipo;

        // ✅ Respuesta final
        return res.status(200).json({
            success: true,
            message: 'OK',
            result: {
                sueldoBaseProrrateado,
                sueldoBruto,
                fhe,
                gratificacion,
                horasExtrasCalculadas,
                descuentoAFP,
                descuentoSalud,
                descuentoCesantia,
                impuestoIUSC,
                tramoImpuesto: tramoIUSC ? tramoIUSC.tramo : 0,
                sueldoLiquido,
                baseTributable,
                leyesSociales,
                totalDescuentos
            }
        });

    } catch (err) {
        console.error('Error calculando liquidación:', err);
        return res.status(500).json({ success: false, message: 'Error calculando liquidación', error: err.message });
    }
};


const guardarLiquidacionesMensuales = async (resultados, mes, anio) => {
    const idsLiquidaciones = [];

    try {
        for (const resultado of resultados) {
            const {
                userId,
                sueldoBruto,
                sueldoLiquidoAPagar,
                totalDescuentos,
                gratificacion,
                aguinaldoCLP,
                anticipo,
                prestamo,
                impuestoIUSC
            } = resultado;

            // Verificar si ya existe un registro exactamente igual
            const [existing] = await executeQuery(`
                SELECT * FROM liquidaciones_mensuales
                WHERE id_usuario = ? AND mes = ? AND anio = ?
                AND sueldo_bruto = ? AND sueldo_liquido = ? AND total_descuentos = ?
                AND gratificacion = ? AND aguinaldo = ? AND anticipo = ?
                AND prestamo = ? AND impuesto_iusc = ?
            `, [
                userId,
                mes,
                anio,
                sueldoBruto,
                sueldoLiquidoAPagar,
                totalDescuentos,
                gratificacion,
                aguinaldoCLP,
                anticipo,
                prestamo,
                impuestoIUSC
            ]);

            if (!existing) {
                // Insertar solo si no existe un registro exactamente igual
                const insert = await executeQuery(`
                    INSERT INTO liquidaciones_mensuales 
                    (id_usuario, mes, anio, sueldo_bruto, sueldo_liquido, total_descuentos, gratificacion, aguinaldo, anticipo, prestamo, impuesto_iusc)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId,
                    mes,
                    anio,
                    sueldoBruto,
                    sueldoLiquidoAPagar,
                    totalDescuentos,
                    gratificacion,
                    aguinaldoCLP,
                    anticipo,
                    prestamo,
                    impuestoIUSC
                ]);

                idsLiquidaciones.push({ userId, insertId: insert.insertId });
            } else {
                console.log(`Ya existe un registro idéntico para el usuario ${userId} en ${mes}/${anio}. No se inserta duplicado.`);
            }
        }

        console.log(" Proceso de liquidaciones completado con historial.");
        return idsLiquidaciones;

    } catch (error) {
        console.error(" Error al guardar liquidaciones mensuales:", error.message);
        return [];
    }
};

const eliminarLiquidaciones = async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No se recibieron IDs válidos para eliminar.' });
    }

    try {
        // Construir placeholders dinámicos (?, ?, ?, ...)
        const placeholders = ids.map(() => '?').join(',');

        await executeQuery(
            `DELETE FROM liquidaciones_mensuales WHERE id IN (${placeholders})`,
            ids
        );

        return res.status(200).json({
            success: true,
            message: `Se eliminaron ${ids.length} liquidaciones correctamente.`
        });
    } catch (error) {
        console.error("❌ Error al eliminar liquidaciones:", error.message);
        return res.status(500).json({ success: false, message: 'Error interno al eliminar liquidaciones.' });
    }
};



// SOLUCIÓN TEMPORAL: Buscar usuario por ID en lugar de RUT encriptado
// Modifica tu función calcularLiquidacionesMultiples para usar el ID del usuario

const calcularLiquidacionesMultiples = async (req, res) => {
    try {
        //console.log("=== INICIO calcularLiquidacionesMultiples ===");
        const { trabajadores, valorUF } = req.body;

        if (!Array.isArray(trabajadores) || trabajadores.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar una lista de trabajadores válida' });
        }

        const afps = await executeQuery('SELECT * FROM afp');
        const afc = await executeQuery('SELECT fi_trabajador FROM afc WHERE id = 1');
        const indices = await executeQuery(`
            SELECT nombre, valor FROM indices_comerciales
            WHERE nombre IN ("horas_legales", "rmi_general", "plan_salud");
        `);
        const tablaIUSC = await executeQuery(`SELECT * FROM valores_iusc`);
        let fechaParaUTM = new Date(); // por defecto: hoy

        if (req.body.fecha) {
            const fechaObj = new Date(req.body.fecha);
            fechaParaUTM = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), 1); // primer día del mes
        }

        const fechaFormateada = fechaParaUTM.toISOString().split('T')[0];

        const utmData = await cmfClient.getUTMbyDate(fechaFormateada);

        if (!utmData?.UTMs?.length) {
            return res.status(404).json({ success: false, message: 'No se encontró el valor de la UTM para la fecha indicada' });
        }


        if (!valorUF || isNaN(valorUF)) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar el valor de la UF' });
        }

        // Cargar índices
        const getIndice = (nombre) => {
            const indice = indices.find(i => i.nombre === nombre);
            return parseFloat(indice?.valor || 0);
        };

        const horasLegales = getIndice("horas_legales");
        const sueldoMinimo = getIndice("rmi_general");
        const planSalud = getIndice("plan_salud");
        const tasaCesantia = parseFloat(afc[0]?.fi_trabajador || 0);
        const valorUTM = parseFloat(utmData.UTMs[0].Valor.replace(/\./g, '').replace(',', '.'));

        const resultados = [];
        const errores = [];
        const advertencias = [];

        for (const trabajador of trabajadores) {
            const {
                sueldoBase: sueldoBaseRaw,
                horasExtras = 0,
                diasTrabajados = 30,
                afp: afpId,
                rut,
                nombre,
                userId,
                prestamo = 0,
                anticipo = 0,
                aguinaldoUF = 0
            } = trabajador;

            const sueldoBase = parseFloat(sueldoBaseRaw || 0);
            const horasExtrasNum = parseFloat(horasExtras || 0);
            const diasTrabajadosNum = parseInt(diasTrabajados || 30);
            const anticipoNum = parseFloat(anticipo || 0);

            // Validaciones
            if (!sueldoBase || isNaN(sueldoBase) || sueldoBase <= 0) {
                errores.push({ rut, nombre, error: "Sueldo base inválido" });
                continue;
            }

            if (!userId) {
                errores.push({ rut, nombre, error: "ID de usuario requerido" });
                continue;
            }

            const afp = afps.find(a => a.id == afpId);
            if (!afp) {
                errores.push({ rut, nombre, error: `AFP no válida o no encontrada (ID: ${afpId})` });
                continue;
            }
            const tasaAFP = parseFloat(afp.tasa || 0);

            // Cálculo del aguinaldo
            const aguinaldoUFNum = parseFloat(aguinaldoUF || 0);
            let aguinaldoCLP = 0;
            let aguinaldoUFValido = 0;

            if (aguinaldoUFNum >= 0 && aguinaldoUFNum <= 15 && valorUF > 0) {// cambio de rango de aguinaldo de 0 a 15 UF
                aguinaldoUFValido = aguinaldoUFNum;
                aguinaldoCLP = aguinaldoUFValido * valorUF;
            } else if (aguinaldoUFNum > 0) {
                advertencias.push({
                    rut,
                    nombre,
                    mensaje: `El aguinaldo de ${aguinaldoUFNum} UF está fuera del rango típico (3-5 UF).`,
                    tipo: 'aguinaldo_atipico'
                });
            }

            /* console.log("logs aguinaldo:");
             console.log("uf", valorUF);
             console.log("aguinaldoufNum : ", aguinaldoUFNum);
             console.log("aguinaldoCLP : ", aguinaldoCLP);*/

            // BLOQUE DE ACTUALIZACIÓN DE SUELDO BASE
            try {
                console.log(`🔍 Actualizando sueldo para usuario ID: ${userId} (RUT: ${rut}, Nombre: ${nombre})`);

                const updateResult = await executeQuery(`
                    UPDATE contrato SET sueldo_base = ?
                    WHERE id_usuario = ?
                `, [sueldoBase, userId]);

                console.log(`✅ Sueldo actualizado a ${sueldoBase} para usuario ID: ${userId}. Filas afectadas: ${updateResult.affectedRows || 0}`);

                if (updateResult.affectedRows === 0) {
                    console.warn(`⚠️ No se encontró contrato para el usuario ID: ${userId}`);
                }

            } catch (err) {
                console.error(`❌ Error en actualización sueldo para usuario ID ${userId}:`, err.message);
            }

            // Obtener préstamos existentes
            const prestamos = await executeQuery(`
                SELECT monto_total FROM prestamos_contrato WHERE id_contrato = ?
            `, [userId]);

            const totalPrestamos = prestamos.reduce((sum, prestamo) => sum + parseFloat(prestamo.monto_total), 0);




            // 1️⃣ PASO 1: CÁLCULO DEL SUELDO BRUTO
            //console.log("=== PASO 1: SUELDO BRUTO ===");

            // Prorrateo del sueldo base
            const sueldoBaseProrrateado = (sueldoBase / 30) * diasTrabajadosNum;
            //console.log("Sueldo Base Prorrateado:", sueldoBaseProrrateado);

            // Gratificación prorrateada
            let gratificacion = sueldoBaseProrrateado * 0.25;
            const topeGratificacion = (sueldoMinimo * 4.75) / 12;
            if (gratificacion > topeGratificacion) {
                gratificacion = topeGratificacion;
            }
            //console.log("Gratificación:", gratificacion);

            // Horas extras
            const factorBase = (28 / 30) / (horasLegales * 4);
            const fhe = factorBase * 1.5;
            const horasExtrasCalculadas = sueldoBase * fhe * horasExtrasNum;
            // console.log("Horas Extras Calculadas:", horasExtrasCalculadas);

            // Sueldo bruto total
            const sueldoBruto = sueldoBaseProrrateado + gratificacion + horasExtrasCalculadas + aguinaldoCLP;
            // console.log("SUELDO BRUTO TOTAL:", sueldoBruto);

            // 2️⃣ PASO 2: CÁLCULO DE DESCUENTOS LEGALES
            // console.log("=== PASO 2: DESCUENTOS LEGALES ===");

            // Descuentos previsionales
            const descuentoAFP = sueldoBruto * (tasaAFP / 100);
            //console.log("Descuento AFP:", descuentoAFP);

            const descuentoSalud = sueldoBruto * (planSalud / 100);
            //console.log("Descuento Salud:", descuentoSalud);

            const descuentoCesantia = sueldoBruto * (tasaCesantia / 100);
            //console.log("Descuento Cesantía:", descuentoCesantia);

            // Cálculo del impuesto IUSC
            // Para IUSC usamos gratificación mensual completa (no prorrateada)
            let gratificacionMensual = sueldoBase * 0.25;
            const topeGratificacionMensual = (sueldoMinimo * 4.75) / 12;
            if (gratificacionMensual > topeGratificacionMensual) {
                gratificacionMensual = topeGratificacionMensual;
            }
            const sueldoBrutoMensualPactado = sueldoBase + gratificacionMensual;

            const baseTributableMensual = sueldoBrutoMensualPactado
                - (sueldoBrutoMensualPactado * (tasaAFP / 100))
                - (sueldoBrutoMensualPactado * (planSalud / 100))
                - (sueldoBrutoMensualPactado * (tasaCesantia / 100));

            const baseTributableUTM = baseTributableMensual / valorUTM;

            let tramoIUSC = null;
            for (const tramo of tablaIUSC) {
                const desdeUTM = parseFloat(tramo.desde_utm || 0);
                const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;
                if (baseTributableUTM > desdeUTM && baseTributableUTM <= hastaUTM) {
                    tramoIUSC = tramo;
                    break;
                }
            }

            let impuestoIUSC = 0;
            if (tramoIUSC?.tasa != null) {
                const tasa = parseFloat(tramoIUSC.tasa || 0);
                const rebajar = parseFloat(tramoIUSC.rebajar_utm || 0);
                impuestoIUSC = (baseTributableUTM * (tasa / 100) - rebajar) * valorUTM;
                impuestoIUSC = Math.max(0, impuestoIUSC);
            }
            // console.log("valor UTM:", valorUTM);
            //console.log("Impuesto IUSC:", impuestoIUSC);

            // Total descuentos legales
            const totalDescuentosLegales = descuentoAFP + descuentoSalud + descuentoCesantia + impuestoIUSC;
            //console.log("TOTAL DESCUENTOS LEGALES:", totalDescuentosLegales);

            // 3️⃣ PASO 3: SUELDO LÍQUIDO LEGAL (después de descuentos legales)
            const sueldoLiquidoLegal = sueldoBruto - totalDescuentosLegales;
            //console.log("SUELDO LÍQUIDO LEGAL:", sueldoLiquidoLegal);

            // 4️⃣ PASO 4: DESCUENTOS DEL MES
            // console.log("=== PASO 4: DESCUENTOS DEL MES ===");

            const descuentoPrestamo = totalPrestamos;
            //console.log("Descuento Préstamo:", descuentoPrestamo);

            const descuentoAnticipo = anticipoNum;
            //console.log("Descuento Anticipo:", descuentoAnticipo);

            const descuentoAguinaldo = aguinaldoCLP;
            //console.log("Descuento Aguinaldo:", descuentoAguinaldo);
            const totalDescuentosMes = descuentoPrestamo + descuentoAnticipo + descuentoAguinaldo;
            // console.log("TOTAL DESCUENTOS DEL MES:", totalDescuentosMes);

            // 5️⃣ PASO 5: SUELDO LÍQUIDO A PAGAR (final)
            const sueldoLiquidoAPagar = sueldoLiquidoLegal - totalDescuentosMes;
            //console.log("SUELDO LÍQUIDO A PAGAR:", sueldoLiquidoAPagar);

            // Validaciones de anticipo (como advertencias, no errores)
            const porcentajeAnticipo = anticipoNum > 0 ? (anticipoNum / sueldoBase) * 100 : 0;
            //console.log("Porcentaje Anticipo:", porcentajeAnticipo);

            if (porcentajeAnticipo > 25) {
                advertencias.push({
                    rut,
                    nombre,
                    mensaje: `El anticipo (${porcentajeAnticipo.toFixed(2)}%) excede el 25% permitido. Requiere autorización especial.`,
                    tipo: 'anticipo_excesivo'
                });
            }

            if (porcentajeAnticipo > 0 && porcentajeAnticipo < 15) {
                advertencias.push({
                    rut,
                    nombre,
                    mensaje: `El anticipo (${porcentajeAnticipo.toFixed(2)}%) está por debajo del mínimo sugerido (15%).`,
                    tipo: 'anticipo_bajo'
                });
            }

            // Para compatibilidad, mantenemos algunos campos calculados
            const baseTributable = sueldoBruto - (descuentoAFP + descuentoSalud + descuentoCesantia);
            const leyesSociales = descuentoAFP + descuentoSalud + descuentoCesantia;
            const totalDescuentos = totalDescuentosLegales + totalDescuentosMes + descuentoAguinaldo; // Total general

            const resultado = {
                rut,
                nombre: nombre || 'Sin nombre',
                userId,
                sueldoBase,
                sueldoBaseProrrateado: Math.round(sueldoBaseProrrateado * 100) / 100,
                sueldoBruto: Math.round(sueldoBruto * 100) / 100,
                fhe: Math.round(fhe * 1000000) / 1000000,
                gratificacion: Math.round(gratificacion * 100) / 100,
                horasExtrasCalculadas: Math.round(horasExtrasCalculadas * 100) / 100,

                // Descuentos legales individuales
                descuentoAFP: Math.round(descuentoAFP * 100) / 100,
                descuentoSalud: Math.round(descuentoSalud * 100) / 100,
                descuentoCesantia: Math.round(descuentoCesantia * 100) / 100,
                impuestoIUSC: Math.round(impuestoIUSC * 100) / 100,

                // ✅ NUEVOS CAMPOS: Totales por categoría
                totalDescuentosLegales: Math.round(totalDescuentosLegales * 100) / 100,
                sueldoLiquidoLegal: Math.round(sueldoLiquidoLegal * 100) / 100,

                // Descuentos del mes
                prestamo: Math.round(descuentoPrestamo * 100) / 100,
                anticipo: Math.round(descuentoAnticipo * 100) / 100,
                descuentoAguinaldo: Math.round(descuentoAguinaldo * 100) / 100,
                totalDescuentosMes: Math.round(totalDescuentosMes * 100) / 100,

                // ✅ CAMPO PRINCIPAL: Sueldo final a pagar
                sueldoLiquidoAPagar: Math.round(sueldoLiquidoAPagar * 100) / 100,

                // Campos para compatibilidad (mantener para no romper frontend)
                sueldoLiquido: Math.round(sueldoLiquidoAPagar * 100) / 100, // Alias del campo principal
                leyesSociales: Math.round(leyesSociales * 100) / 100,
                totalDescuentos: Math.round(totalDescuentos * 100) / 100,
                baseTributable: Math.round(baseTributable * 100) / 100,

                tramoImpuesto: tramoIUSC?.tramo || 0,
                porcentajeAnticipo: Math.round(porcentajeAnticipo * 100) / 100,

                // Información del aguinaldo
                aguinaldoUF: aguinaldoUFValido,
                aguinaldoCLP: Math.round(aguinaldoCLP * 100) / 100,

                // Información de AFP
                afp: afpId,
                afpNombre: afp.nombre,
                afpTasa: afp.tasa,

                // Otros campos
                diasTrabajados: diasTrabajadosNum,
                horasExtras: horasExtrasNum,
                cargo: trabajador.cargo || 'EMPLEADO'
            };

            resultados.push(resultado);
        }

        console.log(`=== FIN calcularLiquidacionesMultiples - Procesados: ${resultados.length}, Errores: ${errores.length}, Advertencias: ${advertencias.length} ===`);

        // Guardar en la tabla y obtener IDs
        const idsGuardados = await guardarLiquidacionesMensuales(resultados, new Date().getMonth() + 1, new Date().getFullYear());

        // Asociar cada resultado con su ID insertado
        resultados.forEach(resultado => {
            const match = idsGuardados.find(r => r.userId === resultado.userId);
            if (match) {
                resultado.idLiquidacion = match.insertId;
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Cálculo completado',
            result: resultados,
            errores,
            advertencias
        });


    } catch (err) {
        console.error('❌ ERROR GENERAL en calcularLiquidacionesMultiples:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor', error: err.message });
    }
};

const obtenerHistorialLiquidaciones = async (req, res) => {
    try {
        const resultados = await executeQuery(`
      SELECT 
          lm.id AS id_liquidacion,
          lm.id_usuario,
          dp.nombre AS nombre,
          dp.rut,
          lm.mes,
          lm.anio,
          lm.version, -- versión de la liquidación
          lm.sueldo_bruto,
          lm.sueldo_liquido,
          lm.total_descuentos,
          lm.gratificacion,
          lm.aguinaldo,
          lm.anticipo,
          lm.prestamo,
          lm.impuesto_iusc,
          lm.fecha_creacion,
          pdf.id AS pdf_id,
          pdf.nombre_archivo,
          LENGTH(pdf.contenido) AS pdf_tamano,
          pdf.fecha_subida
      FROM liquidaciones_mensuales lm
      JOIN usuario u ON u.id = lm.id_usuario
      JOIN datos_personales dp ON dp.id_usuario = u.id
      LEFT JOIN pdf_liquidaciones pdf ON pdf.id_liquidacion = lm.id
      ORDER BY dp.nombre, lm.anio DESC, lm.mes DESC, lm.fecha_creacion DESC
    `);

        const historialAgrupado = [];

        for (const row of resultados) {
            const index = historialAgrupado.findIndex(u => u.id_usuario === row.id_usuario);

            const liquidacion = {
                id: row.id_liquidacion,
                mes: row.mes,
                anio: row.anio,
                sueldo_bruto: row.sueldo_bruto,
                sueldo_liquido: row.sueldo_liquido,
                total_descuentos: row.total_descuentos,
                pdf_id: row.pdf_id,
                nombre_archivo: row.nombre_archivo,
                pdf_tamano: row.pdf_tamano,
                fecha_subida: row.fecha_subida,
                fecha_creacion: row.fecha_creacion,
            };

            if (index === -1) {
                historialAgrupado.push({
                    id_usuario: row.id_usuario,
                    nombre: row.nombre,
                    rut: row.rut,
                    liquidaciones: [liquidacion]
                });
            } else {
                historialAgrupado[index].liquidaciones.push(liquidacion);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Historial agrupado obtenido correctamente',
            data: historialAgrupado
        });

    } catch (err) {
        console.error('❌ Error al obtener historial agrupado:', err.message);
        return res.status(500).json({ success: false, message: 'Error interno', error: err.message });
    }
};






//calculo cotizaciones 


// Controlador para calcular la cotización de la empresa (prorrateado correctamente)
const calcularCotizacionEmpresa = async (req, res) => {
    try {
        const { sueldoBase, horasExtras, afp, valorUF, montoExamenes, aguinaldoUF, costosVarios, tipoContrato } = req.body;

        // Validar y sumar costos varios
        let totalCostosVarios = 0;
        let costosVariosValidados = [];

        if (Array.isArray(costosVarios)) {
            costosVariosValidados = costosVarios.filter(item =>
                item && typeof item.monto === 'number' && !isNaN(item.monto)
            );
            totalCostosVarios = costosVariosValidados.reduce((sum, item) => sum + item.monto, 0);
        }

        // Validaciones de sueldo base y UF
        if (!sueldoBase || isNaN(sueldoBase)) {
            return res.status(400).json({ success: false, message: 'Sueldo base inválido' });
        }
        if (!valorUF || isNaN(valorUF)) {
            return res.status(400).json({ success: false, message: 'Valor UF inválido' });
        }

        // Obtener datos de AFP (tasa y SIS)
        const [afpData] = await executeQuery('SELECT tasa, sis FROM afp WHERE id = ?', [afp]);
        if (!afpData) {
            return res.status(400).json({ success: false, message: 'AFP no encontrada' });
        }
        const tasaSIS = parseFloat(afpData.sis);

        // Determinar el ID de AFC según el tipo de contrato
        const afcId = tipoContrato == 1 ? 1 : 2;

        // Obtener la tasa AFC del empleador según corresponda
        const [afcData] = await executeQuery('SELECT fi_empleador FROM afc WHERE id = ?', [afcId]);

        if (!afcData) {
            return res.status(400).json({ success: false, message: 'AFC no encontrada para el tipo de contrato' });
        }

        const tasaAFC = parseFloat(afcData.fi_empleador);
        // Obtener índices legales
        const indices = await executeQuery(`
            SELECT nombre, valor FROM indices_comerciales
            WHERE nombre IN ("horas_legales", "rmi_general");
        `);
        const getIndice = (nombre) => parseFloat(indices.find(i => i.nombre === nombre)?.valor || 0);
        const horasLegales = getIndice("horas_legales");
        const sueldoMinimo = getIndice("rmi_general");

        // Gratificación legal prorrateada
        let gratificacion = sueldoBase * 0.25;
        const topeGratificacion = (sueldoMinimo * 4.75) / 12;
        if (gratificacion > topeGratificacion) gratificacion = topeGratificacion;

        // Horas extras prorrateadas
        const factorBase = (28 / 30) / (horasLegales * 4);
        const fhe = factorBase * 1.5;
        const horasExtrasCalculadas = sueldoBase * fhe * horasExtras;

        // Sueldo bruto mensual
        const sueldoBruto = sueldoBase + gratificacion + horasExtrasCalculadas;

        // Cotizaciones legales empresa (proporcionales al mes)
        const cotizacionSIS = sueldoBruto * (tasaSIS / 100);
        const cotizacionAFC = sueldoBruto * (tasaAFC / 100);
        const cotizacionMutual = sueldoBruto * 0.0093;

        // Vacaciones proporcionales (prorrateadas mensual)
        const vacacionesProporcionales = (sueldoBase * 2) / 30;

        // Exámenes preocupacionales prorrateados mensual
        const examenesPreocupacionales = isNaN(montoExamenes) ? 35000 : parseFloat(montoExamenes);

        // Indemnización anual por año de servicio prorrateada
        let years = 10; // valor fijo de prueba
        const totalHaberesUF = sueldoBruto / valorUF;
        let IAS = Math.min(totalHaberesUF, 90) / 8;
        IAS = IAS * valorUF; // lo expresamos mensualizado

        // Aguinaldo mensual prorrateado
        let aguinaldoMensual = 0;
        let aguinaldoCLP = 0;
        let aguinaldoUFValido = 0;

        if (!isNaN(aguinaldoUF) && parseFloat(aguinaldoUF) >= 0 && parseFloat(aguinaldoUF) <= 15) {// cambio de rango de aguinaldo de 0 a 15 UF
            aguinaldoUFValido = parseFloat(aguinaldoUF);
            aguinaldoCLP = aguinaldoUFValido * valorUF;
            aguinaldoMensual = aguinaldoCLP / 12;
        }

        // Costo mensual empresa prorrateado
        const costoEmpresa = sueldoBruto + cotizacionSIS + cotizacionAFC + cotizacionMutual
            + vacacionesProporcionales + examenesPreocupacionales + IAS + aguinaldoMensual + totalCostosVarios;

        // Cálculos de sobrecarga administrativa
        const GastosGenerales = costoEmpresa * 0.10;
        const Administracion = costoEmpresa * 0.05;
        const Utilidad = costoEmpresa * 0.05;

        const costoTotalFinal = costoEmpresa + GastosGenerales + Administracion + Utilidad;

        return res.status(200).json({
            success: true,
            message: 'Cotización empresa calculada correctamente',
            result: {
                sueldoBruto,
                gratificacion,
                horasExtrasCalculadas,
                cotizacionSIS,
                cotizacionAFC,
                cotizacionMutual,
                vacacionesProporcionales,
                examenesPreocupacionales,
                IAS,
                aguinaldoUF: aguinaldoUFValido,
                aguinaldoCLP,
                aguinaldoMensual,
                totalCostosVarios,
                costosVarios: costosVariosValidados,
                costoEmpresa,
                GastosGenerales,
                Administracion,
                Utilidad,
                costoTotalFinal
            }
        });

    } catch (error) {
        console.error('Error en calcularCotizacionEmpresa:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en cálculo de cotización',
            error: error.message
        });
    }
};



// Crear un préstamo interno calculando automáticamente la cantidad de cuotas
const crearPrestamoInterno = async (req, res) => {
    try {
        const { nombre_credito, monto_total, monto_cuota, fecha_inicio } = req.body;

        // Validaciones básicas
        if (!nombre_credito || !monto_total || !monto_cuota || !fecha_inicio) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        const monto = parseFloat(monto_total);
        const cuota = parseFloat(monto_cuota);

        if (isNaN(monto) || isNaN(cuota) || monto <= 0 || cuota <= 0) {
            return res.status(400).json({ success: false, message: 'Montos inválidos' });
        }

        // Calcular la cantidad de cuotas (redondear hacia arriba)
        const cantidad_cuotas = Math.ceil(monto / cuota);

        const insertQuery = `
            INSERT INTO prestamo_interno (
                nombre_credito, monto_total, monto_cuota, cantidad_cuotas, fecha_inicio
            ) VALUES (?, ?, ?, ?, ?)
        `;

        await executeQuery(insertQuery, [
            nombre_credito,
            monto,
            cuota,
            cantidad_cuotas,
            fecha_inicio
        ]);

        return res.status(201).json({
            success: true,
            message: 'Préstamo interno creado correctamente',
            result: {
                nombre_credito,
                monto_total: monto,
                monto_cuota: cuota,
                cantidad_cuotas,
                fecha_inicio
            }
        });

    } catch (error) {
        console.error('Error al crear préstamo interno:', error);
        return res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};


// Eliminar un préstamo interno por ID
const deletePrestamoInterno = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const deleteQuery = `DELETE FROM prestamo_interno WHERE id = ?`;
        const result = await executeQuery(deleteQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
        }

        return res.status(200).json({
            success: true,
            message: 'Préstamo interno eliminado correctamente',
            result: { id }
        });

    } catch (error) {
        console.error('Error al eliminar préstamo interno:', error);
        return res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};




// Obtener todos los préstamos internos con información adicional
const getPrestamos = async (req, res) => {
    try {
        const prestamos = await executeQuery(`
            SELECT id, nombre_credito, monto_total, monto_cuota, cantidad_cuotas, fecha_inicio
            FROM prestamo_interno
            ORDER BY fecha_inicio ASC
        `);

        // Calcular monto restante y ajustar la última cuota si es necesario
        const prestamosConDetalle = prestamos.map(prestamo => {
            const { monto_total, monto_cuota, cantidad_cuotas } = prestamo;

            const totalCalculado = monto_cuota * cantidad_cuotas;
            const diferencia = parseFloat((totalCalculado - monto_total).toFixed(2));

            const ultima_cuota = diferencia !== 0
                ? parseFloat((monto_cuota - diferencia).toFixed(2))
                : monto_cuota;

            return {
                ...prestamo,
                monto_restante: monto_total,
                ultima_cuota_aproximada: ultima_cuota
            };
        });

        return res.status(200).json({
            success: true,
            message: prestamosConDetalle.length > 0 ? 'Préstamos encontrados' : 'No hay préstamos registrados',
            result: prestamosConDetalle
        });

    } catch (error) {
        console.error('Error al obtener préstamos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error del servidor al obtener préstamos'
        });
    }
};

const crearPrestamosMasivos = async (req, res) => {
  const prestamos = req.body;

  if (!Array.isArray(prestamos)) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un arreglo de préstamos.' });
  }

  try {
    for (const prestamo of prestamos) {
      const {
        id_contrato,
        nombre_prestamo,
        monto_total,
        cuotas_pagadas = 0,
        total_cuotas = null
      } = prestamo;

      if (!id_contrato || !nombre_prestamo || !monto_total) {
        return res.status(400).json({ message: 'Faltan campos requeridos en uno de los préstamos.' });
      }

      const monto = parseFloat(monto_total);
      if (isNaN(monto) || monto <= 0) {
        console.log(`⛔ Monto inválido para contrato ${id_contrato}, préstamo ${nombre_prestamo}`);
        continue;
      }

      // Verificar si ya existe el préstamo
      const existente = await executeQuery(
        `SELECT id, cuotas_pagadas FROM prestamos_contrato WHERE id_contrato = ? AND nombre_prestamo = ?`,
        [id_contrato, nombre_prestamo]
      );

      if (existente.length > 0) {
        const cuotasExistente = existente[0].cuotas_pagadas ?? 0;

        if (cuotas_pagadas > cuotasExistente) {
          // Actualizar el préstamo existente con más cuotas
          await executeQuery(
            `UPDATE prestamos_contrato SET monto_total = ?, cuotas_pagadas = ?, total_cuotas = ? WHERE id = ?`,
            [monto, cuotas_pagadas, total_cuotas, existente[0].id]
          );
          console.log(`🔄 Préstamo actualizado: ${id_contrato} - "${nombre_prestamo}" con ${cuotas_pagadas} cuotas pagadas`);
        } else {
          console.log(`↩️ Préstamo no actualizado (cuotas igual o menores): ${id_contrato} - "${nombre_prestamo}"`);
        }

        continue;
      }

      // Insertar nuevo préstamo si no existe
      await executeQuery(
        `INSERT INTO prestamos_contrato (id_contrato, nombre_prestamo, monto_total, cuotas_pagadas, total_cuotas)
         VALUES (?, ?, ?, ?, ?)`,
        [id_contrato, nombre_prestamo, monto, cuotas_pagadas, total_cuotas]
      );
    }

    res.status(201).json({ message: 'Préstamos masivos procesados correctamente.' });
  } catch (error) {
    console.error("❌ Error al registrar préstamos masivos:", error.message);
    res.status(500).json({ message: 'Error al registrar préstamos masivos', error: error.message });
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
    calcularLiquidacion,
    calcularSueldoBaseDesdeNeto,
    calcularLiquidacionesMultiples,
    obtenerHistorialLiquidaciones,
    calcularCotizacionEmpresa,
    crearPrestamoInterno,
    getPrestamos,
    // Nuevas funciones
    updateAFPById,
    updateIUSCByTramo,
    updateAFCById,
    guardarLiquidacionesMensuales,
    eliminarLiquidaciones,
    deletePrestamoInterno,
    crearPrestamosMasivos

};