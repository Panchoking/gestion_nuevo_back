import executeQuery from "../../../database/executeQuery.js";

// Crear cliente
export const crearCliente = async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        const { nombre, codigo } = req.body;

        if (!nombre || !codigo) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }

        await executeQuery(
            `INSERT INTO cliente (nombre, codigo) VALUES (?, ?)`,
            [nombre, codigo]
        );

        res.status(201).json({ message: 'Cliente creado correctamente' });
    } catch (error) {
        console.error("ERROR SQL:", error);
        res.status(500).json({ message: 'Error interno al crear cliente' });
    }
};

// Crear proyecto
export const crearProyecto = async (req, res) => {
    const { nombre, codigo, id_cliente, id_area } = req.body;
    try {
        await executeQuery(
            `INSERT INTO proyecto (nombre, codigo, id_cliente, id_area) VALUES (?, ?, ?, ?)`,
            [nombre, codigo, id_cliente, id_area]
        );
        res.status(201).json({ message: 'Proyecto creado correctamente' });
    } catch (error) {
        console.error('Error creando proyecto:', error);
        res.status(500).json({ message: 'Error al crear proyecto' });
    }
};

// Crear centro de costo
export const crearCentroCosto = async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        const { id_cliente, id_proyecto } = req.body;

        if (!id_cliente || !id_proyecto) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }

        // Obtener códigos de cliente, proyecto y área para generar el código del centro de costo
        const cliente = await executeQuery('SELECT codigo FROM cliente WHERE id = ?', [id_cliente]);
        const proyecto = await executeQuery('SELECT codigo, id_area FROM proyecto WHERE id = ?', [id_proyecto]);

        if (!cliente.length || !proyecto.length) {
            return res.status(404).json({ message: 'Cliente o Proyecto no encontrados' });
        }

        const area = await executeQuery('SELECT codigo FROM area_proyecto WHERE id = ?', [proyecto[0].id_area]);
        if (!area.length) {
            return res.status(404).json({ message: 'Área del proyecto no encontrada' });
        }

        const codigo = `${area[0].codigo}-${cliente[0].codigo}-${proyecto[0].codigo}`;

        // Insertar centro de costo
        await executeQuery(
            `INSERT INTO centro_costo (codigo, id_cliente, id_proyecto) VALUES (?, ?, ?)`,
            [codigo, id_cliente, id_proyecto]
        );

        res.status(201).json({ message: 'Centro de costo creado correctamente', codigo_generado: codigo });

    } catch (error) {
        console.error("Error creando centro de costo:", error);
        res.status(500).json({ message: 'Error interno al crear centro de costo' });
    }
};


export const getCentrosCosto = async (req, res) => {
    try {
        const query = `
      SELECT 
        cc.id, 
        cc.codigo, 
        c.nombre AS cliente, 
        p.nombre AS proyecto
      FROM centro_costo cc
      JOIN cliente c ON cc.id_cliente = c.id
      JOIN proyecto p ON cc.id_proyecto = p.id
    `;

        const centros = await executeQuery(query);
        res.status(200).json(centros);
    } catch (error) {
        console.error('Error obteniendo centros de costo:', error);
        res.status(500).json({ message: 'Error al obtener centros de costo' });
    }
};

// Obtener catálogo de proyectos
export const getCatalogoProyectos = async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        const proyectos = await executeQuery('SELECT id, nombre FROM proyecto');
        res.json(proyectos);
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ message: 'Error al obtener proyectos' });
    }
};

// Obtener catálogo de clientes
export const getCatalogoClientes = async (req, res) => {

    try {
        console.log("REQ.BODY:", req.body);
        const clientes = await executeQuery('SELECT id, nombre FROM cliente');
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

// Obtener catálogo de áreas de proyecto
export const getCatalogoAreas = async (req, res) => {
    try {
        console.log("REQ.BODY:", req.body);
        const areas = await executeQuery('SELECT id, nombre FROM area_proyecto');
        res.json(areas);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ message: 'Error al obtener áreas' });
    }
};
