import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import executeQuery from '../../../database/executeQuery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guardarPDF = async (req, res) => {
    console.log('=== GUARDAR PDF CONTROLLER ===');
    console.log('Archivo recibido:', req.file ? 'SÍ' : 'NO');
    console.log('Body:', req.body);
    
    try {
        // El PDF viene como archivo
        if (!req.file) {
            console.error('No hay archivo en la petición');
            return res.status(400).json({ success: false, message: 'Archivo PDF no recibido' });
        }

        // Obtener el ID de liquidación desde el body
        const { idLiquidacion } = req.body;
        console.log('ID Liquidación:', idLiquidacion);
        
        if (!idLiquidacion) {
            console.error('No hay ID de liquidación');
            return res.status(400).json({ success: false, message: 'ID de liquidación no proporcionado' });
        }

        // Primero obtener los datos de la liquidación
        console.log('Buscando liquidación...');
        const [liquidacion] = await executeQuery(`
            SELECT id_usuario, mes, anio 
            FROM liquidaciones_mensuales 
            WHERE id = ?
        `, [idLiquidacion]);

        console.log('Liquidación encontrada:', liquidacion);

        if (!liquidacion) {
            return res.status(404).json({ success: false, message: 'Liquidación no encontrada' });
        }

        const buffer = req.file.buffer;
        const nombreOriginal = req.file.originalname;
        const fecha = new Date();

        console.log('Preparando para guardar:');
        console.log('- Tamaño archivo:', buffer.length);
        console.log('- Nombre:', nombreOriginal);

        // Verificar si ya existe un PDF para esta liquidación
        const [pdfExistente] = await executeQuery(`
            SELECT id FROM pdf_liquidaciones 
            WHERE id_liquidacion = ?
        `, [idLiquidacion]);

        if (pdfExistente) {
            console.log('Actualizando PDF existente...');
            const result = await executeQuery(`
                UPDATE pdf_liquidaciones 
                SET nombre_archivo = ?, contenido = ?, fecha_subida = ?
                WHERE id_liquidacion = ?
            `, [nombreOriginal, buffer, fecha, idLiquidacion]);
            console.log('Resultado update:', result);
        } else {
            console.log('Insertando nuevo PDF...');
            const result = await executeQuery(`
                INSERT INTO pdf_liquidaciones 
                (id_usuario, id_liquidacion, mes, anio, nombre_archivo, contenido, fecha_subida)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [liquidacion.id_usuario, idLiquidacion, liquidacion.mes, liquidacion.anio, 
                nombreOriginal, buffer, fecha]);
            console.log('Resultado insert:', result);
        }

        // Verificar que se guardó
        const [verificacion] = await executeQuery(`
            SELECT id, LENGTH(contenido) as size FROM pdf_liquidaciones WHERE id_liquidacion = ?
        `, [idLiquidacion]);

        console.log('Verificación:', verificacion);

        return res.status(200).json({
            success: true,
            message: 'PDF guardado correctamente',
            data: verificacion
        });

    } catch (error) {
        console.error('Error al guardar PDF:', error);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Error interno al guardar PDF',
            error: error.message
        });
    }
};

const obtenerPDFsUsuario = async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const archivos = await executeQuery(`
            SELECT 
                p.id, 
                p.nombre_archivo, 
                p.mes, 
                p.anio, 
                p.fecha_subida,
                p.id_liquidacion
            FROM pdf_liquidaciones p
            WHERE p.id_usuario = ?
            ORDER BY p.anio DESC, p.mes DESC
        `, [id_usuario]);

        return res.status(200).json({
            success: true,
            result: archivos
        });

    } catch (error) {
        console.error('Error al obtener PDFs:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener PDFs del usuario',
            error: error.message
        });
    }
};

const descargarPDF = async (req, res) => {
    const { id_pdf } = req.params;

    try {
        const [pdf] = await executeQuery(`
            SELECT nombre_archivo, contenido 
            FROM pdf_liquidaciones 
            WHERE id = ?
        `, [id_pdf]);

        if (!pdf) {
            return res.status(404).json({ success: false, message: 'PDF no encontrado' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdf.nombre_archivo}"`);
        res.send(pdf.contenido);

    } catch (error) {
        console.error('Error al descargar PDF:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al descargar PDF',
            error: error.message
        });
    }
};

// Obtener todos los PDFs de liquidaciones
const obtenerTodosPDFs = async (req, res) => {
    try {
        const archivos = await executeQuery(`
            SELECT 
                p.id,
                p.nombre_archivo,
                p.mes,
                p.anio,
                p.fecha_subida,
                u.id as id_usuario,
                dp.nombre as nombre_empleado,
                dp.rut
            FROM pdf_liquidaciones p
            JOIN usuario u ON p.id_usuario = u.id
            JOIN datos_personales dp ON dp.id_usuario = u.id
            ORDER BY p.fecha_subida DESC
        `);

        return res.status(200).json({
            success: true,
            result: archivos
        });
    } catch (error) {
        console.error('Error al obtener todos los PDFs:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener PDFs',
            error: error.message
        });
    }
};

export {
    guardarPDF,
    obtenerPDFsUsuario,
    descargarPDF,
    obtenerTodosPDFs
};