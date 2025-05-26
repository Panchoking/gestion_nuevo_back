import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
    const authTokenName = `altigestion_auth`;
    const refreshTokenName = `altigestion_refresh`;

    const token = req.cookies[authTokenName];
    const refreshToken = req.cookies[refreshTokenName];

    if (!token) {
        console.log("No hay token en la solicitud.");
        // Para la ruta /verify manejamos distinto
        if (req.path === "/verify") {
            if (!refreshToken) {
                console.log("No está logueado (no hay token ni refresh token)");
                return res.status(200).json({ authenticated: false, message: "No autenticado" });
            }
            return res.status(401).json({ authenticated: false, status: '401', message: "Token requerido" });
        }
        return res.status(401).json({ status: '401', message: "Acceso no autorizado" });
    }

    // Verificar el token
    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log("Error verificando token:", err.message);

                // Si el token está expirado, indicarlo específicamente
                const isExpired = err.name === 'TokenExpiredError';

                if (req.path === "/verify") {
                    console.log("Token inválido y viene del verify");
                    return res.status(401).json({
                        authenticated: false,
                        status: '401',
                        message: isExpired ? "Token expirado" : "Token inválido",
                        expired: isExpired
                    });
                }

                console.log("Token inválido y no viene del verify");
                return res.status(401).json({
                    status: '401',
                    message: isExpired ? "Token expirado" : "Token inválido",
                    expired: isExpired
                });
            }

            req.user = user;

            if (req.path === "/verify") {
                console.log("Token válido y viene de verify");
                return res.status(200).json({ authenticated: true, user });
            }

            next(); // solo se ejecuta si el token es válido y no es /verify
        });
    } catch (err) {
        console.log("Error con el jwt verify", err.message);
        return res.status(500).json({ message: "Error verificando el token", error: err.message });
    }
};


// middleware para verificar si el usuario tiene el rol permitido
const authorizeRoles = (...allowedRoles) => {
    console.log("authorizeRoles", allowedRoles);
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            console.log('req.user.role', req.user.role);
            return res.status(403).json({ message: "No tienes permisos para acceder a esta página." });
        }
        next();
    };
};

export {
    authenticateToken,
    authorizeRoles
} 