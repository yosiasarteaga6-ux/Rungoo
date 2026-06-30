import mongoose from "mongoose";
import { Usuario } from "./models/usuario.js";

export async function conectarDB() {
	try {
		const MONGO_URI = process.env.MONGO_URI;

		if (!MONGO_URI) {
			console.error("❌ MONGO_URI no está definida");
			process.exit(1);
		}

		await mongoose.connect(MONGO_URI);
		console.log("✅ Conectado a MongoDB");

		const existeAdmin = await Usuario.findOne({ rol: "admin" });

		if (existeAdmin) {
			console.log("✅ Admin ya existe");
			return;
		}

		const admin = new Usuario({
			nombre: "Administrador",
			usuario: "admin",
			rol: "admin",
			clave: "admin",
		});

		await admin.save();
		console.log("✅ Admin creado: ", { usuario: "admin", clave: "admin" });
	} catch (error) {
		console.error("❌ Error de conexión:", error);
	}
}
