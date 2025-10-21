const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth.middleware'); 
const User = require('../models/user.model');

// 1. Obtener todas las tareas (Ruta: /tasks)
router.get('/tasks', authMiddleware, async (req, res) => { 
    try {
        // CAMBIO CRÍTICO: Buscar tareas donde el req.userId esté en el array 'users'
        let findCriteria = { users: { $in: [req.userId] } }; // 🎯 El usuario debe ser parte del array de usuarios

        const isAdminRequest = req.query.all === 'true';

        // Si es administrador y solicita todas las tareas, elimina el filtro de usuario.
        if (req.isAdmin && isAdminRequest) { 
            findCriteria = {}; 
        }

        const tasks = await Task.find(findCriteria)
            // CAMBIO CRÍTICO: Se popula 'users' en lugar de 'user'
            .populate('users', 'username') 
            .exec();

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error al obtener tareas. Intenta de nuevo más tarde.' });
    }
});

// 2. Agregar una nueva tarea (Ruta: /tasks)
// ✨ MODIFICACIÓN: Permite asignar la tarea a un usuario o a varios usuarios (grupo)
router.post('/tasks', authMiddleware, async (req, res) => { 
    try {
        // CAMBIO CRÍTICO: Ahora esperamos un array de 'userIds' opcionalmente.
        const { title, description, tags, userIds } = req.body; 
        
        if (!title) return res.status(400).json({ error: "El título es obligatorio" });

        // Determinar el array de usuarios.
        let assignedUserIds = [req.userId]; 
        
        if (req.isAdmin && Array.isArray(userIds) && userIds.length > 0) {
             const uniqueIds = new Set([...userIds, req.userId]);
             assignedUserIds = Array.from(uniqueIds);
        }
        
        // Verificar que todos los IDs sean válidos antes de crear la tarea
        const validUsers = await User.find({ _id: { $in: assignedUserIds } });
        if (validUsers.length !== assignedUserIds.length) {
            return res.status(400).json({ error: "Uno o más IDs de usuario no son válidos." });
        }


        const newTask = new Task({ 
            title, 
            description, 
            tags: tags || [],
            // CAMBIO CRÍTICO: Asignamos el array de IDs a 'users'
            users: assignedUserIds 
        }); 
        
        await newTask.save();
        // CAMBIO CRÍTICO: Popula 'users' en lugar de 'user'
        await newTask.populate('users', 'username'); 
        
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
        const { title, description, completed, tags } = req.body; 
        
        const completedAt = completed ? new Date() : null;

        // CAMBIO CRÍTICO: El usuario debe ser uno de los asignados para editar la tarea.
        const task = await Task.findOneAndUpdate(
            { _id: id, users: { $in: [req.userId] } }, 
            { title, description, completed, completedAt, tags: tags || [] }, 
            { new: true } 
        )
        // CAMBIO CRÍTICO: Popula 'users'
        .populate('users', 'username');

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
        
        // CAMBIO CRÍTICO: El usuario debe ser uno de los asignados para eliminar la tarea (si no es admin).
        let deleteCriteria = { _id: id, users: { $in: [req.userId] } }; 

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

// 5. 🆕 RUTA CRÍTICA: Añadir/Eliminar Miembros del Equipo (Ruta: /tasks/:id/members)
router.put('/tasks/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Esperamos un array completo de IDs de usuario que deben ser los NUEVOS miembros.
        const { userIds } = req.body; 

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: "Debe proporcionar un array de IDs de usuario válido y no vacío." });
        }

        // 🛡️ VERIFICACIÓN DE PERMISOS: El usuario logeado debe ser miembro de la tarea o un administrador.
        const task = await Task.findOne({ _id: id });
        
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        const isMember = task.users.some(userId => userId.equals(req.userId));
        
        if (!req.isAdmin && !isMember) {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores o miembros de la tarea pueden modificar el equipo." });
        }

        // 🛡️ VERIFICACIÓN DE VALIDEZ DE IDS: Aseguramos que todos los IDs existen.
        const uniqueUserIds = [...new Set(userIds)]; // Eliminamos duplicados
        const existingUsers = await User.find({ _id: { $in: uniqueUserIds } });
        
        if (existingUsers.length !== uniqueUserIds.length) {
            // Identificamos qué IDs fallaron para un mejor feedback (opcional)
            const existingIds = existingUsers.map(u => u._id.toString());
            const invalidIds = uniqueUserIds.filter(id => !existingIds.includes(id));
            return res.status(400).json({ 
                error: "Uno o más IDs de usuario proporcionados no son válidos.", 
                invalidIds 
            });
        }
        
        // 💾 ACTUALIZACIÓN: Reemplazamos el array 'users' completo.
        // Si quisieras solo añadir o solo quitar, la lógica Mongoose sería $addToSet o $pull.
        // Pero para una gestión completa (reemplazo), es más fácil para el Front-end enviar el array final.
        task.users = uniqueUserIds;
        await task.save();
        
        // Popula para devolver la tarea actualizada con los nombres de usuario
        await task.populate('users', 'username'); 

        res.json(task);
    } catch (error) {
        console.error('Error updating task members:', error);
        res.status(500).json({ error: 'Error al actualizar los miembros de la tarea' });
    }
});


module.exports = router;