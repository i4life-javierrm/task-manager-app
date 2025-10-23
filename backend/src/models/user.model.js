const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Notification = require('./notification.model')

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {type: String, required: true, enum: ['USER', 'ADMIN'], default: 'USER'}
});

// Hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    // Use SALT_ROUNDS from environment variables
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10);
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
});

UserSchema.pre('findOneAndDelete',async function (next)
{
    const userToDelete = await this.model.findOne(this.getFilter()).select('_id')
    if (userToDelete)
    {
        await Notification.deleteMany({user: userToDelete._id})
    }
    next()
})

module.exports = mongoose.model('User', UserSchema);