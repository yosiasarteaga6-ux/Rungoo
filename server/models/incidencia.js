import mongoose from "mongoose";

const IncidenciaSchema = new mongoose.Schema({
	descripcion: String,
	severidad: String,
	autor: String,
	rol: String,
	fecha: { type: Date, default: Date.now },
});

export const Incidencia = mongoose.model("Incidencia", IncidenciaSchema);
