import mongoose from "mongoose";

const UnidadSchema = new mongoose.Schema({
	nombre: String,
	modelo: String,
	placa: String,
	estado: String,
	choferAsignado: String,
	fechaRegistro: { type: Date, default: Date.now },
});

export const Unidad = mongoose.model("Unidad", UnidadSchema);
