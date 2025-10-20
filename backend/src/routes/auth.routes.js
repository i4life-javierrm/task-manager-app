const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
 
const router = express.Router();

// auth.routes.js
// FIX: Get SECRET_KEY from environment variables
const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_fallback'; // Must match middleware logic

 
// Function to validate the password against the specified criteria
const validatePassword = (password) => {
    // Trivial array of special characters
    const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';

    // 1. At least 8 characters
    if (password.length < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    
    // 2. At least 1 uppercase letter
    if (!/[A-Z]/.test(password)) {
        return 'La contraseña debe contener al menos 1 letra mayúscula.';
    }

    // 3. At least 1 lowercase letter
    if (!/[a-z]/.test(password)) {
        return 'La contraseña debe contener al menos 1 letra minúscula.';
    }

    // 4. At least 1 number
    if (!/\d/.test(password)) {
        return 'La contraseña debe contener al menos 1 número.';
    }

    // 5. At least 1 special character
    // We escape the special characters for use within a RegExp
    const specialCharRegex = new RegExp(`[${specialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
        // You can list the allowed special characters for better user feedback
        return `La contraseña debe contener al menos 1 caracter especial. Ej: ${specialChars}`;
    }

    // Password is valid
    return null; 
};


// Registro de usuario 
router.post('/register', async (req, res) => { 
  try { 
    const { username, password } = req.body; 

    // --- Start of New Validation Logic ---

    // 1. Username (Email) validation
    // 💥 Admin check: Prevent registration as 'admin' through this route
    if (username.toLowerCase() === 'admin') {
        return res.status(403).json({ error: 'El nombre de usuario "admin" está reservado.' });
    }

    if (!username || !username.includes('@') || !username.includes('.')) {
        return res.status(400).json({ error: 'El nombre de usuario debe ser un email válido (debe contener "@" y ".").' });
    }

    // 2. Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
        return res.status(400).json({ error: passwordError });
    }

    // --- End of New Validation Logic ---
    
    // Original logic proceeds only if validations pass
    // Note: isAdmin defaults to false in the model
    const user = new User({ username, password }); 
    await user.save(); 
    res.status(201).json({ message: 'Usuario creado' }); 
  } catch (error) { 
    // Si el error es una violación de unicidad (usuario duplicado)
    if (error.code === 11000) { 
      return res.status(409).json({ error: 'El usuario ya existe' }); // 409 Conflict es más apropiado para duplicados
    } 
    
    // Para otros errores de validación (ej. campo requerido faltante o fallo de bcrypt)
    res.status(400).json({ error: 'Error de validación: ' + error.message }); 
  } 
});
 
// Inicio de sesión 
router.post('/login', async (req, res) => { 
  try { 
    const { username, password } = req.body; 
    const user = await User.findOne({ username }); 
    if (!user || !(await bcrypt.compare(password, user.password))) { 
      return res.status(401).json({ error: 'Credenciales incorrectas' }); 
    } 
    // 💥 ADMIN FIX: Include isAdmin in the token payload
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' }); 
    res.json({ token, role: user.role }); // Also return isAdmin flag to the frontend
  } catch (error) { 
    res.status(500).json({ error: 'Error en el servidor' }); 
  } 
});

module.exports = router;