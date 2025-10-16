// Verifica que este archivo use la variable de entorno

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 💥 CORRECCIÓN CLAVE: Usamos MONGODB_URI, asumiendo que este es el nombre
        // en tu archivo variables.env (o el que está definido)
        const uri = process.env.MONGODB_URI; 

        if (!uri) {
            // Este error será más claro si la variable no está cargada
            throw new Error('MONGODB_URI is not defined in environment variables. Check variables.env file and that it is being loaded correctly.');
        }

        // Conectar a la base de datos usando la URI
        const conn = await mongoose.connect(uri);

        console.log(`MongoDB conectado exitosamente a: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error de conexión:', error.message);
        // Salir del proceso con fallo
        process.exit(1);
    }
};

module.exports = connectDB;