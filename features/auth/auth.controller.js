import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import executeQuery from '../../database/executeQuery.js';
import userService from '../usuarios/usuarios.service.js';

//    token de inicio de sesion
const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1hora
};

const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.JWT_REFRESH_SECRET);
};

const login = async (req, res) => {
    console.log("LOGIN", req.body);
    const { rut, password, deviceInfo } = req.body;
    const isProduction = process.env.NODE_ENV === "production";

    console.log("deviceInfo", deviceInfo);
    try {
        const username = await userService.getUsernameByRut(rut);
        const user = await userService.findUserByUsername(username);
        if (!user) {
            console.log("usuario no encontrado");
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log("contraseña incorecta");
            return res.status(403).json({ message: "Contraseña incorrecta." });
        }

        if (!user.activo) {
            console.log("cuenta desactivada");
            return res.status(403).json({ message: "Esta cuenta está desactivada." });
        }

        // verificar si es admin o tiene rol en la plataforma del front
        const is_admin = user.is_admin;
        const [tieneRolRRHH] = await executeQuery(`
            SELECT COUNT(*) AS tiene_rol
            FROM usuario_rol_plataforma urp
            JOIN rol_plataforma rp ON urp.id_rol_plataforma = rp.id
            JOIN plataforma p ON rp.id_plataforma = p.id
            WHERE urp.id_usuario = ?
            AND p.codigo = 'GESTION'
            AND rp.nombre = 'RRHH'
            AND p.activo = TRUE
        `, [user.id]);

        // si no es admin, ni tiene rol ni es check -> no puede entrar a gestion
        if (!is_admin && !tieneRolRRHH) {
            console.log("Acceso denegado: usuario no tiene rol en la plataforma");
            return res.status(403).json({ message: "Acceso denegado. Se requieren permisos para entrar en esta plataforma." });
        }

        // payload para el token
        const userPayload = {
            id: user.id,
            is_admin: is_admin,
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        // guardar refresh token
        const refreshTokenExpAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
        await executeQuery(
            "UPDATE usuario SET refreshToken = ?, refreshTokenExpAt = ? WHERE id = ?;",
            [refreshToken, refreshTokenExpAt, user.id]
        );

        // generar nombres de cookies específicos para la plataforma
        const authTokenName = `altigestion_auth`;
        const refreshTokenName = `altigestion_refresh`;

        // generar cookies
        res.cookie(authTokenName, accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 3600 * 1000, // 1 hora
            domain: isProduction ? '.altimec.cl' : undefined // Dominio padre en producción
        });

        res.cookie(refreshTokenName, refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            domain: isProduction ? '.altimec.cl' : undefined // Dominio padre en producción
        });

        console.log(`Inicio de sesión exitoso en plataforma altigestion`);
        console.log('--- Seteando cookie ---');
        console.log('origin:', req.headers.origin);
        console.log('plataforma:', req.body.plataforma);
        console.log('SameSite:', isProduction ? 'None' : 'Lax');

        try {
            // guardar info del dispositivo
            const deviceQuery = `
                INSERT INTO device_tracking (id_usuario, user_agent, screen_resolution, device_type, browser, os, mobile, language)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `;

            await executeQuery(deviceQuery, [
                user.id,
                deviceInfo.userAgent,
                deviceInfo.screenResolution,
                deviceInfo.deviceType,
                deviceInfo.browser,
                deviceInfo.osInfo,
                deviceInfo.isMobile ? 1 : 0,
                deviceInfo.language,
            ]);
        } catch (err) {
            console.log("Error guardando info del dispositivo:", err.message);
        }


        res.status(200).json({ success: true, message: "Inicio de sesión exitoso" });
    } catch (err) {
        console.log("Error en login:", err.message);
        res.status(500).json({
            success: false,
            message: "Error en el servidor",
            error: err.message
        });
    }
};


const refreshAccessToken = async (req, res) => {
    console.log("renovar token con refresh token");
    // Obtener la plataforma desde la query, o usar 'check' como valor por defecto
    const isProduction = process.env.NODE_ENV === "production";

    // Construimos el nombre de las cookies tal como se guardaron en el login
    const authTokenName = `altigestion_auth`;
    const refreshTokenName = `altigestion_refresh`;

    // Acá buscamos la cookie con el nombre correcto
    const refreshToken = req.cookies[refreshTokenName];
    console.log("refreshToken", refreshToken ? "Existe" : "No existe");

    // Si no hay refresh token, lo más probable es que haya expirado o no se haya enviado
    if (!refreshToken) {
        // Limpiar todas las cookies posibles
        clearAuthCookies(res, isProduction);
        return res.status(403).json({ message: "Sesión expirada. Inicie sesión nuevamente.", redirectToLogin: true });
    }

    try {
        // Verificamos que el token no haya sido alterado o falsificado
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            console.log("Refresh token inválido o alterado:", err.message);
            clearAuthCookies(res, isProduction);
            return res.status(403).json({ message: "Sesión inválida. Inicie sesión nuevamente.", redirectToLogin: true });
        }

        // Buscar al usuario que tenga ese refresh token en la base de datos
        const [user] = await executeQuery(
            "SELECT * FROM usuario WHERE refreshToken = ?;",
            [refreshToken]
        );

        // Si no hay usuario o el token está vencido, se cierra la sesión
        if (!user || !user.refreshTokenExpAt || new Date(user.refreshTokenExpAt) < new Date()) {
            console.log("Refresh token inválido o expirado - No se encontró usuario asociado");
            clearAuthCookies(res, isProduction);
            return res.status(403).json({ message: "Sesión expirada. Inicie sesión nuevamente.", redirectToLogin: true });
        }

        // Armamos el payload del nuevo access token
        const userPayload = {
            id: user.id,
            is_admin: user.is_admin,
        };

        // Generamos el nuevo access token
        const accessToken = generateAccessToken(userPayload);

        // Lo devolvemos como cookie, igual que en login
        res.cookie(authTokenName, accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax",
            maxAge: 3600 * 1000, // 1 hora (para producción, 15s solo para pruebas)
            domain: isProduction ? '.altimec.cl' : undefined
        });

        console.log("token renovado con el refreshtoken");
        res.status(200).json({ message: "Token renovado", accessToken });
    } catch (err) {
        // Si hay cualquier error inesperado, limpiamos cookies y cerramos sesión
        console.log("Error renovando token:", err.message);
        clearAuthCookies(res, isProduction);
        return res.status(500).json({
            message: "Error renovando la sesión",
            error: err.message,
            redirectToLogin: true
        });
    }
};

// Función de utilidad para limpiar cookies de autenticación
const clearAuthCookies = (res, isProduction) => {
    // Limpiar cookies específicas de la plataforma
    const authTokenName = `altigestion_auth`;
    const refreshTokenName = `altigestion_refresh`;

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        domain: isProduction ? '.altimec.cl' : undefined
    };

    res.clearCookie(authTokenName, cookieOptions);
    res.clearCookie(refreshTokenName, cookieOptions);

    // También limpiar cookies legacy
    res.clearCookie('altigestion_auth', cookieOptions);
    res.clearCookie('altigestion_refresh', cookieOptions);
};

const logout = async (req, res) => {
    console.log("cerrar sesion");
    const userId = req.user.id;

    try { // desloguear, borrar cookies del usuario y refreshToken
        const query = "UPDATE usuario SET refreshToken = NULL, refreshTokenExpAt = NULL WHERE id = ?;";
        await executeQuery(query, [userId]);

        // Nombres de cookies específicos para la plataforma
        const authTokenName = `altigestion_auth`;
        const refreshTokenName = `altigestion_refresh`;


        res.clearCookie(authTokenName, {
            domain: process.env.NODE_ENV === "production" ? '.altimec.cl' : undefined,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });

        res.clearCookie(refreshTokenName, {
            domain: process.env.NODE_ENV === "production" ? '.altimec.cl' : undefined,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });

        console.log("sesión cerrada con éxito");
        res.status(200).json({ message: "Sesión cerrada con éxito" });
    } catch (err) {
        console.log("error cerrando sesión");
        res.status(500).json({ message: "Error al cerrar sesión: ", error: err.message });
    }
};

const verifyAuth = (req, res) => {
    console.log("user", req.user);
    res.status(200).json({ authenticated: true, user: req.user });
    // res.status(200).json({ authenticated: true, user: req.user });
};

export {
    login,
    logout,
    verifyAuth,
    refreshAccessToken,
};