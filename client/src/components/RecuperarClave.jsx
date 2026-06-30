import { useState } from "react";
import API_BASE_URL from "../config";

// const PREGUNTAS = [
//   '¿Cuál es el nombre de tu primera mascota?',
//   '¿En qué ciudad naciste?',
//   '¿Cuál es el apellido de tu madre?',
//   '¿Cuál fue el nombre de tu primera escuela?',
//   '¿Cuál es tu color favorito?',
//   '¿Cuál es el número de tu casa?',
// ];

function RecuperarClave({ onVolver }) {
	const [paso, setPaso] = useState(1); // 1: ingresar usuario, 2: responder pregunta, 3: nueva clave
	const [usuarioInput, setUsuarioInput] = useState("");
	const [pregunta, setPregunta] = useState("");
	const [respuesta, setRespuesta] = useState("");
	const [nuevaClave, setNuevaClave] = useState("");
	const [confirmarClave, setConfirmarClave] = useState("");
	const [loading, setLoading] = useState(false);

	// Paso 1: Buscar usuario y obtener su pregunta de seguridad
	const handleBuscarUsuario = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch(
				`${API_BASE_URL}/api/recuperar-clave/${usuarioInput.trim()}`,
			);
			const data = await res.json();
			if (res.ok) {
				setPregunta(data.preguntaSeguridad);
				setPaso(2);
			} else {
				alert(data.mensaje || "Usuario no encontrado.");
			}
		} catch {
			alert("Error de conexión con el servidor.");
		}
		setLoading(false);
	};

	// Paso 2: Validar respuesta y cambiar clave
	const handleCambiarClave = async (e) => {
		e.preventDefault();
		if (nuevaClave !== confirmarClave) {
			alert("Las contraseñas no coinciden.");
			return;
		}
		if (nuevaClave.length < 4) {
			alert("La contraseña debe tener al menos 4 caracteres.");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE_URL}/api/recuperar-clave`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usuario: usuarioInput, respuesta, nuevaClave }),
			});
			const data = await res.json();
			if (res.ok) {
				setPaso(3);
			} else {
				alert(data.mensaje || "Respuesta incorrecta.");
			}
		} catch {
			alert("Error de conexión con el servidor.");
		}
		setLoading(false);
	};

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				minHeight: "100vh",
				padding: "20px",
			}}
		>
			<div
				style={{
					background: "rgba(255,255,255,0.04)",
					backdropFilter: "blur(30px)",
					border: "1px solid rgba(59, 130, 246,0.25)",
					borderRadius: "24px",
					padding: "50px 45px",
					width: "100%",
					maxWidth: "460px",
					boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
					animation: "cardEntrance 0.6s ease forwards",
				}}
			>
				{/* Ícono de seguridad */}
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginBottom: "20px",
					}}
				>
					<div
						style={{
							width: "70px",
							height: "70px",
							borderRadius: "50%",
							background: "rgba(241,196,15,0.1)",
							border: "2px solid rgba(241,196,15,0.5)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 0 20px rgba(241,196,15,0.2)",
						}}
					>
						<svg width="34" height="34" viewBox="0 0 24 24" fill="none">
							<path
								d="M12 2L3 7v5c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z"
								stroke="#f1c40f"
								strokeWidth="1.8"
								strokeLinejoin="round"
							/>
							<circle
								cx="12"
								cy="11"
								r="2"
								stroke="#f1c40f"
								strokeWidth="1.8"
							/>
							<line
								x1="12"
								y1="13"
								x2="12"
								y2="16"
								stroke="#f1c40f"
								strokeWidth="1.8"
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>

				<h2
					style={{
						textAlign: "center",
						color: "#f1c40f",
						marginBottom: "5px",
						fontSize: "1.4rem",
					}}
				>
					Recuperar Acceso
				</h2>
				<p
					style={{
						textAlign: "center",
						color: "var(--text-muted)",
						fontSize: "0.85rem",
						marginBottom: "30px",
					}}
				>
					{paso === 1 && "Ingresa tu nombre de usuario para continuar."}
					{paso === 2 && "Responde correctamente la pregunta de seguridad."}
					{paso === 3 && "¡Contraseña actualizada con éxito!"}
				</p>

				{/* PASO 1: Usuario */}
				{paso === 1 && (
					<form onSubmit={handleBuscarUsuario}>
						<div className="input-group">
							<label>Nombre de Usuario</label>
							<input
								type="text"
								value={usuarioInput}
								onChange={(e) => setUsuarioInput(e.target.value)}
								placeholder="Ingresa tu usuario"
								required
							/>
						</div>
						<button
							type="submit"
							className="btn-login"
							style={{
								background: "linear-gradient(135deg,#f1c40f,#f39c12)",
								color: "#0f172a",
							}}
							disabled={loading}
						>
							{loading ? "BUSCANDO..." : "🔍 BUSCAR USUARIO"}
						</button>
						<button
							type="button"
							onClick={onVolver}
							style={{
								width: "100%",
								marginTop: "12px",
								background: "transparent",
								border: "1px solid rgba(255,255,255,0.15)",
								color: "var(--text-muted)",
								padding: "12px",
								borderRadius: "12px",
								cursor: "pointer",
								fontSize: "0.9rem",
							}}
						>
							← Volver al Login
						</button>
					</form>
				)}

				{/* PASO 2: Responder pregunta + nueva clave */}
				{paso === 2 && (
					<form onSubmit={handleCambiarClave}>
						<div
							style={{
								background: "rgba(241,196,15,0.08)",
								border: "1px solid rgba(241,196,15,0.3)",
								borderRadius: "12px",
								padding: "15px",
								marginBottom: "20px",
							}}
						>
							<p
								style={{
									color: "#f1c40f",
									margin: 0,
									fontSize: "0.9rem",
									fontWeight: 600,
									marginBottom: "5px",
								}}
							>
								🔐 Pregunta de Seguridad:
							</p>
							<p
								style={{
									color: "var(--text-muted)",
									margin: 0,
									fontSize: "0.95rem",
								}}
							>
								{pregunta}
							</p>
						</div>
						<div className="input-group">
							<label>Tu Respuesta</label>
							<input
								type="text"
								value={respuesta}
								onChange={(e) => setRespuesta(e.target.value)}
								placeholder="Escribe tu respuesta..."
								required
							/>
						</div>
						<div className="input-group">
							<label>Nueva Contraseña</label>
							<input
								type="password"
								value={nuevaClave}
								onChange={(e) => setNuevaClave(e.target.value)}
								placeholder="••••••••"
								required
							/>
						</div>
						<div className="input-group">
							<label>Confirmar Nueva Contraseña</label>
							<input
								type="password"
								value={confirmarClave}
								onChange={(e) => setConfirmarClave(e.target.value)}
								placeholder="••••••••"
								required
							/>
						</div>
						<button
							type="submit"
							className="btn-login"
							style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
							disabled={loading}
						>
							{loading ? "VERIFICANDO..." : "🔑 CAMBIAR CONTRASEÑA"}
						</button>
						<button
							type="button"
							onClick={() => setPaso(1)}
							style={{
								width: "100%",
								marginTop: "12px",
								background: "transparent",
								border: "1px solid rgba(255,255,255,0.15)",
								color: "var(--text-muted)",
								padding: "12px",
								borderRadius: "12px",
								cursor: "pointer",
								fontSize: "0.9rem",
							}}
						>
							← Regresar al Paso Anterior
						</button>
					</form>
				)}

				{/* PASO 3: Éxito */}
				{paso === 3 && (
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: "3rem", marginBottom: "15px" }}>✅</div>
						<p
							style={{
								color: "#3b82f6",
								fontSize: "1.1rem",
								fontWeight: 600,
								marginBottom: "10px",
							}}
						>
							¡Contraseña cambiada exitosamente!
						</p>
						<p
							style={{
								color: "var(--text-muted)",
								fontSize: "0.9rem",
								marginBottom: "25px",
							}}
						>
							Ya puedes iniciar sesión con tu nueva contraseña.
						</p>
						<button onClick={onVolver} className="btn-login">
							🚀 IR AL LOGIN
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default RecuperarClave;
