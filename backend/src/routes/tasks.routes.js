const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth.middleware'); 
const User = require('../models/user.model');
const mongoose = require('mongoose'); // Necesario para la validación de ObjectId

// 1. Obtener todas las tareas ACTIVAS (Ruta: /tasks) - Modificada en el paso anterior
router.get('/tasks', authMiddleware, async (req, res) => { 
    try {
        let findCriteria = { 
            users: { $in: [req.userId] }, 
            isTrashed: false // 🗑️ Filtro: Solo tareas activas
        }; 

        const isAdminRequest = req.query.all === 'true';

        if (req.isAdmin && isAdminRequest) { 
            findCriteria = { isTrashed: false }; 
        }

        const tasks = await Task.find(findCriteria)
            .populate('users', 'username') 
            .exec();

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error al obtener tareas. Intenta de nuevo más tarde.' });
    }
});

// 2. Agregar una nueva tarea (Ruta: /tasks) - Sin cambios
router.post('/tasks', authMiddleware, async (req, res) => { 
    try {
        const { title, description, tags, userIds } = req.body; 
        
        if (!title) return res.status(400).json({ error: "El título de la tarea es obligatorio" });

        let assignedUsers = [];

        if (req.userRole === 'ADMIN' && userIds && Array.isArray(userIds)) {
            assignedUsers = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
            if (assignedUsers.length === 0) {
                 assignedUsers = [req.userId];
            }
        } else {
            assignedUsers = [req.userId];
        }

        const newTask = new Task({
            title,
            description,
            users: assignedUsers, 
            tags: tags || [],
            isTrashed: false, // Aseguramos que las nuevas tareas no estén en la papelera
        });
        
        await newTask.save();
        
        const taskResponse = await newTask.populate('users', 'username _id');
        
        res.status(201).json(taskResponse);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Error al crear la tarea.' });
    }
});

// 3. Edición y Toggle de completado (Ruta: /tasks/:id) - Sin cambios
router.put('/tasks/:id', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        const { title, description, completed, tags } = req.body; 
        
        const completedAt = completed ? new Date() : null;

        // CRITERIO CRÍTICO DE BÚSQUEDA: Añadimos isTrashed: false para no editar tareas en la papelera
        const task = await Task.findOneAndUpdate(
            { _id: id, users: { $in: [req.userId] }, isTrashed: false }, 
            { title, description, completed, completedAt, tags: tags || [] }, 
            { new: true } 
        )
        .populate('users', 'username');

        if (!task) return res.status(404).json({ error: "Tarea no encontrada, no autorizada o ya está en la papelera" });

        res.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// 4. 🗑️ SOFT DELETE (Mover a Papelera) (Ruta: /tasks/:id)
// Esta ruta REEMPLAZA la antigua eliminación permanente (DELETE). 
router.delete('/tasks/:id', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        
        // ⚠️ Criterio de Búsqueda: Debe ser activa y el usuario debe estar asignado
        let updateCriteria = { _id: id, users: { $in: [req.userId] }, isTrashed: false }; 

        // Si es administrador, se elimina el filtro de usuario para permitirle mover cualquier tarea.
        if (req.isAdmin) {
            updateCriteria = { _id: id, isTrashed: false }; 
        }

        const task = await Task.findOneAndUpdate(
            updateCriteria,
            { $set: { isTrashed: true } }, // 🎯 Establecer isTrashed a true
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada, no autorizada o ya está en la papelera" });
        }

        res.status(200).json({ message: "Tarea enviada a la papelera correctamente." }); 
    } catch (error) {
        console.error('Error moving task to trash:', error);
        res.status(500).json({ error: 'Error al enviar la tarea a la papelera' });
    }
});

// 5. 🆕 RUTA DE LISTADO DE PAPELERA (Ruta: /tasks/trashed)
router.get('/tasks/trashed', authMiddleware, async (req, res) => { 
    try {
        // Criterio base: Tareas en la papelera
        let findCriteria = { 
            users: { $in: [req.userId] }, 
            isTrashed: true // 🎯 Filtro: Solo tareas en la papelera
        }; 

        // Si es administrador, puede ver todas las tareas en la papelera
        if (req.isAdmin && req.query.all === 'true') { 
            findCriteria = { isTrashed: true }; 
        }

        const tasks = await Task.find(findCriteria)
            .populate('users', 'username') 
            .exec();

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching trashed tasks:', error);
        res.status(500).json({ error: 'Error al obtener tareas de la papelera.' });
    }
});

// 6. 🆕 RUTA DE RESTAURACIÓN (Ruta: /tasks/:id/restore)
router.put('/tasks/:id/restore', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Criterio: Debe estar en la papelera y el usuario debe estar asignado
        let updateCriteria = { _id: id, users: { $in: [req.userId] }, isTrashed: true }; 

        if (req.isAdmin) {
            updateCriteria = { _id: id, isTrashed: true }; 
        }

        const task = await Task.findOneAndUpdate(
            updateCriteria,
            { $set: { isTrashed: false } }, // 🎯 Restaurar: Establecer isTrashed a false
            { new: true }
        )
        .populate('users', 'username');

        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada, no autorizada o ya está activa" });
        }

        res.json(task);
    } catch (error) {
        console.error('Error restoring task:', error);
        res.status(500).json({ error: 'Error al restaurar la tarea' });
    }
});

// 7. 🆕 RUTA DE ELIMINACIÓN PERMANENTE (Ruta: /tasks/:id/permanent)
// Solo para tareas en la papelera.
router.delete('/tasks/:id/permanent', authMiddleware, async (req, res) => { 
    try {
        const { id } = req.params;
        
        // Criterio: Debe estar en la papelera y el usuario debe estar asignado
        let deleteCriteria = { _id: id, users: { $in: [req.userId] }, isTrashed: true }; 

        // Si es administrador, se elimina el filtro de usuario.
        if (req.isAdmin) {
            deleteCriteria = { _id: id, isTrashed: true }; 
        }

        const result = await Task.deleteOne(deleteCriteria);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Tarea no encontrada, no autorizada o no está en la papelera" });
        }

        res.status(204).send(); // 204 No Content para eliminación exitosa
    } catch (error) {
        console.error('Error permanently deleting task:', error);
        res.status(500).json({ error: 'Error al eliminar la tarea permanentemente' });
    }
});

// 8. RUTA DE GESTIÓN DE MIEMBROS - Sin cambios, pero CRÍTICO: añadimos filtro isTrashed: false al buscar la tarea
router.put('/tasks/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body; 

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: "Debe proporcionar un array de IDs de usuario válido y no vacío." });
        }

        // 🛡️ VERIFICACIÓN DE PERMISOS: Solo tareas ACTIVAS pueden modificar miembros.
        const task = await Task.findOne({ _id: id, isTrashed: false });
        
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada, o está en la papelera." });
        }

        // [ Resto de la lógica de permisos y actualización... ]
        const isMember = task.users.some(userId => userId.equals(req.userId));
        
        if (!req.isAdmin && !isMember) {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores o miembros de la tarea pueden modificar el equipo." });
        }

        const uniqueUserIds = [...new Set(userIds)];
        const existingUsers = await User.find({ _id: { $in: uniqueUserIds } });
        
        if (existingUsers.length !== uniqueUserIds.length) {
            const existingIds = existingUsers.map(u => u._id.toString());
            const invalidIds = uniqueUserIds.filter(id => !existingIds.includes(id));
            return res.status(400).json({ 
                error: "Uno o más IDs de usuario proporcionados no son válidos.", 
                invalidIds 
            });
        }
        
        task.users = uniqueUserIds;
        await task.save();
        
        await task.populate('users', 'username'); 

        res.json(task);
    } catch (error) {
        console.error('Error updating task members:', error);
        res.status(500).json({ error: 'Error al actualizar los miembros de la tarea' });
    }
});


module.exports = router;