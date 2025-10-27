const mongoose = require('mongoose'); 
const Notification = require('./notification.model')

const taskSchema = new mongoose.Schema({ 
    title: { type: String, required: true }, 
    completed: { type: Boolean, default: false }, 
    description: { type: String, required: false }, // Campo de descripción
    completedAt: { type: Date, default: null }, // 🚀 CRITICAL FIX 1: Nuevo campo para la fecha de finalización
    // CAMBIO CRÍTICO: 'user' a 'users' y ahora es un array de referencias
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // Ahora es un array
    tags: [{type:String, lowercase:true}],
    isTrashed: {type:Boolean,default:false,},
}, { timestamps: true }); 

taskSchema.pre('deleteOne', async function(next)
{
    const taskToDelete = await this.model.findOne(this.getFilter()).select('_id')
    if (taskToDelete)
    {
        await Notification.deleteMany({task: taskToDelete._id})
    }
    next()
})

const Task = mongoose.model('Task', taskSchema); 
module.exports = Task;