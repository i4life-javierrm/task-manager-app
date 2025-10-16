const express = require('express');
const { getUsers, deleteUser } = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware'); // Asume que tienes este middleware
const admin = require('../middleware/admin.middleware');

const router = express.Router();

// Nota: Todas las rutas aquí DEBEN usar 'auth' y 'admin' para protección.

// @route GET /api/admin/users
// @desc Obtener todos los usuarios
router.get('/users', auth, admin, getUsers);

// @route DELETE /api/admin/users/:id
// @desc Eliminar un usuario por ID
router.delete('/users/:id', auth, admin, deleteUser);

module.exports = router;