import mongoose from "mongoose";

const RegistroLlegadaSchema = new mongoose.Schema({
	unidadId: String,
	nombreUnidad: String,
	parada: String,
	horaLlegada: String,
	registradoPor: String,
	fecha: { type: Date, default: Date.now },
});

export const RegistroLlegada = mongoose.model(
	"RegistroLlegada",
	RegistroLlegadaSchema,
);
