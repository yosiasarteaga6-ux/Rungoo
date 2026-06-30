import mongoose from "mongoose";

export async function conectarDB() {
	try {
		const MONGO_URI = process.env.MONGO_URI;

		if (!MONGO_URI) {
			console.error("❌ MONGO_URI no está definida");
			process.exit(1);
		}

		await mongoose.connect(MONGO_URI);
		console.log("✅ Conectado a MongoDB");
	} catch (error) {
		console.error("❌ Error de conexión:", error);
	}
}
