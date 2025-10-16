const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario es un administrador
const admin = (req, res, next) => {
    // El middleware de autenticación (auth.middleware.js) ya debería haber
    // adjuntado el objeto de usuario (incluyendo el rol) a req.user.
    // Si req.user no existe, el middleware de auth falló o no fue aplicado.
    
    if (!req.user || req.user.role !== 'admin') {
        // 403 Forbidden: El usuario está autenticado pero no tiene permiso suficiente
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    
    // Si es administrador, continúa con la siguiente función (controlador)
    next();
};

module.exports = admin;