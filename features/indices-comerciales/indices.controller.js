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

// Controlador para calcular la liquidación con AFP, salud y cesantía (trabajador)
const calcularLiquidacion = async (req, res) => {
    try {
        const { sueldoBase, horasExtras, diasTrabajados, afp, montoAnticipo = 0, aceptarExcesoAnticipo = false } = req.body;


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

        const leyesSociales = descuentoAFP + descuentoSalud + descuentoCesantia;
        let totalDescuentos = leyesSociales;

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

        // base tributable (sueldo bruto menos descuentos)
        const baseTributable = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia;
        console.log("base tributable:", baseTributable);

        // Convertir sueldo Tributable a UTM
        const baseTributableUTM = baseTributable / valorUTM;
        console.log("base tributable en UTM:", baseTributableUTM);

        // Buscar el tramo correspondiente
        let tramoIUSC = null;
        for (const tramo of tablaIUSC) {
            const desdeUTM = parseFloat(tramo.desde_utm);
            const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;

            if (baseTributableUTM > desdeUTM && baseTributableUTM <= hastaUTM) {
                tramoIUSC = tramo;
                break;
            }
        }

        // Calcular impuesto si corresponde
        let impuestoIUSC = 0;
        if (tramoIUSC && tramoIUSC.tasa !== null) {
            const tasa = parseFloat(tramoIUSC.tasa);
            console.log("tasa : ", tasa);
            const rebajar = parseFloat(tramoIUSC.rebajar_utm);
            console.log("rebajar", rebajar);
            impuestoIUSC = (baseTributableUTM * (tasa / 100) - rebajar) * valorUTM;// calculo descuento * tramo
            impuestoIUSC = Math.max(0, impuestoIUSC); // Asegurar que no sea negativo
        }
        console.log("Impuesto IUSC:", impuestoIUSC);

        totalDescuentos += impuestoIUSC; // Sumar impuesto IUSC a los descuentos totales

        console.log("Total Descuentos:", totalDescuentos);
        console.log("Leyes Sociales:", leyesSociales);


        // Sueldo líquido
        let sueldoLiquido = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia - impuestoIUSC;
        console.log("Sueldo Líquido:", sueldoLiquido);


        let anticipo = 0;
        let porcentajeAnticipo = 0;
        let errorAnticipo = null;

        if (montoAnticipo > 0) {
            porcentajeAnticipo = (montoAnticipo / sueldoLiquido) * 100;

            if (porcentajeAnticipo < 15) {
                errorAnticipo = 'El anticipo debe ser al menos un 15% del sueldo líquido.';
            } else if (porcentajeAnticipo > 25 && !aceptarExcesoAnticipo) {
                errorAnticipo = 'El anticipo supera el 25% del sueldo líquido y no fue autorizado.';
            }

            anticipo = Math.round(montoAnticipo);
            sueldoLiquido -= anticipo; // ✅ Se actualiza directamente
        }

        totalDescuentos += anticipo;



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
                sueldoLiquido,
                baseTributable,
                leyesSociales,
                totalDescuentos,
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


const calcularLiquidacionesMultiples = async (req, res) => {
    try {
        console.log("=== INICIO calcularLiquidacionesMultiples ===");
        const { trabajadores } = req.body;

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
        const utmData = await cmfClient.getCurrentUTM();

        if (!utmData?.UTMs?.length) {
            return res.status(404).json({ success: false, message: 'No se encontró el valor de la UTM' });
        }

        // ✅ Convertir todos los valores a números
        const getIndice = (nombre) => {
            const indice = indices.find(i => i.nombre === nombre);
            const valor = parseFloat(indice?.valor || 0);
            console.log(`Índice ${nombre}:`, valor);
            return valor;
        };

        const horasLegales = getIndice("horas_legales");
        const sueldoMinimo = getIndice("rmi_general");
        const planSalud = getIndice("plan_salud");
        const tasaCesantia = parseFloat(afc[0]?.fi_trabajador || 0);
        const valorUTM = parseFloat(utmData.UTMs[0].Valor.replace(/\./g, '').replace(',', '.'));

        console.log("Valores calculados:", {
            horasLegales,
            sueldoMinimo,
            planSalud,
            tasaCesantia,
            valorUTM
        });

        const resultados = [];
        const errores = [];

        for (const [index, trabajador] of trabajadores.entries()) {
            console.log(`\n--- Trabajador ${index + 1}/${trabajadores.length} ---`);

            const { sueldoBase: sueldoBaseRaw, horasExtras = 0, diasTrabajados = 28, afp: afpId, rut, nombre } = trabajador;

            // ✅ CONVERSIÓN CORRECTA: Asegurar que todo sea número
            const sueldoBase = parseFloat(sueldoBaseRaw || 0);
            const horasExtrasNum = parseFloat(horasExtras || 0);
            const diasTrabajadosNum = parseInt(diasTrabajados || 28);

            console.log(`Valores convertidos para ${rut}:`, {
                sueldoBaseOriginal: sueldoBaseRaw,
                sueldoBaseNumerico: sueldoBase,
                horasExtrasNum,
                diasTrabajadosNum
            });

            if (!sueldoBase || isNaN(sueldoBase) || sueldoBase <= 0) {
                console.log(`❌ Sueldo base inválido para ${rut}:`, sueldoBase);
                errores.push({ rut, error: "Sueldo base inválido" });
                continue;
            }

            const afp = afps.find(a => a.id == afpId);
            if (!afp) {
                console.log(`❌ AFP no encontrada para ${rut}. ID buscado: ${afpId}`);
                errores.push({ rut, error: `AFP no válida o no encontrada (ID: ${afpId})` });
                continue;
            }

            // ✅ Convertir tasa AFP a número
            const tasaAFP = parseFloat(afp.tasa || 0);

            // ✅ Cálculo de gratificación
            let gratificacion = sueldoBase * 0.25;
            const topeGratificacion = (sueldoMinimo * 4.75) / 12;
            if (gratificacion > topeGratificacion) {
                gratificacion = topeGratificacion;
            }

            // ✅ Cálculo de horas extras
            const factorBase = (28 / 30) / (horasLegales * 4);
            const fhe = factorBase * 1.5;
            const horasExtrasCalculadas = sueldoBase * fhe * horasExtrasNum;

            // ✅ Sueldo bruto (SUMA, no concatenación)
            const sueldoBruto = sueldoBase + gratificacion + horasExtrasCalculadas;

            console.log(`Cálculos para ${rut}:`, {
                sueldoBase,
                gratificacion,
                horasExtrasCalculadas,
                sueldoBruto
            });

            // ✅ Descuentos
            const descuentoAFP = sueldoBruto * (tasaAFP / 100);
            const descuentoSalud = sueldoBruto * (planSalud / 100);
            const descuentoCesantia = sueldoBruto * (tasaCesantia / 100);
            const baseTributable = sueldoBruto - descuentoAFP - descuentoSalud - descuentoCesantia;
            const baseTributableUTM = baseTributable / valorUTM;

            console.log(`Descuentos para ${rut}:`, {
                descuentoAFP,
                descuentoSalud,
                descuentoCesantia,
                baseTributable,
                baseTributableUTM
            });

            // Buscar tramo IUSC
            let tramoIUSC = null;
            for (const tramo of tablaIUSC) {
                const desdeUTM = parseFloat(tramo.desde_utm || 0);
                const hastaUTM = tramo.hasta_utm ? parseFloat(tramo.hasta_utm) : Infinity;
                if (baseTributableUTM > desdeUTM && baseTributableUTM <= hastaUTM) {
                    tramoIUSC = tramo;
                    break;
                }
            }

            // Calcular impuesto IUSC
            let impuestoIUSC = 0;
            if (tramoIUSC && tramoIUSC.tasa !== null && tramoIUSC.tasa !== undefined) {
                const tasa = parseFloat(tramoIUSC.tasa || 0);
                const rebajar = parseFloat(tramoIUSC.rebajar_utm || 0);
                impuestoIUSC = (baseTributableUTM * (tasa / 100) - rebajar) * valorUTM;
                impuestoIUSC = Math.max(0, impuestoIUSC);
            }

            const leyesSociales = descuentoAFP + descuentoSalud + descuentoCesantia;
            const totalDescuentos = leyesSociales + impuestoIUSC;
            const sueldoLiquido = sueldoBruto - totalDescuentos;

            // ✅ Verificar que no hay NaN antes de agregar resultado
            const resultado = {
                rut,
                nombre: nombre || 'Sin nombre', // ✅ Agregar nombre
                sueldoBase: Math.round(sueldoBase * 100) / 100, // Redondear a 2 decimales
                sueldoBruto: Math.round(sueldoBruto * 100) / 100,
                fhe: Math.round(fhe * 1000000) / 1000000, // 6 decimales para FHE
                gratificacion: Math.round(gratificacion * 100) / 100,
                horasExtrasCalculadas: Math.round(horasExtrasCalculadas * 100) / 100,
                descuentoAFP: Math.round(descuentoAFP * 100) / 100,
                descuentoSalud: Math.round(descuentoSalud * 100) / 100,
                descuentoCesantia: Math.round(descuentoCesantia * 100) / 100,
                impuestoIUSC: Math.round(impuestoIUSC * 100) / 100,
                tramoImpuesto: tramoIUSC?.tramo || 0,
                sueldoLiquido: Math.round(sueldoLiquido * 100) / 100,
                baseTributable: Math.round(baseTributable * 100) / 100,
                leyesSociales: Math.round(leyesSociales * 100) / 100,
                totalDescuentos: Math.round(totalDescuentos * 100) / 100
            };

            // ✅ Verificar que no hay NaN
            const hasNaN = Object.values(resultado).some(val =>
                typeof val === 'number' && isNaN(val)
            );

            if (hasNaN) {
                console.error(`❌ NaN detectado en resultado para ${rut}:`, resultado);
                errores.push({ rut, error: "Error en cálculos - valores inválidos" });
                continue;
            }

            console.log(`✅ Resultado válido para ${rut}:`, resultado);
            resultados.push(resultado);
        }

        console.log("=== RESUMEN FINAL ===");
        console.log(`Procesados exitosamente: ${resultados.length}`);
        console.log(`Errores: ${errores.length}`);

        return res.status(200).json({
            success: true,
            message: 'Cálculo completado',
            result: resultados,
            errores
        });

    } catch (err) {
        console.error('❌ ERROR GENERAL en calcularLiquidacionesMultiples:', err);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: err.message
        });
    }
};


//calculo cotizaciones 


// Controlador para calcular la cotización de la empresa (prorrateado correctamente)
const calcularCotizacionEmpresa = async (req, res) => {
    try {
        const { sueldoBase, horasExtras, diasTrabajados, afp, valorUF, montoExamenes, aguinaldoUF, costosVarios } = req.body;

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

        // Obtener tasa AFC empleador
        const [afcData] = await executeQuery('SELECT fi_empleador FROM afc WHERE id = 1');
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
        const fhe = factorBase * 1.5;S
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

        if (!isNaN(aguinaldoUF) && parseFloat(aguinaldoUF) >= 3 && parseFloat(aguinaldoUF) <= 5) {
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
    calcularCotizacionEmpresa,
    crearPrestamoInterno,
    getPrestamos

};