const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/user.model'); // 💥 Importar el modelo de usuario
const bcrypt = require('bcryptjs'); // 💥 Importar bcrypt para la creación del admin

// Rutas
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/tasks.routes');
const adminRoutes = require('./routes/admin.routes'); 

// Cargar variables de entorno
dotenv.config({ path: './variables.env' }); 

// 💥 FUNCIÓN PARA ASEGURAR QUE EL USUARIO ADMIN EXISTA
const ensureAdminUser = async () => {
    try {
        const adminUsername = 'admin';
        const adminPasswordRaw = 'admin'; // Contraseña por defecto: 'admin'

        // 1. Verificar si el usuario admin ya existe
        let adminUser = await User.findOne({ username: adminUsername });

        if (!adminUser) {
            console.log('Admin user not found. Creating new admin user...');
            
            // La pre-save hook en User.model.js se encargará de hashear la contraseña
            adminUser = new User({ 
                username: adminUsername, 
                password: adminPasswordRaw, 
                isAdmin: true // Marcar como admin
            });
            await adminUser.save();
            console.log('Admin user created successfully with password: "admin"');
        } else {
            // Asegurar que el usuario 'admin' existente esté marcado como administrador
            if (!adminUser.isAdmin) {
                adminUser.isAdmin = true;
                await adminUser.save();
                console.log('Existing admin user updated to isAdmin: true.');
            } else {
                console.log('Admin user already exists.');
            }
        }
    } catch (error) {
        // Un error común aquí es si el hash falla o si 'SALT_ROUNDS' no está definido
        console.error('Error ensuring admin user exists:', error.message);
    }
}


const app = express(); 
const PORT = process.env.PORT || 5000; 

// Conectar a MongoDB y luego configurar Admin
connectDB().then(() => {
    // Ejecutar la verificación del administrador después de conectar la DB
    ensureAdminUser();
});


// Middleware
// Permitir CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8100', 
    credentials: true
}));

// Body parser
app.use(express.json()); 

// 🎯 Rutas de la API
app.use('/api', authRoutes); 
app.use('/api/tasks', taskRoutes); 
app.use('/api/admin', adminRoutes); // Rutas de administración

// Ruta de bienvenida simple
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`);
});