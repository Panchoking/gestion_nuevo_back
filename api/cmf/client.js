import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://api.cmfchile.cl';
const API_KEY = process.env.CMF_API_KEY || 'api_key_not_set';

// cliente para la api CMF
class CMFClient {
    constructor(baseUrl = BASE_URL, apiKey = API_KEY) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL: this.baseUrl,
        });
    }

    async getDailyUF() {
        try {
            let endpoint = '/api-sbifv3/recursos_api/uf?apikey=' + this.apiKey + '&formato=json';
            const response = await this.axios.get(endpoint);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`Error con el fetch de UF diaria: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error al obtener la UF diaria:', err);
            throw new Error('Error al obtener la UF diaria: ' + err.message);
        }
    }

    async getUFByDate(fecha) {
        try {
            // separar fecha
            const [year, month, day] = fecha.split('-');

            if (!year || !month || !day) {
                throw new Error('Fecha inválida. Debe estar en formato YYYY-MM-DD');
            }

            const endpoint = `/api-sbifv3/recursos_api/uf/${year}/${month}/dias/${day}?apikey=${this.apiKey}&formato=json`;
            const response = await this.axios.get(endpoint);

            

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`Error con el fetch de UF por fecha: ${response.statusText}`);
            }
        } catch (err) {
            console.log("error codigo:", err.response?.data);
            // Devolver un objeto con la misma estructura que tendría la respuesta exitosa
            // pero con valor 0
            return {
                UFs: [
                    {
                        Valor: "0",
                        Fecha: fecha
                    }
                ]
            };
        }
    }

    async getUTM() {
        try {
            let endpoint = `/api-sbifv3/recursos_api/utm?apikey=${this.apiKey}&formato=json`
            const response = await this.axios.get(endpoint);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(`Error con el fetch de UTM: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error al obtener la UTM:', err);
            throw new Error('Error al obtener la UTM: ' + err.message);
        }
    }
}

const cmfClient = new CMFClient();
export default cmfClient;

export { CMFClient };