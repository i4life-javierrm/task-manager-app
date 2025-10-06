const express = require('express'); 
const router = express.Router(); 
// Lista de tareas (por ahora simuladas en memoria) 
let tasks = [ 
{ id: 1, title: "Aprender Node.js", completed: false }, 
{ id: 2, title: "Configurar Express", completed: true } 
];
// Obtener todas las tareas 
router.get('/tasks', (req, res) => { 
    res.json(tasks); 
    }); 
    // Agregar una nueva tarea 
    router.post('/tasks', (req, res) => { 
    const { title } = req.body; 
    if (!title) return res.status(400).json({ error: "El título es obligatorio" }); 
    const newTask = { id: tasks.length + 1, title, 
    completed: false }; 
    tasks.push(newTask); 
    res.json(newTask); 
    }); 
    // Marcar una tarea como completada 
    router.put('/tasks/:id', (req, res) => { 
    const { id } = req.params; 
    const task = tasks.find(t => t.id == id); 
    if (!task) return res.status(404).json({ error: "Tarea no encontrada" }); 
    task.completed = !task.completed; 
    res.json(task); 
    }); 
    // Eliminar una tarea 
    router.delete('/tasks/:id', (req, res) => { 
    const { id } = req.params; 
    tasks = tasks.filter(t => t.id != id); 
    res.json({ message: "Tarea eliminada" }); 
    }); 
    module.exports = router;