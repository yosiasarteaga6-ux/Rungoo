import cors from "cors";
import express from "express";
import { conectarDB } from "./db.js";
import usuariosRoutes from "./routes/usuarios.js";
import incidenciasRoutes from "./routes/incidencias.js";
import unidadesRoutes from "./routes/unidades.js";
import llegadasRoutes from "./routes/llegadas.js";

await conectarDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", usuariosRoutes);
app.use("/api", incidenciasRoutes);
app.use("/api", unidadesRoutes);
app.use("/api", llegadasRoutes);

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
	console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
