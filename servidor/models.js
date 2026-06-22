const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// MODELO: Usuario
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// MODELO: Unidad
// ─────────────────────────────────────────────
const UnidadSchema = new mongoose.Schema({
  nombre: String,
  modelo: String,
  placa: String,
  estado: String,
  choferAsignado: String,
  fechaRegistro: { type: Date, default: Date.now }
});

const Unidad = mongoose.model('Unidad', UnidadSchema);

// ─────────────────────────────────────────────
// MODELO: Incidencia
// ─────────────────────────────────────────────
const IncidenciaSchema = new mongoose.Schema({
  descripcion: String,
  autor: String,
  rol: String,
  severidad: { type: String, default: 'Moderada' },
  fecha: { type: Date, default: Date.now }
});

const Incidencia = mongoose.model('Incidencia', IncidenciaSchema);

// ─────────────────────────────────────────────
// MODELO: RegistroLlegada
// ─────────────────────────────────────────────
const RegistroLlegadaSchema = new mongoose.Schema({
  unidadId: String,
  nombreUnidad: String,
  parada: String,
  horaLlegada: String,
  registradoPor: String, // Nombre del Fiscal
  fecha: { type: Date, default: Date.now }
});

const RegistroLlegada = mongoose.model('RegistroLlegada', RegistroLlegadaSchema);

// ─────────────────────────────────────────────
// EXPORTACIONES
// ─────────────────────────────────────────────
module.exports = { Usuario, Unidad, Incidencia, RegistroLlegada };
