import { Router } from "express";
import { RegistroLlegada } from "../models/registro_llegada.js";

const router = Router();

router.post("/llegadas", async (req, res) => {
	try {
		const { unidadId, nombreUnidad, parada, horaLlegada, registradoPor } =
			req.body;
		const nuevoRegistro = new RegistroLlegada({
			unidadId,
			nombreUnidad,
			parada,
			horaLlegada,
			registradoPor,
		});
		await nuevoRegistro.save();
		res.status(201).json({ message: "Llegada registrada exitosamente" });
	} catch (error) {
		res.status(500).json({ message: "Error al registrar llegada" });
	}
});

router.get("/llegadas", async (req, res) => {
	try {
		const llegadas = await RegistroLlegada.find().sort({ fecha: -1 });
		res.status(200).json(llegadas);
	} catch (error) {
		res.status(500).json({ message: "Error al obtener llegadas" });
	}
});

router.put("/llegadas/:id", async (req, res) => {
	try {
		const { parada, horaLlegada } = req.body;
		await RegistroLlegada.findByIdAndUpdate(req.params.id, {
			parada,
			horaLlegada,
		});
		res.status(200).json({ message: "Registro modificado exitosamente" });
	} catch (error) {
		res.status(500).json({ message: "Error al modificar llegada" });
	}
});

export default router;
