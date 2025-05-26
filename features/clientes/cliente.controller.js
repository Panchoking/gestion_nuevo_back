import executeQuery from "../../database/executeQuery.js";

const getClientes = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM cliente;');
        res.status(200).json({ success: true, result: result });
    } catch (err) {
        console.error("Error fetching clientes:", err.message);
        res.status(500).json({ success: false, message: "Error fetching clientes" });
    }
};

const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await executeQuery('SELECT * FROM cliente WHERE id = ?;', [id]);
        if (!result) {
            return res.status(404).json({ success: false, message: "Cliente not found" });
        }
        res.status(200).json({ success: true, result: result });
    } catch (err) {
        console.error("Error fetching cliente:", err.message);
        res.status(500).json({ success: false, message: "Error fetching cliente" });
    }
};

export {
    getClientes,
    getClienteById
}