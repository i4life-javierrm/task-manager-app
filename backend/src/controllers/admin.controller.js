const User = require('../models/user.model'); // Asume que el modelo de Usuario está aquí

// @desc    Obtener todos los usuarios (solo Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        // Excluye el campo 'password' por seguridad
        const users = await User.find().select('-password');
        
        // Verifica si la lista está vacía (aunque normalmente no debería ocurrir si hay un admin)
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No se encontraron usuarios.' });
        }
        
        // Responde con la lista de usuarios (sin contraseñas)
        res.status(200).json(users);
        
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener la lista de usuarios.' });
    }
};

// @desc    Eliminar un usuario (solo Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    const userIdToDelete = req.params.id;
    
    // Evitar que un administrador se elimine a sí mismo
    if (userIdToDelete === req.user._id.toString()) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador a través de esta ruta.' });
    }

    try {
        const user = await User.findByIdAndDelete(userIdToDelete);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Usuario eliminado correctamente.', userId: userIdToDelete });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar usuario.' });
    }
};