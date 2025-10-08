const mongoose = require('mongoose'); 
const taskSchema = new mongoose.Schema({ 
    title: { type: String, required: true }, 
    completed: { type: Boolean, default: false }, 
    // SECURITY/FUNCTIONALITY FIX: Add reference to the User model
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
}, { timestamps: true }); 
const Task = mongoose.model('Task', taskSchema); 
module.exports = Task;