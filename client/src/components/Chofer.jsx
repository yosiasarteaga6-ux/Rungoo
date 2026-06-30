import {
	AlertTriangle,
	Bus,
	Home,
	Map,
	MapPin,
	Shield,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import Clock from "./Clock";
import CompletarPerfil from "./CompletarPerfil";
import ThemeToggle from "./ThemeToggle";

function Chofer({ usuario, onLogout, onUpdateUser }) {
	const [incidencia, setIncidencia] = useState("");
	const [severidad, setSeveridad] = useState("Moderada");
	const [vistaActiva, setVistaActiva] = useState("home"); // 'home', 'expediente', 'ruta', 'flota', 'paradas', 'incidencia', 'seguridad'
	const [menuAbierto, setMenuAbierto] = useState(false);

	const [listaUnidades, setListaUnidades] = useState([]);
	const [listaLlegadas, setListaLlegadas] = useState([]);
	const [listaIncidencias, setListaIncidencias] = useState([]);
	const [rutaActiva, setRutaActiva] = useState(false);

	// Selector de Paradas
	const [paradaChoferSeleccionada, setParadaChoferSeleccionada] =
		useState(null);

	// Estados para Seguridad
	const [editandoSeguridad, setEditandoSeguridad] = useState(false);
	const [preguntaTmp, setPreguntaTmp] = useState(
		usuario.preguntaSeguridad || "¿Cuál es el nombre de tu primera mascota?",
	);
	const [respuestaTmp, setRespuestaTmp] = useState("");
	const [guardandoSeg, setGuardandoSeg] = useState(false);

	const nombreChofer = usuario ? usuario.nombre : "Chofer Desconocido";

	useEffect(() => {
		// Al cargar el componente o cambiar de vista, bajamos la data
		if (
			vistaActiva === "home" ||
			vistaActiva === "ruta" ||
			vistaActiva === "flota"
		) {
			fetch(`${API_BASE_URL}/api/unidades`)
				.then((res) => res.json())
				.then((data) => setListaUnidades(data))
				.catch((err) => console.error(err));
		}
		if (vistaActiva === "paradas") {
			fetch(`${API_BASE_URL}/api/llegadas`)
				.then((res) => res.json())
				.then((data) => setListaLlegadas(data))
				.catch((err) => console.error(err));
		}
		if (vistaActiva === "incidencia") {
			fetch(`${API_BASE_URL}/api/incidencias`)
				.then((res) => res.json())
				.then((data) => setListaIncidencias(data))
				.catch((err) => console.error(err));
		}
	}, [vistaActiva]);

	if (usuario && !usuario.perfilCompletado) {
		return (
			<CompletarPerfil
				usuario={usuario}
				onCompletado={onUpdateUser}
				onLogout={onLogout}
			/>
		);
	}

	// Buscar la unidad asignada a este chofer
	const unidadAsignada = listaUnidades.find(
		(u) => u.choferAsignado === nombreChofer,
	);

	const handleEnviarIncidencia = async (e) => {
		e.preventDefault();
		if (!incidencia.trim()) return;
		try {
			const respuesta = await fetch(`${API_BASE_URL}/api/incidencias`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					descripcion: incidencia,
					autor: nombreChofer,
					rol: "Chofer",
					severidad: severidad,
				}),
			});

			if (respuesta.ok) {
				alert("Incidencia enviada correctamente.");
				setIncidencia("");
				// Refrescar la lista de incidencias
				const refetch = await fetch(`${API_BASE_URL}/api/incidencias`);
				const newData = await refetch.json();
				setListaIncidencias(newData);
			} else {
				alert("Hubo un error al enviar la incidencia.");
			}
		} catch (error) {
			alert("Error de conexión con el servidor.");
		}
	};

	const handleIniciarRuta = async () => {
		if (rutaActiva) {
			alert("La ruta ya se encuentra activa.");
			return;
		}

		const mensaje = unidadAsignada
			? `JORNADA INICIADA: El chofer ya va en camino cubriendo la ruta con la unidad ${unidadAsignada.nombre} (${unidadAsignada.placa}).`
			: `JORNADA INICIADA: El chofer ya va en camino (A la espera de unidad asignada).`;

		try {
			const respuesta = await fetch(`${API_BASE_URL}/api/incidencias`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					descripcion: mensaje,
					autor: nombreChofer,
					rol: "Chofer (Sistema Central)",
				}),
			});

			if (respuesta.ok) {
				setRutaActiva(true);
				alert("¡Jornada iniciada! El sistema central ha sido notificado.");
			} else {
				alert("Error al notificar al sistema central.");
			}
		} catch (error) {
			alert("Error de conexión al iniciar ruta.");
		}
	};

	const handleGuardarSeguridad = async (e) => {
		e.preventDefault();
		if (!respuestaTmp) {
			alert("Debes escribir una respuesta.");
			return;
		}
		setGuardandoSeg(true);
		try {
			const resp = await fetch(
				`${API_BASE_URL}/api/usuarios/${usuario._id}/seguridad`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						preguntaSeguridad: preguntaTmp,
						respuestaSeguridad: respuestaTmp,
					}),
				},
			);
			if (resp.ok) {
				alert("Seguridad actualizada correctamente.");
				onUpdateUser({ ...usuario, preguntaSeguridad: preguntaTmp });
				setEditandoSeguridad(false);
				setRespuestaTmp("");
			} else {
				alert("Error al actualizar la seguridad.");
			}
		} catch (err) {
			alert("Error de conexión.");
		}
		setGuardandoSeg(false);
	};

	const getSidebarClass = (current) =>
		vistaActiva === current ? "sidebar-btn active" : "sidebar-btn";
	const cerrarMenu = () => setMenuAbierto(false);

	return (
		<div className="dashboard-container">
			<button
				className="hamburger-btn"
				onClick={() => setMenuAbierto(!menuAbierto)}
				aria-label="Menú"
			>
				<span className="hamburger-bar"></span>
				<span className="hamburger-bar"></span>
				<span className="hamburger-bar"></span>
			</button>
			{menuAbierto && (
				<div className="sidebar-overlay visible" onClick={cerrarMenu} />
			)}
			{/* MENÚ LATERAL */}
			<aside className={`sidebar${menuAbierto ? " sidebar-open" : ""}`}>
				<div className="sidebar-profile">
					<img
						src="/logo.png"
						alt="Ruta Express Logo"
						style={{
							width: "80px",
							height: "auto",
							marginBottom: "10px",
							filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.4))",
						}}
						onError={(e) => (e.target.style.display = "none")}
					/>
					<div
						style={{
							width: "48px",
							height: "48px",
							borderRadius: "50%",
							background: "linear-gradient(135deg, #3b82f6, #2563eb)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "1.4rem",
							fontWeight: 900,
							color: "var(--text-main)",
							margin: "0 auto 10px",
						}}
					>
						{nombreChofer.charAt(0).toUpperCase()}
					</div>
					<h3
						style={{
							color: "var(--text-main)",
							margin: "0 0 2px 0",
							fontSize: "1rem",
							fontWeight: 700,
						}}
					>
						{nombreChofer}
					</h3>
					<p
						style={{
							color: "#3b82f6",
							margin: "0 0 6px 0",
							fontSize: "0.78rem",
							textTransform: "uppercase",
							letterSpacing: "1px",
						}}
					>
						Chofer
					</p>
					<span
						style={{
							background: "rgba(59, 130, 246,0.15)",
							color: "#3b82f6",
							fontSize: "0.72rem",
							padding: "2px 10px",
							borderRadius: "20px",
							border: "1px solid rgba(59, 130, 246,0.3)",
						}}
					>
						● En línea
					</span>
				</div>

				<Clock />

				<nav className="sidebar-menu">
					<button
						className={getSidebarClass("home")}
						onClick={() => {
							setVistaActiva("home");
							cerrarMenu();
						}}
					>
						<Home size={18} /> Inicio
					</button>
					<button
						className={getSidebarClass("expediente")}
						onClick={() => {
							setVistaActiva("expediente");
							cerrarMenu();
						}}
					>
						<User size={18} /> Mi Expediente
					</button>
					<button
						className={getSidebarClass("ruta")}
						onClick={() => {
							setVistaActiva("ruta");
							cerrarMenu();
						}}
					>
						<Bus size={18} /> Mi Unidad Asignada
					</button>
					<button
						className={getSidebarClass("flota")}
						onClick={() => {
							setVistaActiva("flota");
							cerrarMenu();
						}}
					>
						<Map size={18} /> Flota de la Ruta
					</button>
					<button
						className={getSidebarClass("paradas")}
						onClick={() => {
							setVistaActiva("paradas");
							setParadaChoferSeleccionada(null);
							cerrarMenu();
						}}
					>
						<MapPin size={18} /> Paradas
					</button>
					<button
						className={getSidebarClass("incidencia")}
						onClick={() => {
							setVistaActiva("incidencia");
							cerrarMenu();
						}}
					>
						<AlertTriangle size={18} /> Reportar Novedad
					</button>
					<button
						className={getSidebarClass("seguridad")}
						onClick={() => {
							setVistaActiva("seguridad");
							cerrarMenu();
						}}
					>
						<Shield size={18} /> Seguridad
					</button>
				</nav>

				<ThemeToggle
					style={{
						width: "100%",
						marginBottom: "10px",
						justifyContent: "center",
					}}
				/>
				<button onClick={onLogout} className="btn-logout">
					🚪 Cerrar Sesión
				</button>
			</aside>

			{/* NAVEGACIÓN INFERIOR (MÓVIL) */}
			<nav className="bottom-nav">
				<button
					className={`bottom-nav-item ${vistaActiva === "home" ? "active" : ""}`}
					onClick={() => setVistaActiva("home")}
				>
					<Home className="nav-icon" size={24} />
					<span>Inicio</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "ruta" ? "active" : ""}`}
					onClick={() => setVistaActiva("ruta")}
				>
					<Bus className="nav-icon" size={24} />
					<span>Unidad</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "paradas" ? "active" : ""}`}
					onClick={() => setVistaActiva("paradas")}
				>
					<MapPin className="nav-icon" size={24} />
					<span>Paradas</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "incidencia" ? "active" : ""}`}
					onClick={() => setVistaActiva("incidencia")}
				>
					<AlertTriangle className="nav-icon" size={24} />
					<span>Reporte</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "expediente" ? "active" : ""}`}
					onClick={() => setVistaActiva("expediente")}
				>
					<User className="nav-icon" size={24} />
					<span>Perfil</span>
				</button>
			</nav>

			{/* CONTENIDO PRINCIPAL */}
			<main className="main-content">
				<div
					className="main-header"
					style={{ display: "flex", alignItems: "center", gap: "15px" }}
				>
					{vistaActiva !== "home" && (
						<button
							onClick={() => setVistaActiva("home")}
							style={{
								background: "transparent",
								border: "none",
								color: "var(--text-main)",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: "5px",
								fontSize: "1rem",
								padding: "5px",
							}}
						>
							<span style={{ fontSize: "1.2rem" }}>⬅</span> Regresar
						</button>
					)}
					<h2>
						{vistaActiva === "expediente" && "Mi Expediente Personal"}
						{vistaActiva === "ruta" && "Detalles de mi Asignación"}
						{vistaActiva === "flota" && "Toda la Flota"}
						{vistaActiva === "paradas" && "Bitácora de Paradas"}
						{vistaActiva === "incidencia" && "Central de Reportes"}
						{vistaActiva === "seguridad" && "Configuración de Seguridad"}
					</h2>
				</div>

				{vistaActiva === "home" && (
					<div
						className="fade-in-tab"
						style={{
							padding: "10px 20px",
							maxWidth: "1200px",
							margin: "0 auto",
						}}
					>
						{/* Header / Bienvenida */}
						<div style={{ marginBottom: "30px" }}>
							<p
								style={{
									color: "var(--text-muted)",
									fontSize: "0.85rem",
									letterSpacing: "1px",
									textTransform: "uppercase",
									margin: "0 0 8px 0",
								}}
							>
								PANEL DEL CHOFER
							</p>
							<h2
								style={{
									color: "#f39c12",
									fontSize: "2rem",
									margin: "0 0 10px 0",
									display: "flex",
									alignItems: "center",
									gap: "10px",
								}}
							>
								<span style={{ color: "var(--text-main)" }}>
									¡Hola, {nombreChofer}!
								</span>{" "}
								¡Listo para la ruta?
							</h2>
							<p
								style={{
									color: "var(--text-muted)",
									fontSize: "1rem",
									margin: "0 0 12px 0",
								}}
							>
								Hoy,{" "}
								{new Date().toLocaleDateString("es-ES", {
									day: "numeric",
									month: "long",
								})}
								,{" "}
								{unidadAsignada
									? `tienes asignada la ${unidadAsignada.nombre}`
									: "no tienes unidad asignada"}
								. Revisa tu itinerario.
							</p>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									color: "#4ade80",
									fontSize: "1rem",
								}}
							>
								<span
									style={{
										background: "#4ade80",
										borderRadius: "50%",
										width: "22px",
										height: "22px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#1a1a2e",
										fontWeight: "bold",
									}}
								>
									✓
								</span>
								{unidadAsignada
									? "Vehículo en óptimo estado"
									: "Sin vehículo asignado"}
							</div>
						</div>

						<h3
							style={{
								color: "var(--text-main)",
								fontSize: "1.1rem",
								marginBottom: "20px",
								letterSpacing: "1px",
								textTransform: "uppercase",
							}}
						>
							RESUMEN DEL DÍA
						</h3>

						{/* Grid Principal */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
								gap: "20px",
								alignItems: "stretch",
							}}
						>
							{/* Columna Izquierda: Unidad */}
							<div
								style={{
									background:
										"linear-gradient(145deg, rgba(74, 222, 128, 0.15) 0%, rgba(20, 50, 30, 0.6) 100%)",
									border: "1px solid rgba(74, 222, 128, 0.3)",
									borderRadius: "24px",
									padding: "25px",
									display: "flex",
									flexDirection: "column",
									boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										color: "var(--text-main)",
										marginBottom: "20px",
										fontWeight: "bold",
									}}
								>
									<span>Mi Unidad (Hoy)</span>
									<span style={{ color: "#4ade80", cursor: "pointer" }}>⚙️</span>
								</div>

								{unidadAsignada ? (
									<>
										<div
											style={{
												flex: 1,
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
												marginBottom: "20px",
												padding: "20px 0",
											}}
										>
											{/* Bus Emoji representation */}
											<div
												style={{
													fontSize: "7rem",
													filter:
														"drop-shadow(0 10px 15px rgba(74,222,128,0.4))",
												}}
											>
												🚌
											</div>
										</div>
										<h4
											style={{
												color: "var(--text-main)",
												margin: "0 0 15px 0",
												textAlign: "center",
												textTransform: "uppercase",
												fontSize: "1.1rem",
											}}
										>
											{unidadAsignada.nombre} (AUTOBÚS URBANO)
										</h4>

										<div
											style={{
												display: "flex",
												flexDirection: "column",
												gap: "10px",
												marginBottom: "25px",
											}}
										>
											<div
												style={{
													color: "var(--text-muted)",
													fontSize: "0.9rem",
													display: "flex",
													justifyContent: "space-between",
												}}
											>
												<span>Matrícula:</span>{" "}
												<span
													style={{
														color: "var(--text-main)",
														fontWeight: "bold",
													}}
												>
													[{unidadAsignada.placa}]
												</span>
											</div>
											<div
												style={{
													color: "var(--text-muted)",
													fontSize: "0.9rem",
													display: "flex",
													justifyContent: "space-between",
												}}
											>
												<span>Ruta Asignada:</span>{" "}
												<span
													style={{
														color: "var(--text-main)",
														textAlign: "right",
														maxWidth: "65%",
													}}
												>
													Las Calderas
												</span>
											</div>
										</div>

										<button
											onClick={() => setVistaActiva("ruta")}
											style={{
												background: "rgba(74, 222, 128, 0.1)",
												border: "1px solid #4ade80",
												color: "#4ade80",
												padding: "12px",
												borderRadius: "12px",
												cursor: "pointer",
												width: "100%",
												transition: "all 0.3s",
												fontWeight: "bold",
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background =
													"rgba(74, 222, 128, 0.2)";
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background =
													"rgba(74, 222, 128, 0.1)";
											}}
										>
											Ver Detalle del Vehículo
										</button>
									</>
								) : (
									<div
										style={{
											color: "var(--text-muted)",
											textAlign: "center",
											marginTop: "40px",
										}}
									>
										No hay unidad asignada
									</div>
								)}
							</div>

							{/* Columna Centro: Turno y Botones */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "20px",
								}}
							>
								<div
									style={{
										background: "rgba(255,255,255,0.03)",
										border: "1px solid rgba(255,255,255,0.08)",
										borderRadius: "24px",
										padding: "25px",
										display: "flex",
										gap: "20px",
										boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
									}}
								>
									<div
										style={{
											flex: 1,
											borderRight: "1px solid rgba(255,255,255,0.1)",
											paddingRight: "20px",
										}}
									>
										<div
											style={{
												color: "var(--text-main)",
												marginBottom: "8px",
												fontWeight: "bold",
											}}
										>
											Mi Turno
										</div>
										<div
											style={{ color: "var(--text-muted)", fontSize: "1rem" }}
										>
											06:00 a. m. - 02:00 p. m.
										</div>
									</div>
									<div style={{ flex: 1, paddingLeft: "10px" }}>
										<div
											style={{
												color: "var(--text-main)",
												marginBottom: "8px",
												display: "flex",
												alignItems: "center",
												gap: "8px",
												fontWeight: "bold",
											}}
										>
											<span style={{ color: "#ef4444", fontSize: "1.2rem" }}>
												📍
											</span>{" "}
											Siguiente Parada
										</div>
										<div
											style={{ color: "var(--text-muted)", fontSize: "1rem" }}
										>
											03:55 p. m.
										</div>
									</div>
								</div>

								{/* Grid de botones de acción */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr",
										gap: "15px",
										flex: 1,
										marginBottom: "15px",
									}}
								>
									<button
										onClick={handleIniciarRuta}
										style={{
											background: rutaActiva
												? "rgba(59, 130, 246, 0.2)"
												: "linear-gradient(135deg, #e74c3c, #c0392b)",
											border: rutaActiva ? "2px solid #3b82f6" : "none",
											borderRadius: "20px",
											padding: "25px",
											color: rutaActiva ? "#3b82f6" : "white",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											gap: "10px",
											cursor: rutaActiva ? "default" : "pointer",
											transition: "all 0.3s",
											boxShadow: rutaActiva
												? "none"
												: "0 10px 25px rgba(231, 76, 60, 0.4)",
											textTransform: "uppercase",
											fontWeight: "900",
											letterSpacing: "2px",
											fontSize: "1.2rem",
										}}
										onMouseEnter={(e) => {
											if (!rutaActiva)
												e.currentTarget.style.transform = "scale(1.02)";
										}}
										onMouseLeave={(e) => {
											if (!rutaActiva)
												e.currentTarget.style.transform = "scale(1)";
										}}
									>
										<div style={{ fontSize: "2.5rem" }}>
											{rutaActiva ? "✅" : "🚀"}
										</div>
										{rutaActiva ? "RUTA EN CURSO" : "INICIAR RUTA ACTUAL"}
									</button>
								</div>

								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "15px",
									}}
								>
									{[
										{ label: "Ver Clima en Ruta", icon: "☁️", color: "#60a5fa" },
										{
											label: "Servicio Técnico Rápido",
											icon: "🛠️",
											color: "#a855f7",
										},
										{
											label: "Asistencia Ruta Express",
											icon: "❓",
											color: "#2dd4bf",
										},
									].map((btn, idx) => (
										<button
											key={idx}
											style={{
												background: "rgba(255,255,255,0.03)",
												border: "1px solid rgba(255,255,255,0.08)",
												borderRadius: "16px",
												padding: "15px",
												color: "var(--text-main)",
												display: "flex",
												alignItems: "center",
												gap: "10px",
												cursor: "pointer",
												transition: "all 0.3s",
												textAlign: "left",
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background =
													"rgba(255,255,255,0.08)";
												e.currentTarget.style.transform = "translateY(-2px)";
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background =
													"rgba(255,255,255,0.03)";
												e.currentTarget.style.transform = "translateY(0)";
											}}
										>
											<div
												style={{
													background: `${btn.color}20`,
													borderRadius: "10px",
													width: "35px",
													height: "35px",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: "1rem",
												}}
											>
												{btn.icon}
											</div>
											<span
												style={{
													fontSize: "0.85rem",
													lineHeight: "1.2",
													fontWeight: "500",
												}}
											>
												{btn.label}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Columna Derecha: Perfil */}
							<div
								style={{
									background: "rgba(255,255,255,0.03)",
									border: "1px solid rgba(255,255,255,0.08)",
									borderRadius: "24px",
									padding: "25px",
									display: "flex",
									flexDirection: "column",
									boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
								}}
							>
								<h4
									style={{
										color: "var(--text-main)",
										margin: "0 0 25px 0",
										textTransform: "uppercase",
										fontSize: "1rem",
										fontWeight: "bold",
									}}
								>
									MI PERFIL Y ESTADÍSTICAS
								</h4>

								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "15px",
										marginBottom: "35px",
									}}
								>
									<div
										style={{
											width: "60px",
											height: "60px",
											borderRadius: "50%",
											background: "linear-gradient(135deg, #3b82f6, #2563eb)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "1.8rem",
											fontWeight: 900,
											color: "var(--text-main)",
											boxShadow: "0 4px 15px rgba(59, 130, 246,0.3)",
										}}
									>
										{nombreChofer.charAt(0).toUpperCase()}
									</div>
									<div>
										<div
											style={{
												color: "var(--text-main)",
												fontSize: "1.2rem",
												fontWeight: "bold",
											}}
										>
											{nombreChofer}
										</div>
										<div
											style={{
												color: "var(--text-muted)",
												fontSize: "0.85rem",
											}}
										>
											Chofer Autorizado
										</div>
									</div>
								</div>

								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: "25px",
										background: "rgba(28, 40, 51, 0.45)",
										backdropFilter: "blur(12px)",
										WebkitBackdropFilter: "blur(12px)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
										padding: "15px",
										borderRadius: "16px",
									}}
								>
									<div>
										<div
											style={{
												color: "var(--text-main)",
												marginBottom: "5px",
												fontSize: "0.9rem",
											}}
										>
											Puntualidad Global
										</div>
										<div
											style={{
												color: "var(--text-muted)",
												fontSize: "0.85rem",
											}}
										>
											[98%]
										</div>
									</div>
									<div
										style={{
											width: "55px",
											height: "55px",
											borderRadius: "50%",
											border: "4px solid #4ade80",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color: "var(--text-main)",
											fontWeight: "bold",
											fontSize: "1rem",
											position: "relative",
										}}
									>
										98%
										<svg
											style={{
												position: "absolute",
												top: "-4px",
												left: "-4px",
												width: "63px",
												height: "63px",
												transform: "rotate(-90deg)",
											}}
										>
											<circle
												cx="31.5"
												cy="31.5"
												r="27.5"
												fill="none"
												stroke="#4ade80"
												strokeWidth="4"
												strokeDasharray="172"
												strokeDashoffset="4"
												strokeLinecap="round"
											/>
										</svg>
									</div>
								</div>

								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: "35px",
										background: "rgba(28, 40, 51, 0.45)",
										backdropFilter: "blur(12px)",
										WebkitBackdropFilter: "blur(12px)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
										padding: "15px",
										borderRadius: "16px",
									}}
								>
									<div>
										<div
											style={{
												color: "var(--text-main)",
												marginBottom: "5px",
												fontSize: "0.9rem",
											}}
										>
											Evaluación de Pasajeros
										</div>
										<div
											style={{
												color: "var(--text-muted)",
												fontSize: "0.85rem",
											}}
										>
											[4.8/5.0]
										</div>
									</div>
									<div
										style={{
											color: "#fbbf24",
											fontSize: "1.2rem",
											letterSpacing: "2px",
										}}
									>
										★★★★★
									</div>
								</div>

								<div style={{ marginTop: "auto" }}>
									<button
										onClick={() => setVistaActiva("expediente")}
										style={{
											background: "rgba(255,255,255,0.05)",
											border: "1px solid rgba(255,255,255,0.1)",
											color: "var(--text-main)",
											padding: "14px",
											borderRadius: "12px",
											cursor: "pointer",
											width: "100%",
											transition: "all 0.3s",
											fontWeight: "bold",
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background =
												"rgba(255,255,255,0.1)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background =
												"rgba(255,255,255,0.05)";
										}}
									>
										Ver Mi Expediente Completo
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{vistaActiva === "expediente" && (
					<div
						style={{
							background: "rgba(28, 40, 51, 0.45)",
							backdropFilter: "blur(12px)",
							WebkitBackdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
							padding: "20px",
							borderRadius: "12px",
							maxWidth: "600px",
						}}
					>
						<h3 style={{ color: "#3b82f6", marginBottom: "15px" }}>
							Información Registrada
						</h3>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "15px",
							}}
						>
							<p>
								<strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}
							</p>
							<p>
								<strong>Cédula:</strong> {usuario.cedula}
							</p>
							<p>
								<strong>Teléfono:</strong> {usuario.telefono}
							</p>
							<p>
								<strong>Correo:</strong> {usuario.correo}
							</p>
							<p style={{ gridColumn: "1 / -1" }}>
								<strong>Dirección:</strong> {usuario.direccion}
							</p>
							<p>
								<strong>Rol:</strong> {usuario.rol.toUpperCase()}
							</p>
						</div>
					</div>
				)}

				{vistaActiva === "ruta" && (
					<div
						style={{
							background: "rgba(28, 40, 51, 0.45)",
							backdropFilter: "blur(12px)",
							WebkitBackdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.1)",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
							padding: "20px",
							borderRadius: "12px",
						}}
					>
						<h3 style={{ color: "#3b82f6" }}>Coche Asignado Hoy</h3>
						{unidadAsignada ? (
							<div>
								<p>
									<strong>Unidad:</strong> {unidadAsignada.nombre}
								</p>
								<p>
									<strong>Modelo:</strong> {unidadAsignada.modelo}
								</p>
								<p>
									<strong>Placa:</strong> {unidadAsignada.placa}
								</p>
								<p>
									<strong>Estado:</strong>{" "}
									<span
										style={{
											color:
												unidadAsignada.estado === "Operativa"
													? "#3b82f6"
													: "#e74c3c",
										}}
									>
										{unidadAsignada.estado}
									</span>
								</p>
								<button
									className="btn-login"
									style={{
										maxWidth: "250px",
										background: rutaActiva ? "#3b82f6" : "#e74c3c",
									}}
									onClick={handleIniciarRuta}
								>
									{rutaActiva ? "✅ RUTA EN CURSO" : "🚀 INICIAR RECORRIDO"}
								</button>
							</div>
						) : (
							<p style={{ color: "#f39c12" }}>
								No te han asignado ninguna unidad todavía. Habla con el
								Administrador.
							</p>
						)}
					</div>
				)}

				{vistaActiva === "flota" && (
					<div>
						<h3 style={{ color: "var(--text-main)" }}>
							Estado General de los Vehículos
						</h3>
						{listaUnidades.length === 0 ? (
							<p>No hay registro de vehículos.</p>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "15px",
								}}
							>
								{listaUnidades.map((un) => (
									<div
										key={un._id}
										style={{
											background: "rgba(28, 40, 51, 0.45)",
											backdropFilter: "blur(12px)",
											WebkitBackdropFilter: "blur(12px)",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
											padding: "15px",
											borderRadius: "12px",
											borderLeft:
												un.estado === "Operativa"
													? "4px solid #3b82f6"
													: "4px solid #e74c3c",
										}}
									>
										<h4
											style={{ margin: "0 0 5px 0", color: "var(--text-main)" }}
										>
											{un.nombre}{" "}
											<span style={{ fontSize: "0.8rem", color: "#aaa" }}>
												- {un.modelo} ({un.placa})
											</span>
										</h4>
										<div style={{ fontSize: "0.9rem", marginBottom: "5px" }}>
											<strong>Estado:</strong> {un.estado}
										</div>
										<div style={{ fontSize: "0.9rem", color: "#f39c12" }}>
											<strong>Asignado a:</strong>{" "}
											{un.choferAsignado || "Libre"}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{vistaActiva === "paradas" && (
					<div>
						{!paradaChoferSeleccionada ? (
							<div className="parada-list-container">
								<h2 style={{ color: "var(--text-main)", marginBottom: "20px" }}>
									Llegadas por Parada
								</h2>
								<div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
									<div
										className="parada-card calderas"
										onClick={() => setParadaChoferSeleccionada("CALDERAS")}
									>
										<h3>📍 Las Calderas</h3>
										<p>Llegadas registradas en la cabecera principal.</p>
									</div>
									<div
										className="parada-card san-antonio"
										onClick={() => setParadaChoferSeleccionada("SAN ANTONIO")}
									>
										<h3>📍 San Antonio</h3>
										<p>Llegadas registradas en el punto medio.</p>
									</div>
									<div
										className="parada-card falcon"
										onClick={() =>
											setParadaChoferSeleccionada("JUAN CRISOSTOMO FALCON")
										}
									>
										<h3>📍 J.C. Falcón</h3>
										<p>Llegadas registradas en el retorno.</p>
									</div>
								</div>
							</div>
						) : (
							<div className="parada-list-container">
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: "20px",
									}}
								>
									<h2 style={{ color: "var(--text-main)", margin: 0 }}>
										Bitácora: {paradaChoferSeleccionada}
									</h2>
									<button
										className="btn-login"
										style={{
											width: "auto",
											margin: 0,
											padding: "10px 20px",
											background: "#7f8c8d",
										}}
										onClick={() => setParadaChoferSeleccionada(null)}
									>
										⬅ Cambiar Parada
									</button>
								</div>
								{listaLlegadas.filter(
									(ll) => ll.parada === paradaChoferSeleccionada,
								).length === 0 ? (
									<p>El fiscal no ha registrado llegadas de esta parada hoy.</p>
								) : (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "15px",
										}}
									>
										{listaLlegadas
											.filter((ll) => ll.parada === paradaChoferSeleccionada)
											.map((ll) => (
												<div
													key={ll._id}
													style={{
														background: "rgba(52, 152, 219, 0.2)",
														padding: "15px",
														borderRadius: "12px",
														borderLeft: "4px solid #3498db",
													}}
												>
													<h4
														style={{
															margin: "0 0 5px 0",
															color: "var(--text-main)",
														}}
													>
														Unidad: {ll.nombreUnidad}
													</h4>
													<p style={{ margin: "5px 0" }}>
														<strong>Parada:</strong> {ll.parada}
													</p>
													<p style={{ margin: "0" }}>
														<strong>Hora Creada:</strong> {ll.horaLlegada}
													</p>
													<small style={{ color: "#ccc" }}>
														Fiscal a cargo: {ll.registradoPor}
													</small>
												</div>
											))}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{vistaActiva === "incidencia" && (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "20px",
							maxWidth: "600px",
						}}
					>
						<div
							style={{
								background: "rgba(28, 40, 51, 0.45)",
								backdropFilter: "blur(12px)",
								WebkitBackdropFilter: "blur(12px)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
								boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
								padding: "20px",
								borderRadius: "12px",
							}}
						>
							<h4 style={{ margin: "0 0 15px 0", color: "#f39c12" }}>
								¿Qué sucede en la vía?
							</h4>
							<form
								onSubmit={handleEnviarIncidencia}
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "15px",
								}}
							>
								<div>
									<label
										style={{
											color: "var(--text-muted)",
											fontSize: "0.85rem",
											marginBottom: "8px",
											display: "block",
											fontWeight: 600,
										}}
									>
										NIVEL DE SEVERIDAD
									</label>
									<div style={{ display: "flex", gap: "10px" }}>
										<label
											style={{
												flex: 1,
												cursor: "pointer",
												padding: "12px",
												borderRadius: "8px",
												border:
													severidad === "Moderada"
														? "2px solid #f1c40f"
														: "1px solid rgba(255,255,255,0.1)",
												background:
													severidad === "Moderada"
														? "rgba(241,196,15,0.1)"
														: "rgba(28, 40, 51, 0.45)",
												color: severidad === "Moderada" ? "#f1c40f" : "#fff",
												textAlign: "center",
												transition: "all 0.2s",
												fontWeight: 600,
											}}
										>
											<input
												type="radio"
												name="severidad"
												value="Moderada"
												checked={severidad === "Moderada"}
												onChange={() => setSeveridad("Moderada")}
												style={{ display: "none" }}
											/>
											⚠️ MODERADA
										</label>
										<label
											style={{
												flex: 1,
												cursor: "pointer",
												padding: "12px",
												borderRadius: "8px",
												border:
													severidad === "Crítica"
														? "2px solid #e74c3c"
														: "1px solid rgba(255,255,255,0.1)",
												background:
													severidad === "Crítica"
														? "rgba(231,76,60,0.1)"
														: "rgba(28, 40, 51, 0.45)",
												color: severidad === "Crítica" ? "#e74c3c" : "#fff",
												textAlign: "center",
												transition: "all 0.2s",
												fontWeight: 600,
											}}
										>
											<input
												type="radio"
												name="severidad"
												value="Crítica"
												checked={severidad === "Crítica"}
												onChange={() => setSeveridad("Crítica")}
												style={{ display: "none" }}
											/>
											🚨 CRÍTICA
										</label>
									</div>
								</div>
								<textarea
									value={incidencia}
									onChange={(e) => setIncidencia(e.target.value)}
									placeholder="Ej: Accidente en el tramo 2, desvío obligatorio..."
									rows="4"
									style={{
										width: "100%",
										padding: "15px",
										borderRadius: "8px",
										background: "rgba(28, 40, 51, 0.45)",
										backdropFilter: "blur(12px)",
										WebkitBackdropFilter: "blur(12px)",
										border: "1px solid rgba(255, 255, 255, 0.1)",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
										color: "var(--text-main)",
										resize: "none",
										boxSizing: "border-box",
									}}
									required
								/>
								<button
									type="submit"
									className="btn-login"
									style={{
										background: severidad === "Crítica" ? "#e74c3c" : "#f39c12",
										maxWidth: "100%",
										fontWeight: 800,
									}}
								>
									ENVIAR REPORTE
								</button>
							</form>
						</div>

						<div
							style={{
								background: "rgba(28, 40, 51, 0.45)",
								backdropFilter: "blur(12px)",
								WebkitBackdropFilter: "blur(12px)",
								border: "1px solid rgba(255, 255, 255, 0.1)",
								boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
								padding: "20px",
								borderRadius: "12px",
							}}
						>
							<h4 style={{ margin: "0 0 15px 0", color: "#e74c3c" }}>
								Novedades Recientes
							</h4>
							{listaIncidencias.length === 0 ? (
								<p>No hay novedades reportadas.</p>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "12px",
										maxHeight: "350px",
										overflowY: "auto",
										paddingRight: "5px",
									}}
								>
									{listaIncidencias.map((inc) => {
										const esCritica = inc.severidad === "Crítica";
										const color = esCritica ? "#e74c3c" : "#f1c40f";
										const bg = esCritica
											? "rgba(231, 76, 60, 0.15)"
											: "rgba(241, 196, 15, 0.15)";
										return (
											<div
												key={inc._id}
												style={{
													background: bg,
													padding: "15px",
													borderRadius: "12px",
													borderLeft: `4px solid ${color}`,
												}}
											>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "flex-start",
														marginBottom: "8px",
													}}
												>
													<p
														style={{
															margin: 0,
															fontSize: "0.95rem",
															color: "var(--text-main)",
															flex: 1,
															paddingRight: "10px",
														}}
													>
														{inc.descripcion}
													</p>
													<span
														style={{
															fontSize: "0.65rem",
															padding: "3px 8px",
															borderRadius: "12px",
															border: `1px solid ${color}`,
															color: color,
															fontWeight: "bold",
														}}
													>
														{esCritica ? "CRÍTICA" : "MODERADA"}
													</span>
												</div>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														fontSize: "0.8rem",
														color: "var(--text-muted)",
													}}
												>
													<span>
														Por: <strong>{inc.autor}</strong> ({inc.rol})
													</span>
													<span>{new Date(inc.fecha).toLocaleString()}</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}

				{vistaActiva === "seguridad" && (
					<div style={{ maxWidth: "520px" }}>
						<div
							style={{
								background: "rgba(241,196,15,0.08)",
								border: "1px solid rgba(241,196,15,0.25)",
								borderRadius: "16px",
								padding: "30px",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "12px",
									marginBottom: "25px",
								}}
							>
								<div
									style={{
										width: "50px",
										height: "50px",
										borderRadius: "50%",
										background: "rgba(241,196,15,0.15)",
										border: "2px solid rgba(241,196,15,0.4)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
								<div>
									<h3
										style={{ margin: 0, color: "#f1c40f", fontSize: "1.1rem" }}
									>
										Información de Seguridad
									</h3>
									<p
										style={{
											margin: 0,
											color: "var(--text-muted)",
											fontSize: "0.8rem",
										}}
									>
										Protección de tu cuenta de acceso
									</p>
								</div>
							</div>

							{!editandoSeguridad && usuario.preguntaSeguridad ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "15px",
									}}
								>
									<div
										style={{
											background: "rgba(28, 40, 51, 0.45)",
											backdropFilter: "blur(12px)",
											WebkitBackdropFilter: "blur(12px)",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
											borderRadius: "10px",
											padding: "15px",
										}}
									>
										<p
											style={{
												margin: "0 0 4px 0",
												color: "var(--text-muted)",
												fontSize: "0.75rem",
												textTransform: "uppercase",
												letterSpacing: "1px",
											}}
										>
											Usuario de Acceso
										</p>
										<p
											style={{
												margin: 0,
												color: "var(--text-main)",
												fontSize: "1.1rem",
												fontWeight: 600,
											}}
										>
											👤 {usuario.usuario}
										</p>
									</div>
									<div
										style={{
											background: "rgba(28, 40, 51, 0.45)",
											backdropFilter: "blur(12px)",
											WebkitBackdropFilter: "blur(12px)",
											border: "1px solid rgba(255, 255, 255, 0.1)",
											boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
											borderRadius: "10px",
											padding: "15px",
										}}
									>
										<p
											style={{
												margin: "0 0 4px 0",
												color: "var(--text-muted)",
												fontSize: "0.75rem",
												textTransform: "uppercase",
												letterSpacing: "1px",
											}}
										>
											Pregunta de Seguridad
										</p>
										<p
											style={{
												margin: 0,
												color: "#f1c40f",
												fontSize: "0.95rem",
											}}
										>
											🔐 {usuario.preguntaSeguridad}
										</p>
									</div>
									<button
										onClick={() => setEditandoSeguridad(true)}
										style={{
											background: "transparent",
											border: "1.5px solid rgba(241,196,15,0.5)",
											color: "#f1c40f",
											padding: "10px",
											borderRadius: "10px",
											cursor: "pointer",
											fontWeight: "bold",
											marginTop: "10px",
										}}
									>
										⚙️ CAMBIAR CONFIGURACIÓN
									</button>
								</div>
							) : (
								<form
									onSubmit={handleGuardarSeguridad}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "20px",
									}}
								>
									<div className="input-group" style={{ margin: 0 }}>
										<label style={{ color: "#aaa", fontSize: "0.8rem" }}>
											TU USUARIO ACTUAL
										</label>
										<input
											type="text"
											value={usuario.usuario}
											disabled
											style={{ opacity: 0.6 }}
										/>
									</div>
									<div className="input-group" style={{ margin: 0 }}>
										<label style={{ color: "#aaa", fontSize: "0.8rem" }}>
											PREGUNTA DE SEGURIDAD
										</label>
										<select
											value={preguntaTmp}
											onChange={(e) => setPreguntaTmp(e.target.value)}
											style={{
												width: "100%",
												padding: "12px",
												background: "rgba(28, 40, 51, 0.45)",
												backdropFilter: "blur(12px)",
												WebkitBackdropFilter: "blur(12px)",
												boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
												color: "var(--text-main)",
												border: "1.5px solid rgba(255,255,255,0.1)",
												borderRadius: "10px",
											}}
										>
											<option>¿Cuál es el nombre de tu primera mascota?</option>
											<option>¿En qué ciudad naciste?</option>
											<option>¿Cuál es el apellido de tu madre?</option>
											<option>
												¿Cuál fue el nombre de tu primera escuela?
											</option>
											<option>¿Cuál es tu color favorito?</option>
										</select>
									</div>
									<div className="input-group" style={{ margin: 0 }}>
										<label style={{ color: "#aaa", fontSize: "0.8rem" }}>
											TU RESPUESTA SECRETA
										</label>
										<input
											type="text"
											value={respuestaTmp}
											onChange={(e) => setRespuestaTmp(e.target.value)}
											placeholder="Ej: Toby / Caracas / Perez..."
											required
										/>
									</div>
									<div style={{ display: "flex", gap: "10px" }}>
										<button
											type="submit"
											className="btn-login"
											style={{
												background: "linear-gradient(135deg, #f1c40f, #f39c12)",
												color: "#000",
												flex: 1,
											}}
											disabled={guardandoSeg}
										>
											{guardandoSeg ? "GUARDANDO..." : "✅ GUARDAR SEGURIDAD"}
										</button>
										{usuario.preguntaSeguridad && (
											<button
												type="button"
												onClick={() => setEditandoSeguridad(false)}
												style={{
													background: "rgba(255,255,255,0.1)",
													border: "none",
													color: "var(--text-main)",
													padding: "0 15px",
													borderRadius: "12px",
													cursor: "pointer",
												}}
											>
												CANCELAR
											</button>
										)}
									</div>
								</form>
							)}
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default Chofer;
