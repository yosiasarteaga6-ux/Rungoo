import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import API_BASE_URL from "../config";

function Login({ onLogin, onRecuperar }) {
	const [user, setUser] = useState("");
	const [pass, setPass] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// Estados para mapa público interactivo
	const [verMapaPublico, setVerMapaPublico] = useState(false);
	const [mapLayerType, setMapLayerType] = useState("streets"); // dark | streets | satellite
	const [publicLlegadas, setPublicLlegadas] = useState([]);
	const [paradaSeleccionada, setParadaSeleccionada] = useState(null);

	const publicMapRef = useRef(null);
	const publicMapInstanceRef = useRef(null);

	// Obtener horarios recientes de la ruta
	useEffect(() => {
		if (!verMapaPublico) return;

		const fetchLlegadas = async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/api/llegadas`);
				const data = await res.json();
				setPublicLlegadas(data);
			} catch (err) {
				console.error("Error al obtener bitácora de arribos pública:", err);
			}
		};

		fetchLlegadas();
		const interval = setInterval(fetchLlegadas, 20000);
		return () => clearInterval(interval);
	}, [verMapaPublico]);

	// Inicializar Leaflet cuando el modal se abre
	useEffect(() => {
		if (!verMapaPublico) return;
		if (!publicMapRef.current) return;

		// Evitar reinicializar sobre un mapa activo
		if (publicMapInstanceRef.current) {
			publicMapInstanceRef.current.remove();
			publicMapInstanceRef.current = null;
		}

		const paradasCoords = {
			"JUAN CRISOSTOMO FALCON": [11.388987, -69.675065],
			"SAN ANTONIO": [11.400541, -69.671707],
			CALDERAS: [11.4145, -69.625],
		};

		// Crear mapa restringido a la zona de Coro
		const map = L.map(publicMapRef.current, {
			center: [11.400541, -69.671707],
			zoom: 13,
			minZoom: 12,
			maxZoom: 17,
			maxBounds: [
				[11.38, -69.72],
				[11.46, -69.58],
			],
			maxBoundsViscosity: 1.0,
		});

		publicMapInstanceRef.current = map;

		// Capa de mapa con diseño dinámico
		const urls = {
			dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
			streets:
				"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
			satellite:
				"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
		};
		const attributions = {
			dark: "&copy; CARTO",
			streets: "&copy; CARTO &copy; OpenStreetMap",
			satellite: "Tiles &copy; Esri",
		};

		L.tileLayer(urls[mapLayerType] || urls.dark, {
			attribution: attributions[mapLayerType] || attributions.dark,
		}).addTo(map);

		// Trazar ruta con waypoints intermedios para simular el trayecto real (según indicaciones)
		const routeCoords = [
			[11.388987, -69.675065], // 1. Salida: J.C. Falcón
			[11.391, -69.674], // 2. Prol Av Sucre
			[11.39, -69.672], // 3. Cruza derecha Av El Tenis
			[11.388, -69.673], // 4. Cruza derecha Av Sta Rosa
			[11.3895, -69.6745], // 5. Cruza derecha Av Ruiz Pineda
			[11.395, -69.672], // 6. Cruza izquierda bajando por Av Manaure
			[11.400541, -69.671707], // 7. Punto de control SAN ANTONIO
			[11.402, -69.6715], // 8. Sigue bajando
			[11.402, -69.668], // 9. Cruza derecha por Av Rómulo Gallegos
			[11.407, -69.668], // 10. Cruza derecha por Av del terminal
			[11.4092, -69.6718], // 11. Llega a TRES PLATOS
			[11.4111, -69.6534], // 12. Cruza derecha por Av Independencia (Farmatodo)
			[11.4125, -69.635], // 13. Sigue hacia el este
			[11.4145, -69.625], // 14. Llega a CALDERAS
		];

		L.polyline(routeCoords, {
			color: "#3b82f6",
			weight: 5,
			opacity: 0.8,
			dashArray: "8, 12",
			className: "leaflet-route-polyline",
		}).addTo(map);

		// Marcadores SVG flotantes acoplados
		const paradasInfo = [
			{
				key: "JUAN CRISOSTOMO FALCON",
				nombre: "📍 Salida: J.C. Falcón",
				desc: "Punto de partida de la ruta (Oeste).",
			},
			{
				key: "SAN ANTONIO",
				nombre: "📍 Punto Medio: Plaza San Antonio",
				desc: "Punto de control intermedio.",
			},
			{
				key: "CALDERAS",
				nombre: "📍 Llegada: Las Calderas",
				desc: "Llegada y cabecera principal (Este).",
			},
		];

		paradasInfo.forEach((p) => {
			const icon = L.divIcon({
				html: `
          <div class="glow-marker-wrapper" id="public-marker-${p.key}">
            <div class="glow-marker-ring"></div>
            <div class="glow-marker-dot" style="display:flex; justify-content:center; align-items:center; font-size:12px;">🚌</div>
          </div>
        `,
				className: "glow-leaflet-marker",
				iconSize: [20, 20],
				iconAnchor: [10, 10],
			});

			const marker = L.marker(paradasCoords[p.key], { icon }).addTo(map);

			marker.on("click", () => {
				setParadaSeleccionada(p.key);
			});

			marker.bindPopup(`
        <div class="leaflet-popup-premium">
          <h4 style="margin: 0; color: #3b82f6;">${p.nombre}</h4>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-main);">${p.desc}</p>
          <small style="color: #3498db; display: block; margin-top: 5px;">👇 Haz clic para ver arribos</small>
        </div>
      `);
		});

		return () => {
			if (publicMapInstanceRef.current) {
				publicMapInstanceRef.current.remove();
				publicMapInstanceRef.current = null;
			}
		};
	}, [verMapaPublico, mapLayerType]);

	const handleIngresar = async (e) => {
		e.preventDefault();

		if (!user || !pass) {
			alert("Por favor, completa todos los campos");
			return;
		}

		try {
			const respuesta = await fetch(`${API_BASE_URL}/api/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ usuario: user, clave: pass }),
			});

			const data = await respuesta.json();

			if (respuesta.ok) {
				onLogin(data.usuario);
			} else {
				alert(data.mensaje || "Usuario o contraseña incorrectos");
			}
		} catch (error) {
			console.error("Error al iniciar sesión:", error);
			alert("No se pudo conectar con el servidor para iniciar sesión.");
		}
	};

	const llegadasFiltradas = paradaSeleccionada
		? publicLlegadas.filter((ll) => ll.parada === paradaSeleccionada)
		: publicLlegadas;

	return (
		<div className="login-wrapper">
			{/* ── PANEL: Formulario de Acceso ── */}
			<div className="login-form-panel">
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginBottom: "18px",
					}}
				>
					<div
						style={{
							width: "68px",
							height: "68px",
							borderRadius: "50%",
							background:
								"linear-gradient(135deg, rgba(59, 130, 246,0.18), rgba(39,174,96,0.06))",
							border: "2px solid rgba(59, 130, 246,0.45)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: "0 0 25px rgba(59, 130, 246,0.25)",
						}}
					>
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="12" cy="8" r="4" stroke="#3b82f6" strokeWidth="1.8" />
							<path
								d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
								stroke="#3b82f6"
								strokeWidth="1.8"
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>

				<div style={{ textAlign: "center", marginBottom: "25px" }}>
					<p className="login-subtitle">Sistema de Gestión</p>
					<h1 className="brand-name">
						RUTA <span>EXPRESS</span>
					</h1>
					<p className="login-calderas">
						✦ Transporte Colectivo Las Calderas ✦
					</p>
				</div>

				<form onSubmit={handleIngresar}>
					<div className="input-group">
						<label>Usuario</label>
						<div className="input-with-icon-wrapper">
							<span className="input-icon">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle cx="12" cy="7" r="4" />
								</svg>
							</span>
							<input
								type="text"
								value={user}
								onChange={(e) => setUser(e.target.value)}
								placeholder="Ingresa tu usuario"
								required
							/>
						</div>
					</div>

					<div className="input-group">
						<label>Contraseña</label>
						<div className="input-with-icon-wrapper">
							<span className="input-icon">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							</span>
							<input
								type={showPassword ? "text" : "password"}
								value={pass}
								onChange={(e) => setPass(e.target.value)}
								placeholder="••••••••"
								required
							/>
							<button
								type="button"
								className="password-toggle-btn"
								onClick={() => setShowPassword(!showPassword)}
								title={
									showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
								}
							>
								{showPassword ? (
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
										<line x1="1" y1="1" x2="23" y2="23" />
									</svg>
								) : (
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								)}
							</button>
						</div>
					</div>

					<button
						type="submit"
						className="btn-login"
						style={{ marginBottom: "12px" }}
					>
						🚀 INICIAR RUTA
					</button>
				</form>

				{/* 🗺️ BOTÓN PÚBLICO DEL MAPA */}
				<button
					onClick={() => {
						setVerMapaPublico(true);
						setParadaSeleccionada(null);
					}}
					className="btn-login"
					style={{
						background:
							"linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.05))",
						border: "1.5px solid rgba(52, 152, 219, 0.6)",
						color: "#3498db",
						boxShadow: "0 0 15px rgba(52, 152, 219, 0.1)",
						marginBottom: "15px",
					}}
				>
					📍 VER RECORRIDO Y PARADAS
				</button>

				{/* Enlace recuperar clave */}
				<div style={{ textAlign: "center" }}>
					<button
						onClick={onRecuperar}
						style={{
							background: "none",
							border: "none",
							color: "rgba(59, 130, 246,0.7)",
							cursor: "pointer",
							fontSize: "0.85rem",
							textDecoration: "underline",
						}}
					>
						🔑 ¿Olvidaste tu contraseña?
					</button>
				</div>

				<p
					style={{
						textAlign: "center",
						marginTop: "20px",
						color: "var(--text-muted)",
						fontSize: "0.7rem",
						letterSpacing: "1px",
					}}
				>
					SISTEMA PROTEGIDO · ACCESO SOLO PERSONAL AUTORIZADO
				</p>
			</div>

			{/* ── MODAL MAPA PÚBLICO INTERACTIVO ── */}
			{verMapaPublico && (
				<div className="public-map-modal">
					<div className="public-map-modal-content">
						<div className="public-map-modal-header">
							<h3>📍 Recorrido Público · Ruta Express</h3>
							<button
								onClick={() => {
									setVerMapaPublico(false);
									setParadaSeleccionada(null);
								}}
								className="btn-close-modal"
							>
								✖
							</button>
						</div>

						<p
							style={{
								color: "var(--text-muted)",
								fontSize: "0.85rem",
								margin: "0 0 20px 0",
								lineHeight: "1.4",
							}}
						>
							Consulta las estaciones y el historial de arribos en tiempo real.
							El mapa está bloqueado al sector de **Coro** y **Las Calderas**.
							Haz clic en cualquier estación para filtrar la bitácora.
						</p>

						<div className="public-map-layout">
							{/* Contenedor Leaflet */}
							<div
								className="public-map-container-wrapper"
								style={{ position: "relative" }}
							>
								{/* Selector de capas flotante */}
								<div
									className="map-layer-selector"
									style={{ top: "10px", left: "10px" }}
								>
									<button
										type="button"
										onClick={() => setMapLayerType("dark")}
										className={mapLayerType === "dark" ? "active" : ""}
									>
										🕶️ Oscuro
									</button>
									<button
										type="button"
										onClick={() => setMapLayerType("streets")}
										className={mapLayerType === "streets" ? "active" : ""}
									>
										🗺️ Calles
									</button>
									<button
										type="button"
										onClick={() => setMapLayerType("satellite")}
										className={mapLayerType === "satellite" ? "active" : ""}
									>
										🛰️ Satélite
									</button>
								</div>

								<div
									ref={publicMapRef}
									style={{
										height: "380px",
										width: "100%",
										borderRadius: "12px",
										border: "1.5px solid rgba(59, 130, 246, 0.25)",
										boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
										overflow: "hidden",
									}}
								/>
							</div>

							{/* Sidebar de Arribos */}
							<div className="public-map-sidebar">
								<h4
									style={{
										color: "var(--text-main)",
										margin: "0 0 12px 0",
										fontSize: "0.95rem",
										borderBottom: "1px solid rgba(255,255,255,0.1)",
										paddingBottom: "8px",
									}}
								>
									{paradaSeleccionada
										? `📍 Arribos: ${paradaSeleccionada}`
										: "📍 Selecciona una Parada"}
								</h4>

								<div className="public-map-sidebar-list">
									{!paradaSeleccionada ? (
										<div
											style={{
												textAlign: "center",
												padding: "30px 10px",
												color: "var(--text-muted)",
												fontSize: "0.8rem",
											}}
										>
											<span
												style={{
													fontSize: "1.8rem",
													display: "block",
													marginBottom: "8px",
												}}
											>
												🚌
											</span>
											Presiona un marcador verde en el mapa para ver la bitácora
											de arribos de esa estación.
										</div>
									) : llegadasFiltradas.length === 0 ? (
										<div
											style={{
												textAlign: "center",
												padding: "35px 10px",
												color: "var(--text-muted)",
												fontSize: "0.8rem",
											}}
										>
											No se registran autobuses el día de hoy en esta estación.
										</div>
									) : (
										llegadasFiltradas.slice(0, 5).map((ll, idx) => (
											<div
												key={ll._id || idx}
												style={{
													background: "var(--input-bg)",
													padding: "10px 12px",
													borderRadius: "8px",
													borderLeft: "3.5px solid #3b82f6",
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													borderTop: "1.5px solid rgba(255,255,255,0.02)",
												}}
											>
												<span
													style={{
														fontSize: "0.85rem",
														color: "var(--text-main)",
														fontWeight: "500",
													}}
												>
													{ll.nombreUnidad}
												</span>
												<span
													style={{
														fontSize: "0.95rem",
														color: "#3b82f6",
														fontWeight: "bold",
													}}
												>
													{ll.horaLlegada}
												</span>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Login;
