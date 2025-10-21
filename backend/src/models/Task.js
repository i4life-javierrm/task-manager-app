const mongoose = require('mongoose'); 
const taskSchema = new mongoose.Schema({ 
    title: { type: String, required: true }, 
    completed: { type: Boolean, default: false }, 
    description: { type: String, required: false }, // Campo de descripción
    completedAt: { type: Date, default: null }, // 🚀 CRITICAL FIX 1: Nuevo campo para la fecha de finalización
    // CAMBIO CRÍTICO: 'user' a 'users' y ahora es un array de referencias
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // Ahora es un array
    tags: [{type:String, lowercase:true}],
}, { timestamps: true }); 

const Task = mongoose.model('Task', taskSchema); 
module.exports = Task;