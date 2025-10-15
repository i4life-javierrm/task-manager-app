const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth.middleware'); // 🔒 Import middleware

// Obtener todas las tareas (Protected)
router.get('/tasks', authMiddleware, async (req, res) => { // 🔒 Apply middleware
    try {
        // SECURITY FIX: Filter tasks by the logged-in user (req.userId)
        const tasks = await Task.find({ user: req.userId }); // 🔒 Only tasks for this user
        res.json(tasks);
    } catch (error) {
        // Mejorar la respuesta de error para evitar exponer detalles internos
        res.status(500).json({ error: 'Error al obtener tareas. Intenta de nuevo más tarde.' });
    }
});

// Agregar una nueva tarea (Protected)
router.post('/tasks', authMiddleware, async (req, res) => { // 🔒 Apply middleware
    try {
        const { title, description } = req.body;
        // Simple validation
        if (!title) return res.status(400).json({ error: "El título es obligatorio" });

        // SECURITY FIX: Assign the logged-in user's ID to the new task
        const newTask = new Task({ title, description, user: req.userId });
        await newTask.save();
        res.status(201).json(newTask); // Use 201 for resource creation
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

// Marcar una tarea como completada (Protected)
router.put('/tasks/:id', authMiddleware, async (req, res) => { // 🔒 Apply middleware
    try {
        const { id } = req.params;
        // SECURITY FIX: Find by ID AND user to ensure the user owns the task
        const task = await Task.findOne({ _id: id, user: req.userId });
        if (!task) return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });

        // Toggle the completed status
        task.completed = !task.completed;

        // 🚀 CRITICAL FIX 2: Set or unset completedAt based on the new status
        if (task.completed) {
            task.completedAt = new Date(); // Set to current date when completing
        } else {
            task.completedAt = null; // Set to null when uncompleting
        }

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// Eliminar una tarea (Protected)
router.delete('/tasks/:id', authMiddleware, async (req, res) => { // 🔒 Apply middleware
    try {
        const { id } = req.params;
        // SECURITY FIX: Delete by ID AND user
        const result = await Task.deleteOne({ _id: id, user: req.userId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });
        }

        res.status(204).send(); // 204 No Content is standard for successful deletion
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

module.exports = router;