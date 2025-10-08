const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs'); 
const UserSchema = new mongoose.Schema({ 
username: { type: String, required: true, unique: true }, 
password: { type: String, required: true } 
}); 
// Hashear la contraseña antes de guardar 
UserSchema.pre('save', async function (next) { 
if (!this.isModified('password')) return next();  
this.password = await bcrypt.hash(this.password, parseInt(process.env.SALT_ROUNDS)); 
next(); 
}); 
module.exports = mongoose.model('User', UserSchema);