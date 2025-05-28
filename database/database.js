import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // máximo de conexiones en el pool
    queueLimit: 0 // sin limite para conexiones en cola

    
});

//console.log("USER:", process.env.DB_USER);
//console.log("PWD:", process.env.DB_PWD);
//console.log(pool);


export default pool.promise();