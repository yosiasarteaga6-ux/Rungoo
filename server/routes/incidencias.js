import { Router } from "express";
import { Incidencia } from "../models/incidencia.js";

const router = Router();

router.post("/incidencias", async (req, res) => {
	try {
		const { descripcion, autor, rol, severidad } = req.body;
		const nuevaIncidencia = new Incidencia({
			descripcion,
			autor,
			rol,
			severidad,
		});
		await nuevaIncidencia.save();
		res.status(201).json({ message: "Incidencia guardada con éxito" });
	} catch (error) {
		res.status(500).json({ message: "Error al guardar incidencia" });
	}
});

router.get("/incidencias", async (req, res) => {
	try {
		const incidencias = await Incidencia.find().sort({ fecha: -1 });
		res.status(200).json(incidencias);
	} catch (error) {
		res.status(500).json({ message: "Error al obtener incidencias" });
	}
});

export default router;
