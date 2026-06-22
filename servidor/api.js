const express = require('express');
const router = express.Router();
const { Usuario, Unidad, Incidencia, RegistroLlegada } = require('./models');

// ══════════════════════════════════════════════
// RUTAS: Usuarios
// ══════════════════════════════════════════════

// Registrar usuario
router.post('/usuarios', async (req, res) => {
  try {
    const { nombre, rol, usuario, clave } = req.body;
    const nuevoUsuario = new Usuario({ nombre, rol, usuario, clave });
    await nuevoUsuario.save();
    console.log("👤 Nuevo usuario registrado:", nombre);
    res.status(201).json({ message: "Usuario guardado exitosamente en la base de datos" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Hubo un error al guardar el usuario" });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    const usuarioEncontrado = await Usuario.findOne({ usuario, clave });
    if (usuarioEncontrado) {
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
      res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error del servidor al intentar iniciar sesión" });
  }
});

// Completar perfil
router.put('/usuarios/:id/perfil', async (req, res) => {
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
    console.error("Error adjusting profile:", error);
    res.status(500).json({ message: "Error al guardar el perfil" });
  }
});

// Actualizar sólo seguridad
router.put('/usuarios/:id/seguridad', async (req, res) => {
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

// Recuperar clave - Paso 1: Obtener pregunta de seguridad
router.get('/recuperar-clave/:usuario', async (req, res) => {
  try {
    const u = await Usuario.findOne({ usuario: req.params.usuario });
    if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    if (!u.preguntaSeguridad) return res.status(400).json({ mensaje: 'Este usuario no tiene pregunta de seguridad configurada.' });
    res.status(200).json({ preguntaSeguridad: u.preguntaSeguridad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Recuperar clave - Paso 2: Validar respuesta y cambiar clave
router.post('/recuperar-clave', async (req, res) => {
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

// Obtener todos los usuarios (Admin)
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-clave');
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Verificar admin
router.post('/verify-admin', async (req, res) => {
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

// ══════════════════════════════════════════════
// RUTAS: Unidades
// ══════════════════════════════════════════════

// Registrar unidad
router.post('/unidades', async (req, res) => {
  try {
    const { nombre, modelo, placa, estado, choferAsignado } = req.body;
    const nuevaUnidad = new Unidad({ nombre, modelo, placa, estado, choferAsignado });
    await nuevaUnidad.save();
    res.status(201).json({ message: "Unidad registrada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar la unidad" });
  }
});

// Obtener todas las unidades
router.get('/unidades', async (req, res) => {
  try {
    const unidades = await Unidad.find().sort({ fechaRegistro: -1 });
    res.status(200).json(unidades);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener unidades" });
  }
});

// ══════════════════════════════════════════════
// RUTAS: Incidencias
// ══════════════════════════════════════════════

// Guardar incidencia
router.post('/incidencias', async (req, res) => {
  try {
    const { descripcion, autor, rol } = req.body;
    const nuevaIncidencia = new Incidencia({ descripcion, autor, rol });
    await nuevaIncidencia.save();
    res.status(201).json({ message: "Incidencia guardada con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al guardar incidencia" });
  }
});

// Obtener todas las incidencias (Admin)
router.get('/incidencias', async (req, res) => {
  try {
    const incidencias = await Incidencia.find().sort({ fecha: -1 });
    res.status(200).json(incidencias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener incidencias" });
  }
});

// ══════════════════════════════════════════════
// RUTAS: Llegadas
// ══════════════════════════════════════════════

// Registrar llegada
router.post('/llegadas', async (req, res) => {
  try {
    const { unidadId, nombreUnidad, parada, horaLlegada, registradoPor } = req.body;
    const nuevoRegistro = new RegistroLlegada({ unidadId, nombreUnidad, parada, horaLlegada, registradoPor });
    await nuevoRegistro.save();
    res.status(201).json({ message: "Llegada registrada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar llegada" });
  }
});

// Obtener todos los registros de llegada
router.get('/llegadas', async (req, res) => {
  try {
    const llegadas = await RegistroLlegada.find().sort({ fecha: -1 });
    res.status(200).json(llegadas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener llegadas" });
  }
});

// Modificar registro de llegada
router.put('/llegadas/:id', async (req, res) => {
  try {
    const { parada, horaLlegada } = req.body;
    await RegistroLlegada.findByIdAndUpdate(req.params.id, { parada, horaLlegada });
    res.status(200).json({ message: "Registro modificado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al modificar llegada" });
  }
});

module.exports = router;
