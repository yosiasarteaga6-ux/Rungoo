const mongoose = require('mongoose');
const { Usuario } = require('../models');

const conectarDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ruta-express');
    console.log("✅ Conectado a MongoDB");
    
    // Crear usuario administrador por defecto si no existe
    const adminExistente = await Usuario.findOne({ rol: 'admin' });
    if (!adminExistente) {
      const adminRoot = new Usuario({
        nombre: 'Administrador Principal',
        rol: 'admin',
        usuario: 'admin',
        clave: 'admin123'
      });
      await adminRoot.save();
      console.log("⭐ Usuario Administrador inicial creado (admin / admin123)");
    }
  } catch (err) {
    console.error("❌ Error de conexión:", err);
    process.exit(1);
  }
};

module.exports = conectarDB;
