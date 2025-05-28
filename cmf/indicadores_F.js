// indicadores_F.js
import axios from 'axios';
import dotenv from 'dotenv';
import executeQuery from '../database/executeQuery.js';


dotenv.config();

const BASE_URL = process.env.SBIF_BASE_URL;
const API_KEY = process.env.SBIF_API_KEY;

/**
 * Obtiene y guarda el valor actual de la UF en la tabla valor_uf
 */
export const obtenerYGuardarUF = async () => {
    try {
        const url = `${BASE_URL}/api-sbifv3/recursos_api/uf?apikey=${API_KEY}&formato=json`;
        const response = await axios.get(url);
        const uf = response.data.UFs?.[0];

        if (uf) {
            const fecha = new Date(uf.Fecha).toISOString().split('T')[0];
            const valor = parseFloat(uf.Valor.replace(/\./g, '').replace(',', '.'));

            const query = `
        INSERT INTO valor_uf (fecha, valor_diario)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE valor_diario = VALUES(valor_diario);
      `;

            await executeQuery(query, [fecha, valor]);
            console.log(`[YF] UF insertada/actualizada: ${fecha} - ${valor}`);
            return { fecha, valor };
        }

    } catch (error) {
        console.error("Error al obtener o guardar la UF:", error.message);
    }
};

/**
 * Obtiene y guarda el valor actual de la UTM en la tabla valores_tributarios
 */
export const obtenerYGuardarUTM = async () => {
    try {
        const url = `${BASE_URL}/api-sbifv3/recursos_api/utm?apikey=${API_KEY}&formato=json`;
        const response = await axios.get(url);
        const utm = response.data.UTMs?.[0];

        if (utm) {
            const fecha = new Date(utm.Fecha).toISOString().split('T')[0];
            const valor = parseFloat(utm.Valor.replace(/\./g, '').replace(',', '.'));

            const query = `
        INSERT INTO valores_tributarios (fecha, valor_utm)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE valor_utm = VALUES(valor_utm);
      `;

            await executeQuery(query, [fecha, valor]);
            console.log(`[YF] UTM insertada/actualizada: ${fecha} - ${valor}`);
            return { fecha, valor };
        }
    } catch (error) {
        console.error("Error al obtener o guardar la UTM:", error.message);
    }
};


export const obtenerHistorialUTMDesdeSBIF = async () => {
    try {
        const currentYear = new Date().getFullYear();
        const url = `${BASE_URL}/api-sbifv3/recursos_api/utm/${currentYear}?apikey=${API_KEY}&formato=json`;

        const response = await axios.get(url);
        const utms = response.data.UTMs || [];

        const historial = utms.slice(0, 6).map(item => ({
            fecha: item.Fecha,
            valor: parseFloat(item.Valor.replace(/\./g, '').replace(',', '.')),
        }));

        return historial;
    } catch (error) {
        console.error("Error al obtener historial UTM desde SBIF:", error.message);
        return [];
    }
};

export const obtenerYGuardarIPC = async () => {
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

    // 🔧 Devuelve como número, no como string
    return { ipcAnual: parseFloat(acumuladoAnual.toFixed(2)) };

  } catch (error) {
    console.error("Error al obtener o guardar IPC acumulado anual:", error.message);
    throw error;
  }
};
