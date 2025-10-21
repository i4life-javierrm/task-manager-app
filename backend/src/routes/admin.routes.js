const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Task = require('../models/Task'); // Asegurar la importación del modelo Task

// Middleware para verificar que el usuario es administrador
const checkAdmin = (req, res, next) => {
    // Verifica el flag isAdmin adjunto por authMiddleware
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador' });
    }
    next();
};

// 1. Obtener todos los usuarios (solo Admin)
router.get('/users', authMiddleware, checkAdmin, async (req, res) => {
    try {
        // Excluir el campo de contraseña
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error al obtener la lista de usuarios.' });
    }
});

// 2. Eliminar un usuario por ID (solo Admin)
router.delete('/users/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const userToDelete = await User.findById(id);

        if (!userToDelete) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        
        // Bloquear la eliminación de la cuenta admin 
        if (userToDelete.role === 'ADMIN') {
             return res.status(403).json({ error: 'No se puede eliminar una cuenta de administrador.' });
        }
        
        // No permitir que un usuario se elimine a sí mismo (la ruta está protegida, pero es una buena práctica)
        if (userToDelete._id.toString() === req.userId) {
             return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta desde aquí.' });
        }

        const result = await User.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado para eliminar.' });
        }

        // 🚀 NUEVA LÓGICA DE ELIMINACIÓN DE TAREAS PARA GRUPOS 🚀
        
        // PASO 1: Quitar al usuario del array 'users' en todas las tareas asignadas
        const updateResult = await Task.updateMany(
            { users: id }, // Criterio: La tarea contiene el ID del usuario en el array 'users'
            { $pull: { users: id } } // Acción: Quita el ID del usuario del array
        );

        // PASO 2: Eliminar las tareas que se hayan quedado sin ningún usuario
        // Esto cubre las tareas individuales que desaparecen si su único usuario es eliminado.
        await Task.deleteMany({ 
            users: { $size: 0 } // Criterio: La longitud del array 'users' es cero
        });
        
        // El usuario ha sido eliminado, y sus tareas han sido reasignadas o eliminadas.
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
});

module.exports = router;