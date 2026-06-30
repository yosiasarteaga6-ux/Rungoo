import bcrypt from "bcryptjs";
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

UsuarioSchema.pre("save", async function () {
	if (this.isModified("clave"));
	this.clave = await bcrypt.hash(this.clave, 10);
	return this;
});

export const Usuario = mongoose.model("Usuario", UsuarioSchema);
