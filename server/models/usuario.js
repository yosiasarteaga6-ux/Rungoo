import mongoose from "mongoose";

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
	preguntaSeguridad: { type: String, default: "" },
	respuestaSeguridad: { type: String, default: "" },
	perfilCompletado: { type: Boolean, default: false },
	fechaRegistro: { type: Date, default: Date.now },
});

export const Usuario = mongoose.model("Usuario", UsuarioSchema);
