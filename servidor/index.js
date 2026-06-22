const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors()); // Esto permite que tu React (puerto 3000) le hable a este servidor (puerto 5000)
app.use(express.json()); // Esto permite que el servidor entienda el formato JSON que enviamos

// 2. MODELO DE DATOS (Cómo se guardará el usuario)
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  cedula: String,
  telefono: String,
  direccion: String,
  correo: String,
  rol: String,
  usuario: String,
  clave: String,
  preguntaSeguridad: { type: String, default: '' },
  respuestaSeguridad: { type: String, default: '' },
  perfilCompletado: { type: Boolean, default: false },
  fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

const IncidenciaSchema = new mongoose.Schema({
  descripcion: String,
  autor: String,
  rol: String,
  fecha: { type: Date, default: Date.now }
});

const Incidencia = mongoose.model('Incidencia', IncidenciaSchema);

const UnidadSchema = new mongoose.Schema({
  nombre: String,
  modelo: String,
  placa: String,
  estado: String,
  choferAsignado: String,
  fechaRegistro: { type: Date, default: Date.now }
});

const Unidad = mongoose.model('Unidad', UnidadSchema);

const RegistroLlegadaSchema = new mongoose.Schema({
  unidadId: String,
  nombreUnidad: String,
  parada: String,
  horaLlegada: String,
  registradoPor: String, // Nombre del Fiscal
  fecha: { type: Date, default: Date.now }
});

const RegistroLlegada = mongoose.model('RegistroLlegada', RegistroLlegadaSchema);

// 1. CONEXIÓN A MONGODB
mongoose.connect('mongodb://127.0.0.1:27017/ruta-express')
  .then(async () => {
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
  })
  .catch(err => console.error("❌ Error de conexión:", err));

// 3. RUTA POST PARA RECIBIR DATOS (REGISTRO)
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, rol, usuario, clave } = req.body;
    
    // Creamos el nuevo documento
    const nuevoUsuario = new Usuario({ nombre, rol, usuario, clave });
    
    // Lo guardamos en la base de datos
    await nuevoUsuario.save();
    
    console.log("👤 Nuevo usuario registrado:", nombre);
    res.status(201).json({ message: "Usuario guardado exitosamente en la base de datos" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Hubo un error al guardar el usuario" });
  }
});

// 4. RUTA POST PARA LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    // Buscamos un usuario que coincida
    const usuarioEncontrado = await Usuario.findOne({ usuario, clave });

    if (usuarioEncontrado) {
      // Si existe y la clave es correcta
      res.status(200).json({
        mensaje: "Login exitoso",
        usuario: {
          _id: usuarioEncontrado._id,
          nombre: usuarioEncontrado.nombre,
          apellido: usuarioEncontrado.apellido,
          cedula: usuarioEncontrado.cedula,
          telefono: usuarioEncontrado.telefono,
          direccion: usuarioEncontrado.direccion,
          correo: usuarioEncontrado.correo,
          rol: usuarioEncontrado.rol,
          usuario: usuarioEncontrado.usuario,
          preguntaSeguridad: usuarioEncontrado.preguntaSeguridad,
          perfilCompletado: usuarioEncontrado.perfilCompletado
        }
      });
    } else {
      // Si no existe o la clave es incorrecta
      res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error del servidor al intentar iniciar sesión" });
  }
});

// 4.1 ACTUALIZAR COMPLETAR PERFIL
app.put('/api/usuarios/:id/perfil', async (req, res) => {
  try {
    const { nombre, apellido, cedula, telefono, direccion, correo, preguntaSeguridad, respuestaSeguridad } = req.body;
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nombre, apellido, cedula, telefono, direccion, correo, preguntaSeguridad, respuestaSeguridad, perfilCompletado: true },
      { new: true }
    );
    res.status(200).json({
      _id: usuarioActualizado._id,
      nombre: usuarioActualizado.nombre,
      apellido: usuarioActualizado.apellido,
      cedula: usuarioActualizado.cedula,
      telefono: usuarioActualizado.telefono,
      direccion: usuarioActualizado.direccion,
      correo: usuarioActualizado.correo,
      rol: usuarioActualizado.rol,
      usuario: usuarioActualizado.usuario,
      preguntaSeguridad: usuarioActualizado.preguntaSeguridad,
      perfilCompletado: usuarioActualizado.perfilCompletado
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ message: "Error al guardar el perfil" });
  }
});

// 4.1.1 ACTUALIZAR SÓLO SEGURIDAD
app.put('/api/usuarios/:id/seguridad', async (req, res) => {
  try {
    const { preguntaSeguridad, respuestaSeguridad } = req.body;
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { preguntaSeguridad, respuestaSeguridad },
      { new: true }
    );
    res.status(200).json({
      mensaje: "Seguridad actualizada",
      preguntaSeguridad: usuarioActualizado.preguntaSeguridad
    });
  } catch (error) {
    console.error("Error actualizando seguridad:", error);
    res.status(500).json({ message: "Error al actualizar seguridad" });
  }
});

// 4.2 RECUPERAR CLAVE - Paso 1: Obtener pregunta de seguridad por usuario
app.get('/api/recuperar-clave/:usuario', async (req, res) => {
  try {
    const u = await Usuario.findOne({ usuario: req.params.usuario });
    if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (!u.preguntaSeguridad) return res.status(400).json({ mensaje: 'Este usuario no tiene pregunta de seguridad configurada.' });
    res.status(200).json({ preguntaSeguridad: u.preguntaSeguridad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// 4.3 RECUPERAR CLAVE - Paso 2: Validar respuesta y cambiar clave
app.post('/api/recuperar-clave', async (req, res) => {
  try {
    const { usuario, respuesta, nuevaClave } = req.body;
    const u = await Usuario.findOne({ usuario });
    if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const respuestaCorrecta = u.respuestaSeguridad && u.respuestaSeguridad.trim().toLowerCase() === respuesta.trim().toLowerCase();
    if (!respuestaCorrecta) return res.status(401).json({ mensaje: 'Respuesta de seguridad incorrecta.' });
    u.clave = nuevaClave;
    await u.save();
    res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// 5. OBTENER ESTADO DE USUARIOS Y REPORTES
// Ruta para obtener todos los usuarios (para el Admin)
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).select('-clave'); // Excluimos la clave por seguridad
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Ruta para guardar una incidencia
app.post('/api/incidencias', async (req, res) => {
  try {
    const { descripcion, autor, rol, severidad } = req.body;
    const nuevaIncidencia = new Incidencia({ descripcion, autor, rol, severidad });
    await nuevaIncidencia.save();
    res.status(201).json({ message: "Incidencia guardada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al guardar incidencia" });
  }
});

// Ruta para obtener todas las incidencias (para el Admin)
app.get('/api/incidencias', async (req, res) => {
  try {
    const incidencias = await Incidencia.find().sort({ fecha: -1 }); // Las más recientes primero
    res.status(200).json(incidencias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener incidencias" });
  }
});

// Ruta para guardar una unidad
app.post('/api/unidades', async (req, res) => {
  try {
    const { nombre, modelo, placa, estado, choferAsignado } = req.body;
    const nuevaUnidad = new Unidad({ nombre, modelo, placa, estado, choferAsignado });
    await nuevaUnidad.save();
    res.status(201).json({ message: "Unidad registrada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar la unidad" });
  }
});

// Ruta para obtener todas las unidades
app.get('/api/unidades', async (req, res) => {
  try {
    const unidades = await Unidad.find().sort({ fechaRegistro: -1 });
    res.status(200).json(unidades);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener unidades" });
  }
});

// 6. RUTAS PARA HORARIOS DE LLEGADAS
app.post('/api/llegadas', async (req, res) => {
  try {
    const { unidadId, nombreUnidad, parada, horaLlegada, registradoPor } = req.body;
    const nuevoRegistro = new RegistroLlegada({ unidadId, nombreUnidad, parada, horaLlegada, registradoPor });
    await nuevoRegistro.save();
    res.status(201).json({ message: "Llegada registrada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar llegada" });
  }
});

app.get('/api/llegadas', async (req, res) => {
  try {
    const llegadas = await RegistroLlegada.find().sort({ fecha: -1 });
    res.status(200).json(llegadas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener llegadas" });
  }
});

app.put('/api/llegadas/:id', async (req, res) => {
  try {
    const { parada, horaLlegada } = req.body;
    await RegistroLlegada.findByIdAndUpdate(req.params.id, { parada, horaLlegada });
    res.status(200).json({ message: "Registro modificado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al modificar llegada" });
  }
});

// 7. RUTA DE RE-AUTENTICACIÓN PARA PERMISOS DE ROOT/ADMIN
app.post('/api/verify-admin', async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    const adminEncontrado = await Usuario.findOne({ usuario, clave, rol: 'admin' });
    
    if (adminEncontrado) {
      res.status(200).json({ autorizado: true, mensaje: "Permiso concedido" });
    } else {
      res.status(401).json({ autorizado: false, mensaje: "Credenciales de administrador inválidas" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error interno verificando administrador" });
  }
});

// 4. ENCENDER EL SERVIDOR
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Ruta Express corriendo en http://localhost:${PORT}`);
});