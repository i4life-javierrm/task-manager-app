require('dotenv').config({ path: './variables.env' }); 
const express = require('express'); 
const cors = require('cors'); 
const connectDB = require('./config/db');
const User = require('./models/user.model'); 
const bcrypt = require('bcryptjs'); 

const app = express(); 
const PORT = process.env.PORT || 5000; 
 
app.use(cors()); 
app.use(express.json()); 

// Función para asegurar que existe la cuenta 'admin' (sin cambios)
const ensureAdminUser = async () => {
    try {
        const adminUsername = 'admin';
        const adminPasswordRaw = 'admin'; 

        let adminUser = await User.findOne({ username: adminUsername });

        if (!adminUser) {
            console.log('Admin user not found. Creating new admin user...');
            
            adminUser = new User({ 
                username: adminUsername, 
                password: adminPasswordRaw, 
                role: 'ADMIN' 
            });
            await adminUser.save();
            console.log('Admin user created successfully with password: "admin"');
        } else {
            if (adminUser.role !=='ADMIN') {
                adminUser.role = 'ADMIN';
                await adminUser.save();
                console.log('Existing admin user updated to isAdmin: true.');
            } else {
                console.log('Admin user already exists.');
            }
        }
    } catch (error) {
        console.error('Error ensuring admin user exists:', error.message);
    }
}

// Conectar a MongoDB y luego configurar Admin
connectDB().then(() => {
    ensureAdminUser();
});

// Importar y usar rutas
const taskRoutes = require('./routes/tasks.routes'); 
app.use('/api', taskRoutes);

const authRoutes = require('./routes/auth.routes')
app.use('/api', authRoutes);

// 💥 FIX: Importar rutas de administración usando el nombre versionado que creamos
const adminRoutes = require('./routes/admin.routes');
app.use('/api', adminRoutes); 

app.get('/', (req, res) => { 
    res.send('¡Servidor funcionando!'); 
});

app.listen(PORT, () => { 
    console.log(`Servidor corriendo en http://localhost:${PORT}`); 
});