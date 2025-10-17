const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth.middleware'); 

// 1. Obtener todas las tareas (SOLUCIÓN FINAL: Usa req.isAdmin)
router.get('/tasks', authMiddleware, async (req, res) => { 
    try {
        let findCriteria = { user: req.userId }; 
        const isAdminRequest = req.query.all === 'true';

        // 🚀 CORRECCIÓN CRÍTICA: La propiedad correcta es req.isAdmin (booleana)
        // Está garantizada por auth.middleware.js.
        if (req.isAdmin && isAdminRequest) { 
            findCriteria = {}; // Quitar el filtro de usuario para el Admin
        }

        // Usar .populate('user', 'username') es clave para el frontend
        const tasks = await Task.find(findCriteria)
            .populate('user', 'username') 
            .exec();

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error al obtener tareas. Intenta de nuevo más tarde.' });
    }
});

// ... (Resto de las rutas POST y PUT se mantienen igual)

// 4. Eliminar una tarea (Asegurarse de que el Admin pueda eliminar)
router.delete('/tasks/:id', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        
        let deleteCriteria = { _id: id, user: req.userId }; // Por defecto, solo el dueño.

        // 🚀 CORRECCIÓN CRÍTICA: Permitir la eliminación si req.isAdmin es true.
        if (req.isAdmin) {
            deleteCriteria = { _id: id }; 
        }

        const result = await Task.deleteOne(deleteCriteria);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });
        }

        res.status(204).send(); 
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

module.exports = router;