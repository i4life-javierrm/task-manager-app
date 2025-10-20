// File: auth.middleware.js (MODIFICADO)
const jwt = require('jsonwebtoken');
// 💡 NUEVO: Necesitas importar el modelo de usuario para buscar el rol
const User = require('../models/user.model'); // <--- ASUME ESTA RUTA
const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_fallback'; 

// 💡 CAMBIO CLAVE: La función debe ser 'async'
module.exports = async (req, res, next) => { 
    const tokenHeader = req.headers.authorization;
    
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado: No se proporcionó token' });
    }
    
    const token = tokenHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 💡 PASO 1: Buscar el usuario para obtener su rol actual del DB
        const user = await User.findById(decoded.userId).select('role');
        
        if (!user) {
            return res.status(401).json({ error: 'Token inválido: Usuario no encontrado en DB.' });
        }
        
        // PASO 2: Adjuntar datos al request
        req.userId = decoded.userId;
        // 💥 NUEVO: Adjuntamos el rol como propiedad separada
        req.userRole = user.role; 
        // 💥 COMPATIBILIDAD: Derivamos el flag isAdmin del nuevo rol
        req.isAdmin = (user.role === 'ADMIN'); 

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};