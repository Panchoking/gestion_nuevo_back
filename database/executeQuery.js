import pool from './database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// Define campos sensibles por tabla
const SENSITIVE_FIELDS = {
    'datos_personales': [
        'dp_rut', 'rut',
        'dp_nombre', 'nombre',
        'dp_apellido', 'apellido',
        'dp_telefono', 'telefono',
        'dp_emergencia', 'telefono_emergencia',
        'dp_estadocivil', 'estado_civil',
        'dp_direccion', 'direccion',
        'dp_correo', 'correo',
        'dp_corporativo', 'correo_corporativo',
    ],
    'informacion_bancaria':
        [
            'ib_cuenta', 'cuenta',
            'ib_numero', 'numero_cuenta',

        ],
    'banco': [
        'banco_nombre', 'nombre',
    ],
    'contrato': [
        'c_codigo', 'codigo',
        'c_mandante', 'mandante',
        'c_cargo', 'cargo',
        'c_calificacion', 'calificacion',
        'c_titulo', 'titulo',
        //'c_liquido', 'sueldo_liquido',
        //'c_valor_isapre', 'valor_plan_isapre',
    ],
    'feedback': [
        'feedback_comentario', 'comentario',
    ],
    'registro': [
        'reg_observaciones', 'observaciones',
    ],
    'comuna': [
        'comuna_nombre', 'nombre',
    ],
    'region': [
        'region_nombre', 'nombre',
    ],
    'nacionalidad': [
        'nacionalidad_nombre', 'nombre',
    ],
    'logs': [
        'logs_accion', 'tipo_accion',
        'logs_descripcion', 'descripcion',
        'logs_mensaje', 'mensaje_afectado',
        'logs_link', 'link_redireccion',
    ],
    'notificaciones_pendientes': [
        'np_mensaje', 'mensaje',
    ],
    // Añade más tablas y campos según necesites
};

// Encripta los campos sensibles en una consulta INSERT o UPDATE
const encryptSensitiveValues = (query, values) => {
    if (!values || !Array.isArray(values)) return values;

    // Detectar tipo de consulta y tabla
    const isInsert = /INSERT INTO\s+`?(\w+)`?\s+/i.test(query);
    const isUpdate = /UPDATE\s+`?(\w+)`?\s+/i.test(query);

    if (!isInsert && !isUpdate) {
        //console.log("no es insert ni update", query);
        return values;
    }

    const tableMatch = query.match(isInsert
        ? /INSERT INTO\s+`?(\w+)`?\s+/i
        : /UPDATE\s+`?(\w+)`?\s+/i);

    if (!tableMatch) {
        //console.log("no hay match para la tabla (datos)");
        return values;
    }

    const tableName = tableMatch[1];
    //console.log(`Tabla exacta detectada: "${tableName}"`);
    const sensitiveFields = SENSITIVE_FIELDS[tableName];

    //console.log(`Tabla detectada: ${tableName}, es tabla sensible: ${sensitiveFields ? 'Sí' : 'No'}`);

    if (!sensitiveFields || !sensitiveFields.length) return values;

    // Para INSERT, necesitamos extraer los nombres de los campos
    if (isInsert) {
        const fieldsMatch = query.match(/\(([^)]+)\)\s+VALUES\s+\(/i);
        if (fieldsMatch) {
            const fields = fieldsMatch[1].split(',').map(f => f.trim().replace(/`/g, ''));

            // Crear una copia de values para no modificar el original
            const encryptedValues = [...values];

            // Encriptar valores sensibles
            fields.forEach((field, index) => {
                if (sensitiveFields.includes(field) && values[index]) {
                    encryptedValues[index] = encrypt(values[index].toString());
                }
            });

            return encryptedValues;
        }
    }

    // Para UPDATE, es más complejo y requeriría análisis de la consulta
    // Esta es una implementación simplificada
    if (isUpdate) {
        // Buscar patrón SET field1 = ?, field2 = ?, ...
        const setClauseMatch = query.match(/SET\s+([^;]+)(?:WHERE|$)/i);
        if (setClauseMatch) {
            const setClauses = setClauseMatch[1].split(',').map(c => c.trim());
            let valueIndex = 0;

            // Crear una copia de values para no modificar el original
            const encryptedValues = [...values];

            // Procesar cada cláusula SET
            setClauses.forEach(clause => {
                const fieldMatch = clause.match(/`?(\w+)`?\s*=/);
                if (fieldMatch && sensitiveFields.includes(fieldMatch[1])) {
                    if (encryptedValues[valueIndex] != null) {
                        encryptedValues[valueIndex] = encrypt(encryptedValues[valueIndex].toString());
                    }
                }
                valueIndex++;
            });

            return encryptedValues;
        }
    }

    return values;
};

// Desencripta campos sensibles en los resultados de una consulta
const decryptSensitiveResults = (results, queryInfo = null) => {
    if (!results) return results;
    
    // Identificar tablas involucradas en la consulta
    const tablesInQuery = extractTablesFromQuery(queryInfo || '');
    //console.log('Tablas detectadas en la consulta:', tablesInQuery);
    
    const decryptRow = (row) => {
        if (!row || typeof row !== 'object') return row;
        
        const decryptedRow = { ...row };
        
        // Si conocemos las tablas en la consulta, aplicamos desencriptación selectiva
        if (tablesInQuery.length > 0) {
            // Solo desencriptar campos de las tablas detectadas
            tablesInQuery.forEach(tableName => {
                if (SENSITIVE_FIELDS[tableName]) {
                    const fields = SENSITIVE_FIELDS[tableName];
                    
                    // Verificar cada campo de la tabla en el resultado
                    fields.forEach(field => {
                        if (decryptedRow[field] !== undefined) {
                            try {
                                decryptedRow[field] = decrypt(decryptedRow[field]);
                            } catch (err) {
                                console.warn(`Error al desencriptar campo ${field}:`, err.message);
                            }
                        }
                    });
                }
            });
        } else {
            // Si no podemos detectar tablas, desencriptar con cuidado basado en prefijos
            Object.keys(decryptedRow).forEach(fieldName => {
                // Intentar identificar la tabla por el prefijo del campo
                const prefix = fieldName.split('_')[0];
                
                // Buscar en todas las tablas
                for (const [tableName, fields] of Object.entries(SENSITIVE_FIELDS)) {
                    // Si el campo está en la lista de campos sensibles de esta tabla
                    if (fields.includes(fieldName) && 
                        // Y el prefijo coincide con el inicio del nombre de la tabla o es un campo sin prefijo
                        (tableName.startsWith(prefix) || !fieldName.includes('_'))) {
                        
                        try {
                            decryptedRow[fieldName] = decrypt(decryptedRow[fieldName]);
                        } catch (err) {
                            // Si falla, mantener el valor original
                        }
                        break;
                    }
                }
            });
        }
        
        return decryptedRow;
    };
    
    // Procesar resultados
    if (Array.isArray(results)) {
        return results.map(decryptRow);
    }
    return decryptRow(results);
};

const extractTablesFromQuery = (query) => {
    const tables = [];
    
    // Detectar tabla principal (FROM)
    const fromMatch = query.match(/FROM\s+`?(\w+)`?/i);
    if (fromMatch) {
        tables.push(fromMatch[1]);
    }
    
    // Detectar tablas en JOINs
    const joinRegex = /JOIN\s+`?(\w+)`?/gi;
    let joinMatch;
    while ((joinMatch = joinRegex.exec(query)) !== null) {
        tables.push(joinMatch[1]);
    }
    
    return tables;
};

const executeQuery = async (query, values) => {
    try {
        const encryptedValues = encryptSensitiveValues(query, values);
        const [results] = await pool.query(query, encryptedValues);
        
        // Pasar la consulta original al desencriptador
        const decryptedResults = decryptSensitiveResults(results, query);
        /*console.log(query);
        console.log(values);
         const [results2] = await pool.query(query, values);
         console.log(results2);*/
        
        return decryptedResults;
        
    } catch (err) {
        console.error("error ejecutando consulta:", err.message);
        console.log(query);
        throw err;
    }
};

export default executeQuery;