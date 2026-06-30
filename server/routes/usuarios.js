import bcrypt from "bcryptjs";
import { Router } from "express";
import { Usuario } from "../models/usuario.js";

const router = Router();

router.post("/usuarios", async (req, res) => {
	try {
		const { nombre, rol, usuario, clave } = req.body;

		const nuevoUsuario = new Usuario({
			nombre,
			rol,
			usuario,
			clave,
		});

		await nuevoUsuario.save();

		console.log("👤 Nuevo usuario registrado:", nombre);
		res
			.status(201)
			.json({ message: "Usuario guardado exitosamente en la base de datos" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Hubo un error al guardar el usuario" });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { usuario, clave } = req.body;

		const usuarioEncontrado = await Usuario.findOne({ usuario });
		if (!usuarioEncontrado) {
			res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
			return;
		}
		const claveCorrecta = await bcrypt.compare(clave, usuarioEncontrado.clave);
		if (!claveCorrecta) {
			res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
			return;
		}

		res.status(200).json({
			mensaje: "Login exitoso",
			usuario: {
				_id: usuarioEncontrado._id,
				nombre: usuarioEncontrado.nombre,
				apellido: usuarioEncontrado.apellido,
				cedula: usuarioEncontrado.cedula,
				telefono: usuarioEncontrado.telefono,
				direccion: usuarioEncontrado.direccion,
				correo: usuarioEncontrado.correo,
				rol: usuarioEncontrado.rol,
				usuario: usuarioEncontrado.usuario,
				preguntaSeguridad: usuarioEncontrado.preguntaSeguridad,
				perfilCompletado: usuarioEncontrado.perfilCompletado,
			},
		});
	} catch (error) {
		console.error("Error en login:", error);
		res
			.status(500)
			.json({ mensaje: "Error del servidor al intentar iniciar sesión" });
	}
});

router.put("/usuarios/:id/perfil", async (req, res) => {
	try {
		const {
			nombre,
			apellido,
			cedula,
			telefono,
			direccion,
			correo,
			preguntaSeguridad,
			respuestaSeguridad,
		} = req.body;
		const usuarioActualizado = await Usuario.findByIdAndUpdate(
			req.params.id,
			{
				nombre,
				apellido,
				cedula,
				telefono,
				direccion,
				correo,
				preguntaSeguridad,
				respuestaSeguridad,
				perfilCompletado: true,
			},
			{ new: true },
		);
		res.status(200).json({
			_id: usuarioActualizado._id,
			nombre: usuarioActualizado.nombre,
			apellido: usuarioActualizado.apellido,
			cedula: usuarioActualizado.cedula,
			telefono: usuarioActualizado.telefono,
			direccion: usuarioActualizado.direccion,
			correo: usuarioActualizado.correo,
			rol: usuarioActualizado.rol,
			usuario: usuarioActualizado.usuario,
			preguntaSeguridad: usuarioActualizado.preguntaSeguridad,
			perfilCompletado: usuarioActualizado.perfilCompletado,
		});
	} catch (error) {
		console.error("Error actualizando perfil:", error);
		res.status(500).json({ message: "Error al guardar el perfil" });
	}
});

router.put("/usuarios/:id/seguridad", async (req, res) => {
	try {
		const { preguntaSeguridad, respuestaSeguridad } = req.body;
		const usuarioActualizado = await Usuario.findByIdAndUpdate(
			req.params.id,
			{ preguntaSeguridad, respuestaSeguridad },
			{ new: true },
		);
		res.status(200).json({
			mensaje: "Seguridad actualizada",
			preguntaSeguridad: usuarioActualizado.preguntaSeguridad,
		});
	} catch (error) {
		console.error("Error actualizando seguridad:", error);
		res.status(500).json({ message: "Error al actualizar seguridad" });
	}
});

router.get("/recuperar-clave/:usuario", async (req, res) => {
	try {
		const u = await Usuario.findOne({ usuario: req.params.usuario });
		if (!u) return res.status(404).json({ mensaje: "Usuario no encontrado" });
		if (!u.preguntaSeguridad)
			return res.status(400).json({
				mensaje: "Este usuario no tiene pregunta de seguridad configurada.",
			});
		res.status(200).json({ preguntaSeguridad: u.preguntaSeguridad });
	} catch (error) {
		res.status(500).json({ mensaje: "Error del servidor" });
	}
});

router.post("/recuperar-clave", async (req, res) => {
	try {
		const { usuario, respuesta, nuevaClave } = req.body;
		const u = await Usuario.findOne({ usuario });
		if (!u) return res.status(404).json({ mensaje: "Usuario no encontrado" });
		const respuestaCorrecta =
			u.respuestaSeguridad &&
			u.respuestaSeguridad.trim().toLowerCase() ===
				respuesta.trim().toLowerCase();
		if (!respuestaCorrecta)
			return res
				.status(401)
				.json({ mensaje: "Respuesta de seguridad incorrecta." });
		u.clave = nuevaClave;
		await u.save();
		res.status(200).json({ mensaje: "Contraseña actualizada exitosamente." });
	} catch (error) {
		res.status(500).json({ mensaje: "Error del servidor" });
	}
});

router.get("/usuarios", async (req, res) => {
	try {
		const usuarios = await Usuario.find({}).select("-clave");
		res.status(200).json(usuarios);
	} catch (error) {
		res.status(500).json({ message: "Error al obtener usuarios" });
	}
});

router.post("/verify-admin", async (req, res) => {
	try {
		const { usuario, clave } = req.body;
		const adminEncontrado = await Usuario.findOne({ usuario, rol: "admin" });
		if (!adminEncontrado) {
			res.status(401).json({
				autorizado: false,
				mensaje: "Credenciales de administrador inválidas",
			});
			return;
		}
		const claveCorrecta = await bcrypt.compare(clave, adminEncontrado.clave);
		if (!claveCorrecta) {
			res.status(401).json({
				autorizado: false,
				mensaje: "Credenciales de administrador inválidas",
			});
			return;
		}

		res.status(200).json({ autorizado: true, mensaje: "Permiso concedido" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error interno verificando administrador" });
	}
});

export default router;
