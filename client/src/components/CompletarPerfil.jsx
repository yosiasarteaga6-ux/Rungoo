import { useState } from "react";
import API_BASE_URL from "../config";

const PREGUNTAS = [
	"¿Cuál es el nombre de tu primera mascota?",
	"¿En qué ciudad naciste?",
	"¿Cuál es el apellido de tu madre?",
	"¿Cuál fue el nombre de tu primera escuela?",
	"¿Cuál es tu color favorito?",
	"¿Cuál es el número de tu casa?",
];

function CompletarPerfil({ usuario, onCompletado, onLogout }) {
	const [nombre, setNombre] = useState(usuario?.nombre || "");
	const [apellido, setApellido] = useState(usuario?.apellido || "");
	const [cedula, setCedula] = useState("");
	const [telefono, setTelefono] = useState("");
	const [direccion, setDireccion] = useState("");
	const [correo, setCorreo] = useState(usuario?.correo || "");
	const [preguntaSeguridad, setPreguntaSeguridad] = useState(PREGUNTAS[0]);
	const [respuestaSeguridad, setRespuestaSeguridad] = useState("");
	const [reconfirmarRespuesta, setReconfirmarRespuesta] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (
			!nombre ||
			!apellido ||
			!cedula ||
			!telefono ||
			!correo ||
			!respuestaSeguridad
		) {
			alert("Por favor completa todos los campos obligatorios para continuar.");
			return;
		}

		if (respuestaSeguridad !== reconfirmarRespuesta) {
			alert("Las respuestas de seguridad no coinciden.");
			return;
		}

		setLoading(true);
		try {
			const resp = await fetch(
				`${API_BASE_URL}/api/usuarios/${usuario._id}/perfil`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						nombre,
						apellido,
						cedula,
						telefono,
						direccion,
						correo,
						preguntaSeguridad,
						respuestaSeguridad,
					}),
				},
			);

			if (resp.ok) {
				const usuarioActualizado = await resp.json();
				alert("¡Perfil completado y guardado con éxito!");
				onCompletado(usuarioActualizado);
			} else {
				alert("Hubo un problema al guardar tu información.");
			}
		} catch (error) {
			alert("Error de conexión. Intenta de nuevo.");
		}
		setLoading(false);
	};

	const inputStyle = {
		width: "100%",
		padding: "10px 12px",
		background: "rgba(28, 40, 51, 0.45)",
		backdropFilter: "blur(12px)",
		WebkitBackdropFilter: "blur(12px)",
		boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
		border: "1px solid #4ade80",
		borderRadius: "8px",
		color: "var(--text-main)",
		boxSizing: "border-box",
		fontSize: "0.9rem",
		outline: "none",
	};

	const labelStyle = {
		color: "var(--text-main)",
		fontSize: "0.85rem",
		marginBottom: "6px",
		display: "block",
	};

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
				padding: "20px",
				background: "#1a1a2e",
			}}
		>
			<div
				style={{
					background: "rgba(20, 40, 20, 0.9)",
					padding: "30px 40px",
					borderRadius: "20px",
					maxWidth: "650px",
					width: "100%",
					border: "1px solid #4ade80",
					boxShadow: "0 0 20px rgba(74, 222, 128, 0.2)",
				}}
			>
				<h2
					style={{
						textAlign: "center",
						color: "#4ade80",
						marginBottom: "10px",
						fontSize: "1.5rem",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "10px",
					}}
				>
					<span>👤</span> ¡Hola! Completemos tu Expediente
				</h2>
				<p
					style={{
						textAlign: "center",
						color: "#e2e8f0",
						marginBottom: "25px",
						fontSize: "0.9rem",
					}}
				>
					Para acceder a tu panel, por favor completa esta información personal.
					Es rápido y seguro.
				</p>

				<form
					onSubmit={handleSubmit}
					style={{ display: "flex", flexDirection: "column", gap: "20px" }}
				>
					{/* Datos Personales */}
					<div>
						<h3
							style={{
								color: "var(--text-main)",
								fontSize: "1.1rem",
								marginBottom: "15px",
								fontWeight: "normal",
							}}
						>
							Datos Personales
						</h3>

						<div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
							<div style={{ flex: 1 }}>
								<label style={labelStyle}>Nombre</label>
								<input
									type="text"
									value={nombre}
									onChange={(e) => setNombre(e.target.value)}
									style={inputStyle}
									required
								/>
							</div>
							<div style={{ flex: 1 }}>
								<label style={labelStyle}>Apellido</label>
								<input
									type="text"
									value={apellido}
									onChange={(e) => setApellido(e.target.value)}
									style={inputStyle}
									required
								/>
							</div>
						</div>

						<div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
							<div style={{ flex: 1, position: "relative" }}>
								<label style={labelStyle}>Cédula de identidad</label>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										position: "relative",
									}}
								>
									<input
										type="text"
										value={cedula}
										onChange={(e) => setCedula(e.target.value)}
										placeholder="Ej: 12345678"
										style={inputStyle}
										required
									/>
									<span
										style={{
											position: "absolute",
											right: "10px",
											color: "#4ade80",
										}}
									>
										🪪
									</span>
								</div>
							</div>
							<div style={{ flex: 1, position: "relative" }}>
								<label style={labelStyle}>Teléfono / Celular</label>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										position: "relative",
									}}
								>
									<input
										type="text"
										value={telefono}
										onChange={(e) => setTelefono(e.target.value)}
										placeholder="Ej: 0414-0000000"
										style={inputStyle}
										required
									/>
									<span
										style={{
											position: "absolute",
											right: "10px",
											color: "#4ade80",
										}}
									>
										📱
									</span>
								</div>
							</div>
						</div>

						<div style={{ display: "flex", gap: "15px" }}>
							<div style={{ flex: 1 }}>
								<label style={labelStyle}>Correo electrónico</label>
								<input
									type="email"
									value={correo}
									onChange={(e) => setCorreo(e.target.value)}
									placeholder="ejemplo@correo.com"
									style={inputStyle}
									required
								/>
							</div>
							<div style={{ flex: 1, position: "relative" }}>
								<label style={labelStyle}>Dirección (opcional)</label>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										position: "relative",
									}}
								>
									<input
										type="text"
										value={direccion}
										onChange={(e) => setDireccion(e.target.value)}
										placeholder="Indica calle, sector"
										style={inputStyle}
									/>
									<span
										style={{
											position: "absolute",
											right: "10px",
											color: "#4ade80",
										}}
									>
										📍
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Configuración de Seguridad */}
					<div>
						<h3
							style={{
								color: "var(--text-main)",
								fontSize: "1.1rem",
								marginBottom: "5px",
								fontWeight: "normal",
							}}
						>
							Configuración de Seguridad
						</h3>
						<div
							style={{
								display: "flex",
								gap: "15px",
								marginBottom: "15px",
								fontSize: "0.8rem",
								color: "#4ade80",
							}}
						>
							<span>✅ Verificación de seguridad</span>
							<span>👤 Privacidad usuario</span>
						</div>

						<div style={{ marginBottom: "15px" }}>
							<label style={labelStyle}>Pregunta de Seguridad</label>
							<select
								value={preguntaSeguridad}
								onChange={(e) => setPreguntaSeguridad(e.target.value)}
								style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
							>
								{PREGUNTAS.map((p, i) => (
									<option key={i} value={p} style={{ background: "#1a1a2e" }}>
										{p}
									</option>
								))}
							</select>
						</div>

						<div style={{ display: "flex", gap: "15px" }}>
							<div style={{ flex: 1, position: "relative" }}>
								<label style={labelStyle}>Respuesta de Seguridad</label>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										position: "relative",
									}}
								>
									<input
										type="password"
										value={respuestaSeguridad}
										onChange={(e) => setRespuestaSeguridad(e.target.value)}
										placeholder="Respuesta secreta"
										style={inputStyle}
										required
									/>
									<span
										style={{
											position: "absolute",
											right: "10px",
											color: "#4ade80",
											cursor: "pointer",
										}}
									>
										👁️‍🗨️
									</span>
								</div>
							</div>
							<div style={{ flex: 1 }}>
								<label style={labelStyle}>Reconfirmar Respuesta</label>
								<input
									type="password"
									value={reconfirmarRespuesta}
									onChange={(e) => setReconfirmarRespuesta(e.target.value)}
									placeholder="Reconfirmar Respuesta"
									style={inputStyle}
									required
								/>
							</div>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						style={{
							background: "linear-gradient(to right, #4ade80, #22c55e)",
							color: "#064e3b",
							fontWeight: "bold",
							padding: "12px",
							borderRadius: "25px",
							border: "none",
							fontSize: "1rem",
							marginTop: "10px",
							cursor: loading ? "not-allowed" : "pointer",
							boxShadow: "0 4px 10px rgba(74, 222, 128, 0.4)",
						}}
					>
						{loading ? "GUARDANDO..." : "CREAR MI EXPEDIENTE"}
					</button>

					{onLogout && (
						<button
							type="button"
							onClick={onLogout}
							style={{
								background: "transparent",
								color: "var(--text-muted)",
								fontWeight: "bold",
								padding: "12px",
								borderRadius: "25px",
								border: "1px solid rgba(255,255,255,0.2)",
								fontSize: "1rem",
								marginTop: "5px",
								cursor: "pointer",
								width: "100%",
								transition: "all 0.2s",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = "rgba(231,76,60,0.15)";
								e.currentTarget.style.color = "#e74c3c";
								e.currentTarget.style.borderColor = "rgba(231,76,60,0.4)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "transparent";
								e.currentTarget.style.color = "rgba(255,255,255,0.6)";
								e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
							}}
						>
							← Cerrar Sesión / Cancelar
						</button>
					)}

					<div
						style={{
							textAlign: "center",
							color: "#4ade80",
							fontSize: "0.85rem",
							marginTop: "-5px",
						}}
					>
						✅ ¡Listo! Todo parece correcto.
					</div>
				</form>
			</div>
		</div>
	);
}

export default CompletarPerfil;
