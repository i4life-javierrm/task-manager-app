const express = require('express'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/user.model'); 
 
const router = express.Router(); 

// auth.routes.js
// FIX: Get SECRET_KEY from environment variables
const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_fallback'; // Must match middleware logic

 
// Registro de usuario 
router.post('/register', async (req, res) => { 
  try { 
    const { username, password } = req.body; 
    //const username = "aaa"
    //const password = "aaa"
    const user = new User({ username, password }); 
    await user.save(); 
    res.status(201).json({ message: 'Usuario creado' }); 
  } catch (error) { 
    res.status(400).json({ error: 'El usuario ya existe' }); 
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
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' }); 
    res.json({ token }); 
  } catch (error) { 
    res.status(500).json({ error: 'Error en el servidor' }); 
  } 
});

module.exports = router;