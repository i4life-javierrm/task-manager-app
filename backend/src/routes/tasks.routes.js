const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/user.model'); // 💥 Import User model for admin listing
const authMiddleware = require('../middleware/auth.middleware'); // 争 Import middleware

// Obtener todas las tareas (Protected)
router.get('/tasks', authMiddleware, async (req, res) => { // 争 Apply middleware
    try {
        // 💥 ADMIN FIX: If the user is admin, fetch ALL tasks; otherwise, filter by user ID.
        const filter = req.isAdmin ? {} : { user: req.userId };
        
        const tasks = await Task.find(filter).populate('user', 'username isAdmin'); // Optionally populate user details
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: 'Error al obtener tareas' })
    }
});

// 💥 NEW ADMIN ROUTE: Get all users
router.get('/users', authMiddleware, async (req, res) => {
    // Check for admin permission
    if (!req.isAdmin) {
        return res.status(403).json({ error: 'Acceso denegado: Se requiere privilegios de administrador' });
    }

    try {
        // Find all users, but exclude the password field for security
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Agregar una nueva tarea (Protected)
router.post('/tasks', authMiddleware, async (req, res) => { // 争 Apply middleware
    try {
        const { title, description, user } = req.body;
        if (!title) return res.status(400).json({ error: "El título es obligatorio" });

        // 💥 ADMIN FIX: If an admin posts and specifies a 'user' ID, assign it to that user. 
        // Otherwise, assign it to the logged-in user (req.userId).
        let targetUserId = req.userId;
        
        if (req.isAdmin && user) {
            // Validate if the provided user ID exists before assigning (optional but recommended)
            const targetUser = await User.findById(user);
            if (!targetUser) {
                return res.status(404).json({ error: "El ID de usuario especificado no existe" });
            }
            targetUserId = user;
        }

        // SECURITY FIX: Assign the logged-in user's ID or the target ID to the new task
        const newTask = new Task({ title, description, user: targetUserId });
        await newTask.save();
        res.status(201).json(newTask); // Use 201 for resource creation
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

// Marcar una tarea como completada (Protected)
router.put('/tasks/:id', authMiddleware, async (req, res) => { // 争 Apply middleware
    try {
        const { id } = req.params;
        
        // 💥 ADMIN FIX: If user is admin, they can update any task; otherwise, enforce user ownership.
        const query = req.isAdmin ? { _id: id } : { _id: id, user: req.userId };
        
        const task = await Task.findOne(query);
        if (!task) return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });

        task.completed = !task.completed;
        await task.save();
        res.json(task);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// Eliminar una tarea (Protected)
router.delete('/tasks/:id', authMiddleware, async (req, res) => { // 争 Apply middleware
    try {
        const { id } = req.params;
        
        // 💥 ADMIN FIX: If user is admin, they can delete any task; otherwise, enforce user ownership.
        const query = req.isAdmin ? { _id: id } : { _id: id, user: req.userId };

        const result = await Task.deleteOne(query);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Tarea no encontrada o no autorizada" });
        }
        
        res.json({ message: "Tarea eliminada" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

module.exports = router;