import executeQuery from '../database/executeQuery.js';

const verificarAcceso = () => {
  return async (req, res, next) => {
    try {
      // If the user is an admin, grant access immediately
      const esAdmin = req.user?.is_admin;
      if (esAdmin) return next();

      // Check if user has RRHH role in GESTION platform
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          message: 'Usuario no autenticado',
          status: '401',
        });
      }

      const [resultado] = await executeQuery(`
        SELECT COUNT(*) AS tiene_rol
        FROM usuario_rol_plataforma urp
        JOIN rol_plataforma rp ON urp.id_rol_plataforma = rp.id
        JOIN plataforma p ON rp.id_plataforma = p.id
        WHERE urp.id_usuario = ?
        AND p.codigo = 'GESTION'
        AND rp.nombre = 'RRHH'
        AND p.activo = TRUE
      `, [userId]);

      // If user has the RRHH role, allow access
      if (resultado.tiene_rol > 0) {
        return next();
      }

      // Otherwise deny access
      return res.status(403).json({
        message: 'Acceso denegado: se requiere rol RRHH en plataforma GESTION',
        status: '403',
      });
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return res.status(500).json({
        message: 'Error interno al verificar permisos',
        status: '500',
      });
    }
  };
};

export default verificarAcceso;