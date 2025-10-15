const jwt = require('jsonwebtoken');
// SECURITY FIX: Get SECRET_KEY from environment variables
const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_fallback'; // Use fallback

module.exports = (req, res, next) => {
    // FIX: Correctly check for token format. The token is the second element.
    const tokenHeader = req.headers.authorization;
    
    // Check if the header exists and starts with 'Bearer '
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado: No se proporcionó token' });
    }
    
    // Extract the token part (after 'Bearer ')
    const token = tokenHeader.split(' ')[1];
    
    try {
        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY);
        // Attach the userId to the request for use in route handlers
        req.userId = decoded.userId;
        // 💥 ADMIN FIX: Attach isAdmin status to the request
        req.isAdmin = decoded.isAdmin || false;
        next();
    } catch (error) {
        // If verification fails (e.g., expired or tampered)
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};