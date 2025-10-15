require('dotenv').config({ path: './variables.env' }); 
const express = require('express'); 
const cors = require('cors'); 
const connectDB = require('./config/db');
const User = require('./models/user.model'); // 💥 Import User model
const bcrypt = require('bcryptjs'); // 💥 Import bcrypt

const app = express(); 
const PORT = process.env.PORT || 5000; 
 
app.use(cors()); 
app.use(express.json()); // Permite recibir JSON en las solicitudes

// 💥 FUNCTION TO ENSURE ADMIN ACCOUNT EXISTS
const ensureAdminUser = async () => {
    try {
        const adminUsername = 'admin';
        const adminPasswordRaw = 'admin'; // Raw password: 'admin'

        // 1. Check if admin user already exists
        let adminUser = await User.findOne({ username: adminUsername });

        if (!adminUser) {
            console.log('Admin user not found. Creating new admin user...');
            
            // 2. Hash the required password ('admin') manually
            const saltRounds = parseInt(process.env.SALT_ROUNDS, 10);
            const hashedPassword = await bcrypt.hash(adminPasswordRaw, saltRounds);

            // 3. Create the user directly (bypassing the pre-save hook for this specific case 
            //    since we already manually hashed it, or letting the hook run if we pass the raw one).
            //    Since the UserSchema pre-save hook handles hashing, we will pass the raw password here.
            adminUser = new User({ 
                username: adminUsername, 
                password: adminPasswordRaw, // The pre-save hook will hash this
                isAdmin: true // Mark as admin
            });
            await adminUser.save();
            console.log('Admin user created successfully with password: "admin"');
        } else {
            // Ensure existing 'admin' user is marked as admin
            if (!adminUser.isAdmin) {
                adminUser.isAdmin = true;
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


// Importar rutas de tareas 
const taskRoutes = require('./routes/tasks.routes'); 
app.use('/api', taskRoutes);

const authRoutes = require('./routes/auth.routes')
app.use('/api', authRoutes);

app.get('/', (req, res) => { 
    res.send('¡Servidor funcionando!'); 
});

app.listen(PORT, () => { 
    console.log(`Servidor corriendo en http://localhost:${PORT}`); 
});