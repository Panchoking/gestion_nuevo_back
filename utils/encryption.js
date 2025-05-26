import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
dotenv.config();

// Obtener la clave de entorno o usar una por defecto (solo para desarrollo)
const SECRET_KEY = process.env.ENCRYPTION_KEY;

// Encripta un valor usando AES-256

export const encrypt = (text) => {
  if (!text) return text;
  try {
    // Convertir el texto a string explícitamente
    const textString = String(text);
    // Usar un formato correcto para la clave
    return CryptoJS.AES.encrypt(textString, SECRET_KEY).toString();
  } catch (error) {
    console.error('Error al encriptar:', error);
    return text; // En caso de error, devolver el texto original
  }
};

// Desencripta un valor usando AES-256
export const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(String(ciphertext), SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return ciphertext; // En caso de error, devolver el texto original
  }
};