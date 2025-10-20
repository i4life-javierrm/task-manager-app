const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth.middleware'); 
const User = require('../models/user.model');

// 1. Obtener todas las tareas (Ruta: /tasks)
router.get('/tasks', authMiddleware, async (req, res) => { 
    try {
        let findCriteria = { user: req.userId }; 
        const isAdminRequest = req.query.all === 'true';

        // Si es administrador y solicita todas las tareas, elimina el filtro de usuario.
        if (req.isAdmin && isAdminRequest) { 
            findCriteria = {}; 
        }

        const tasks = await Task.find(findCriteria)
            .populate('user', 'username') 
            .exec();

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error al obtener tareas. Intenta de nuevo más tarde.' });
    }
});

// 2. Agregar una nueva tarea (Ruta: /tasks)
// ✨ MODIFICACIÓN: Permite a un admin asignar una tarea a otro usuario
router.post('/tasks', authMiddleware, async (req, res) => { 
    try {
        const { title, description, userId } = req.body; // Capturamos el nuevo campo userId
        
        if (!title) return res.status(400).json({ error: "El título es obligatorio" });

        let assignedUserId = req.userId; // Por defecto, se asigna al usuario que hace la petición
        
        // Lógica de asignación de administrador
        // Si el usuario es administrador Y se proporciona un userId, se usa ese userId.
        if (req.isAdmin && userId) {
            // OPTIONAL: Podrías añadir aquí una comprobación de que el 'userId' existe en la DB.
            assignedUserId = userId;
        } else if (req.isAdmin && userId && req.userId === userId) {
            // Si un admin intenta asignarse a sí mismo, se usa su propio ID
            assignedUserId = req.userId;
        } else if (req.isAdmin && userId && req.userId !== userId) {
            // Si es admin y asigna a otro usuario
            assignedUserId = userId;
        }
        // Nota: Si no es admin, 'assignedUserId' sigue siendo 'req.userId', lo cual es seguro.

        const newTask = new Task({ 
            title, 
            description, 
            user: assignedUserId // Usamos el ID de usuario determinado por la lógica anterior
        }); 
        
        await newTask.save();
        await newTask.populate('user', 'username'); 
        
        res.status(201).json(newTask); 
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

// 3. 🛠️ RUTA CRÍTICA (Ruta: /tasks/:id) - Edición y Toggle de completado
router.put('/tasks/:id', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body; 
        
        const completedAt = completed ? new Date() : null;

        // Utilizamos el filtro de usuario para asegurar que solo el dueño pueda editar (seguridad)
        const task = await Task.findOneAndUpdate(
            { _id: id, user: req.userId }, 
            { title, description, completed, completedAt }, 
            { new: true } 
        )
        .populate('user', 'username');

        if (!task) return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// 4. Eliminar una tarea (Ruta: /tasks/:id)
router.delete('/tasks/:id', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        
        let deleteCriteria = { _id: id, user: req.userId }; 

        // Si es administrador, se elimina el filtro de usuario para permitirle borrar cualquier tarea.
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