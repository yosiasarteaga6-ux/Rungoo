import { Router } from "express";
import { Unidad } from "../models/unidad.js";

const router = Router();

router.post("/unidades", async (req, res) => {
	try {
		const { nombre, modelo, placa, estado, choferAsignado } = req.body;
		const nuevaUnidad = new Unidad({
			nombre,
			modelo,
			placa,
			estado,
			choferAsignado,
		});
		await nuevaUnidad.save();
		res.status(201).json({ message: "Unidad registrada con éxito" });
	} catch (error) {
		res.status(500).json({ message: "Error al registrar la unidad" });
	}
});

router.get("/unidades", async (req, res) => {
	try {
		const unidades = await Unidad.find().sort({ fechaRegistro: -1 });
		res.status(200).json(unidades);
	} catch (error) {
		res.status(500).json({ message: "Error al obtener unidades" });
	}
});

export default router;
