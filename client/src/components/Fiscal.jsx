import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
	AlertTriangle,
	BarChart2,
	Bus,
	ClipboardList,
	Home,
	MapPin,
	Shield,
	User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../config";
import Clock from "./Clock";
import CompletarPerfil from "./CompletarPerfil";
import ThemeToggle from "./ThemeToggle";

// ──────────────────────────────────────────────
// Componente Selector Buscable reutilizable
// ──────────────────────────────────────────────
function SearchableSelector({ options, value, onChange, placeholder, label }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const filteredOptions = options.filter((opt) => {
		const term = searchTerm.toLowerCase();
		const display = typeof opt === "string" ? opt : opt.name || opt.label || "";
		return display.toLowerCase().includes(term);
	});

	const getDisplayValue = () => {
		if (value !== undefined && value !== null && value !== "") {
			const found = options.find((opt) => {
				const id = typeof opt === "string" ? opt : opt.id;
				return String(id) === String(value);
			});
			if (found) return typeof found === "string" ? found : found.name;
		}
		return "";
	};

	return (
		<div className="searchable-select-container" ref={containerRef}>
			{label && <label>{label}</label>}
			<div
				className="searchable-select-input-wrapper"
				onClick={() => setIsOpen(!isOpen)}
			>
				<input
					type="text"
					placeholder={placeholder || "Escribe para buscar..."}
					value={isOpen ? searchTerm : getDisplayValue()}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => {
						setIsOpen(true);
						setSearchTerm("");
					}}
					className="searchable-select-input"
				/>
				<span className="searchable-select-arrow">{isOpen ? "▲" : "▼"}</span>
			</div>
			{isOpen && (
				<div className="searchable-select-dropdown">
					{filteredOptions.length === 0 ? (
						<div className="searchable-select-no-results">Sin resultados</div>
					) : (
						filteredOptions.map((opt, index) => {
							const optId = typeof opt === "string" ? opt : opt.id;
							const optDisplay = typeof opt === "string" ? opt : opt.name;
							return (
								<div
									key={index}
									className={`searchable-select-option ${String(optId) === String(value) ? "selected" : ""}`}
									onClick={(e) => {
										e.stopPropagation();
										onChange(optId);
										setSearchTerm("");
										setIsOpen(false);
									}}
								>
									{optDisplay}
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}

// ──────────────────────────────────────────────
// Componente Principal: Fiscal
// ──────────────────────────────────────────────
// Algoritmo de cálculo de vueltas completas en orden secuencial por unidad
function calcularVueltasPorUnidad(llegadasUnidad) {
	const ordenadas = [...llegadasUnidad].sort((a, b) =>
		a.horaLlegada.localeCompare(b.horaLlegada),
	);

	let vueltasCompletas = 0;
	let vueltaActual = { calderas: null, sanAntonio: null, falcon: null };
	const detallesVueltas = [];

	for (const ll of ordenadas) {
		const paradaNorm = ll.parada.toUpperCase().trim();
		if (paradaNorm === "CALDERAS") {
			if (!vueltaActual.sanAntonio) {
				vueltaActual.calderas = ll.horaLlegada;
			} else {
				vueltaActual = {
					calderas: ll.horaLlegada,
					sanAntonio: null,
					falcon: null,
				};
			}
		} else if (paradaNorm === "SAN ANTONIO") {
			if (vueltaActual.calderas && !vueltaActual.falcon) {
				vueltaActual.sanAntonio = ll.horaLlegada;
			}
		} else if (
			paradaNorm === "JUAN CRISOSTOMO FALCON" ||
			paradaNorm.includes("FALCON")
		) {
			if (vueltaActual.calderas && vueltaActual.sanAntonio) {
				vueltaActual.falcon = ll.horaLlegada;
				vueltasCompletas++;

				const [hA, mA] = vueltaActual.calderas.split(":").map(Number);
				const [hB, mB] = vueltaActual.falcon.split(":").map(Number);
				const diff = hB * 60 + mB - (hA * 60 + mA);

				detallesVueltas.push({
					numero: vueltasCompletas,
					inicio: vueltaActual.calderas,
					medio: vueltaActual.sanAntonio,
					fin: vueltaActual.falcon,
					duracion: diff > 0 ? `${diff} min` : "N/A",
				});

				vueltaActual = { calderas: null, sanAntonio: null, falcon: null };
			}
		}
	}
	return { count: vueltasCompletas, detalles: detallesVueltas };
}

function Fiscal({ usuario, onLogout, onUpdateUser }) {
	const [incidencia, setIncidencia] = useState("");
	const [severidad, setSeveridad] = useState("Moderada");
	const [vistaActiva, setVistaActiva] = useState("home");
	const [menuAbierto, setMenuAbierto] = useState(false);

	// Estados Seguridad
	const [editandoSeguridad, setEditandoSeguridad] = useState(false);
	const [preguntaTmp, setPreguntaTmp] = useState(
		usuario.preguntaSeguridad || "¿Cuál es el nombre de tu primera mascota?",
	);
	const [respuestaTmp, setRespuestaTmp] = useState("");
	const [guardandoSeg, setGuardandoSeg] = useState(false);

	const [listaUnidades, setListaUnidades] = useState([]);
	const [listaLlegadas, setListaLlegadas] = useState([]);
	const [listaIncidencias, setListaIncidencias] = useState([]);

	// Registro nueva llegada
	const [uSeleccionada, setUSeleccionada] = useState("");
	const [hora, setHora] = useState("");

	// Selector de Paradas
	const [paradaFiscalSeleccionada, setParadaFiscalSeleccionada] =
		useState(null);

	// Edición segura
	const [editandoId, setEditandoId] = useState(null);
	const [adminUser, setAdminUser] = useState("");
	const [adminPass, setAdminPass] = useState("");

	// Estado de reporte
	const [generandoPDF, setGenerandoPDF] = useState(false);

	const nombreFiscal = usuario ? usuario.nombre : "Fiscal Desconocido";

	const fetchLlegadas = async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/api/llegadas`);
			const data = await res.json();
			setListaLlegadas(data);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (
			vistaActiva === "flota" ||
			vistaActiva === "paradas" ||
			vistaActiva === "reporte"
		) {
			fetch(`${API_BASE_URL}/api/unidades`)
				.then((res) => res.json())
				.then((data) => setListaUnidades(data))
				.catch((err) => console.error(err));
		}
		if (vistaActiva === "paradas" || vistaActiva === "reporte") {
			fetchLlegadas();
		}
		if (vistaActiva === "novedad") {
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

	// ── Handlers ──
	const handleEnviarIncidencia = async (e) => {
		e.preventDefault();
		if (!incidencia.trim()) return;
		try {
			const resp = await fetch(`${API_BASE_URL}/api/incidencias`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					descripcion: incidencia,
					autor: nombreFiscal,
					rol: "Fiscal",
					severidad: severidad,
				}),
			});
			if (resp.ok) {
				alert("Incidencia enviada correctamente.");
				setIncidencia("");
				// Refrescar lista de incidencias
				const refetch = await fetch(`${API_BASE_URL}/api/incidencias`);
				const newData = await refetch.json();
				setListaIncidencias(newData);
			} else alert("Hubo un error al enviar la incidencia.");
		} catch {
			alert("Error de conexión con el servidor.");
		}
	};

	const handleRegistrarLlegada = async (e) => {
		e.preventDefault();
		const objUnidad = listaUnidades.find((u) => u._id === uSeleccionada);
		if (!objUnidad) {
			alert("Selecciona unidad");
			return;
		}
		try {
			const payload = {
				unidadId: uSeleccionada,
				nombreUnidad: objUnidad.nombre,
				parada: paradaFiscalSeleccionada,
				horaLlegada: hora,
				registradoPor: nombreFiscal,
			};
			const resp = await fetch(`${API_BASE_URL}/api/llegadas`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (resp.ok) {
				alert("Llegada registrada.");
				setUSeleccionada("");
				setHora("");
				fetchLlegadas();
			} else alert("Error guardando llegada.");
		} catch {
			alert("Error de servidor.");
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
			} else alert("Error al actualizar la seguridad.");
		} catch {
			alert("Error de conexión.");
		}
		setGuardandoSeg(false);
	};

	const handleModificarLlegada = async (e) => {
		e.preventDefault();
		try {
			const passReq = await fetch(`${API_BASE_URL}/api/verify-admin`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usuario: adminUser, clave: adminPass }),
			});
			const passRes = await passReq.json();
			if (!passRes.autorizado) {
				alert("Credenciales inválidas. Solo el Admin autoriza esta edición.");
				return;
			}

			const updateReq = await fetch(
				`${API_BASE_URL}/api/llegadas/${editandoId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						parada: paradaFiscalSeleccionada,
						horaLlegada: hora,
					}),
				},
			);
			if (updateReq.ok) {
				alert("Cambio registrado autorizado por Admin.");
				setEditandoId(null);
				setAdminUser("");
				setAdminPass("");
				setHora("");
				fetchLlegadas();
			} else alert("Hubo un problema actualizando el dato.");
		} catch {
			alert("Fallo de red en validación.");
		}
	};

	const abrirEdicion = (llegadaObj) => {
		setEditandoId(llegadaObj._id);
		setHora(llegadaObj.horaLlegada);
		setAdminUser("");
		setAdminPass("");
	};

	// ── Generador de Reporte PDF ──
	const generarReportePDF = () => {
		setGenerandoPDF(true);
		try {
			const doc = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});
			const hoy = new Date();
			const fechaStr = hoy.toLocaleDateString("es-VE", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			const horaStr = hoy.toLocaleTimeString("es-VE");

			// Encabezado
			doc.setFillColor(15, 40, 22);
			doc.rect(0, 0, 210, 40, "F");
			doc.setTextColor(46, 204, 113);
			doc.setFontSize(20);
			doc.setFont("helvetica", "bold");
			doc.text("RUTA EXPRESS — REPORTE DIARIO", 105, 16, { align: "center" });
			doc.setTextColor(180, 220, 180);
			doc.setFontSize(10);
			doc.setFont("helvetica", "normal");
			doc.text(`Generado por Fiscal: ${nombreFiscal}`, 105, 25, {
				align: "center",
			});
			doc.text(`Fecha: ${fechaStr}  |  Hora: ${horaStr}`, 105, 32, {
				align: "center",
			});

			let y = 50;

			// ── Sección 1: Unidades que operaron hoy ──
			const unidadesOperativas = listaUnidades.filter(
				(u) => u.estado === "Operativa",
			);
			doc.setTextColor(46, 204, 113);
			doc.setFontSize(13);
			doc.setFont("helvetica", "bold");
			doc.text("1. UNIDADES EN OPERACIÓN HOY", 14, y);
			y += 6;

			autoTable(doc, {
				startY: y,
				head: [["Unidad", "Modelo", "Placa", "Chofer Asignado", "Estado"]],
				body: unidadesOperativas.map((u) => [
					u.nombre,
					u.modelo || "N/A",
					u.placa || "N/A",
					u.choferAsignado || "Sin asignar",
					u.estado,
				]),
				theme: "grid",
				headStyles: {
					fillColor: [15, 80, 40],
					textColor: [200, 255, 200],
					fontStyle: "bold",
				},
				bodyStyles: { textColor: [30, 30, 30] },
				alternateRowStyles: { fillColor: [235, 255, 240] },
				styles: { fontSize: 9 },
			});
			y = doc.lastAutoTable.finalY + 10;

			// ── Sección 2: Registro de Llegadas por Parada ──
			const paradas = ["CALDERAS", "SAN ANTONIO", "JUAN CRISOSTOMO FALCON"];

			// Calcular hora inicio y fin generales
			if (listaLlegadas.length > 0) {
				const horasOrdenadas = [...listaLlegadas]
					.filter((ll) => ll.horaLlegada)
					.sort((a, b) => a.horaLlegada.localeCompare(b.horaLlegada));

				const horaInicio = horasOrdenadas[0]?.horaLlegada || "N/A";
				const horaFin =
					horasOrdenadas[horasOrdenadas.length - 1]?.horaLlegada || "N/A";

				doc.setTextColor(46, 204, 113);
				doc.setFontSize(13);
				doc.setFont("helvetica", "bold");
				doc.text("2. RESUMEN GENERAL DE OPERACIÓN", 14, y);
				y += 6;

				autoTable(doc, {
					startY: y,
					head: [["Indicador", "Valor"]],
					body: [
						["Total de llegadas registradas", listaLlegadas.length],
						["Hora de inicio de operaciones", horaInicio],
						["Hora de cierre de operaciones", horaFin],
						["Paradas monitoreadas", paradas.length],
						["Unidades operativas hoy", unidadesOperativas.length],
						["Fiscal supervisor", nombreFiscal],
					],
					theme: "striped",
					headStyles: {
						fillColor: [20, 60, 35],
						textColor: [200, 255, 200],
						fontStyle: "bold",
					},
					styles: { fontSize: 9 },
				});
				y = doc.lastAutoTable.finalY + 10;
			}

			// ── Sección 3: Detalle por Parada ──
			doc.setTextColor(46, 204, 113);
			doc.setFontSize(13);
			doc.setFont("helvetica", "bold");
			doc.text("3. DETALLE DE LLEGADAS POR PARADA", 14, y);
			y += 6;

			paradas.forEach((parada) => {
				const llegadasParada = listaLlegadas.filter(
					(ll) => ll.parada === parada,
				);
				if (llegadasParada.length === 0) return;

				autoTable(doc, {
					startY: y,
					head: [[`📍 ${parada} — ${llegadasParada.length} llegada(s)`]],
					body: [],
					theme: "plain",
					headStyles: {
						fillColor: [30, 100, 55],
						textColor: [230, 255, 230],
						fontStyle: "bold",
						fontSize: 10,
					},
				});
				y = doc.lastAutoTable.finalY;

				autoTable(doc, {
					startY: y,
					head: [["#", "Unidad", "Hora Llegada", "Registrado por"]],
					body: llegadasParada.map((ll, i) => [
						i + 1,
						ll.nombreUnidad || "N/A",
						ll.horaLlegada || "N/A",
						ll.registradoPor || nombreFiscal,
					]),
					theme: "grid",
					headStyles: { fillColor: [40, 120, 65], textColor: [255, 255, 255] },
					styles: { fontSize: 8 },
				});
				y = doc.lastAutoTable.finalY + 8;

				// Calcular tiempos entre vueltas por unidad en esta parada
				const unidadesEnParada = [
					...new Set(llegadasParada.map((ll) => ll.nombreUnidad)),
				];
				const vueltasData = [];
				unidadesEnParada.forEach((unidad) => {
					const llegadasUnidad = llegadasParada
						.filter((ll) => ll.nombreUnidad === unidad)
						.sort((a, b) => a.horaLlegada.localeCompare(b.horaLlegada));
					if (llegadasUnidad.length > 1) {
						for (let i = 1; i < llegadasUnidad.length; i++) {
							const [hA, mA] = llegadasUnidad[i - 1].horaLlegada
								.split(":")
								.map(Number);
							const [hB, mB] = llegadasUnidad[i].horaLlegada
								.split(":")
								.map(Number);
							const diff = hB * 60 + mB - (hA * 60 + mA);
							if (diff > 0)
								vueltasData.push([
									unidad,
									llegadasUnidad[i - 1].horaLlegada,
									llegadasUnidad[i].horaLlegada,
									`${diff} min`,
								]);
						}
					}
				});

				if (vueltasData.length > 0) {
					autoTable(doc, {
						startY: y,
						head: [
							["Unidad", "Vuelta anterior", "Vuelta siguiente", "Intervalo"],
						],
						body: vueltasData,
						theme: "striped",
						headStyles: { fillColor: [20, 80, 45], textColor: [200, 240, 200] },
						styles: { fontSize: 8 },
					});
					y = doc.lastAutoTable.finalY + 10;
				}
			});

			// NUEVO: Sección 4: Vueltas Completas (Ciclos)
			const uniqUnidadesGlobal = [
				...new Set(listaLlegadas.map((ll) => ll.nombreUnidad)),
			];
			const todasLasVueltas = [];
			uniqUnidadesGlobal.forEach((unidad) => {
				const llU = listaLlegadas.filter((ll) => ll.nombreUnidad === unidad);
				const resV = calcularVueltasPorUnidad(llU);
				resV.detalles.forEach((d) => {
					todasLasVueltas.push([
						unidad,
						`Vuelta ${d.numero}`,
						d.inicio,
						d.medio,
						d.fin,
						d.duracion,
					]);
				});
			});

			if (todasLasVueltas.length > 0) {
				if (y > 220) {
					doc.addPage();
					y = 20;
				}
				doc.setTextColor(46, 204, 113);
				doc.setFontSize(13);
				doc.setFont("helvetica", "bold");
				doc.text("4. REPORTE DE CICLOS DE VUELTAS COMPLETAS", 14, y);
				y += 6;
				autoTable(doc, {
					startY: y,
					head: [
						[
							"Unidad",
							"Vuelta Nro",
							"Calderas (Inicio)",
							"San Antonio (Medio)",
							"J.C. Falcón (Fin)",
							"Duración",
						],
					],
					body: todasLasVueltas,
					theme: "grid",
					headStyles: {
						fillColor: [15, 80, 40],
						textColor: [200, 255, 200],
						fontStyle: "bold",
					},
					styles: { fontSize: 8 },
				});
				y = doc.lastAutoTable.finalY + 10;
			}

			// Pie de página
			const pageCount = doc.internal.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				doc.setPage(i);
				doc.setFontSize(8);
				doc.setTextColor(150);
				doc.text(
					`Ruta Express — Reporte Confidencial | Página ${i} de ${pageCount}`,
					105,
					290,
					{ align: "center" },
				);
			}

			doc.save(`ReporteRutaExpress_${hoy.toISOString().split("T")[0]}.pdf`);
		} catch (err) {
			console.error(err);
			alert("Error generando el reporte.");
		}
		setGenerandoPDF(false);
	};

	const getSidebarClass = (current) =>
		vistaActiva === current ? "sidebar-btn active" : "sidebar-btn";
	const cerrarMenu = () => setMenuAbierto(false);

	// Opciones para el selector de unidades (solo operativas)
	const unidadesOperativasOptions = [
		{ id: "", name: "-- Selecciona una unidad --" },
		...listaUnidades
			.filter((u) => u.estado === "Operativa")
			.map((u) => ({ id: u._id, name: `${u.nombre} — Placa: ${u.placa}` })),
	];

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
							background: "linear-gradient(135deg, #3498db, #2980b9)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "1.4rem",
							fontWeight: 900,
							color: "var(--text-main)",
							margin: "0 auto 10px",
						}}
					>
						{nombreFiscal.charAt(0).toUpperCase()}
					</div>
					<h3
						style={{
							color: "var(--text-main)",
							margin: "0 0 2px 0",
							fontSize: "1rem",
							fontWeight: 700,
						}}
					>
						{nombreFiscal}
					</h3>
					<p
						style={{
							color: "#3498db",
							margin: "0 0 6px 0",
							fontSize: "0.78rem",
							textTransform: "uppercase",
							letterSpacing: "1px",
						}}
					>
						Fiscal de Ruta
					</p>
					<span
						style={{
							background: "rgba(52,152,219,0.15)",
							color: "#3498db",
							fontSize: "0.72rem",
							padding: "2px 10px",
							borderRadius: "20px",
							border: "1px solid rgba(52,152,219,0.3)",
						}}
					>
						● Supervisando
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
						className={getSidebarClass("control")}
						onClick={() => {
							setVistaActiva("control");
							cerrarMenu();
						}}
					>
						<ClipboardList size={18} /> Control de Despacho
					</button>
					<button
						className={getSidebarClass("flota")}
						onClick={() => {
							setVistaActiva("flota");
							cerrarMenu();
						}}
					>
						<Bus size={18} /> Flota (Control)
					</button>
					<button
						className={getSidebarClass("paradas")}
						onClick={() => {
							setVistaActiva("paradas");
							setParadaFiscalSeleccionada(null);
							cerrarMenu();
						}}
					>
						<MapPin size={18} /> Paradas
					</button>
					<button
						className={getSidebarClass("novedad")}
						onClick={() => {
							setVistaActiva("novedad");
							cerrarMenu();
						}}
					>
						<AlertTriangle size={18} /> Reportar Novedad
					</button>
					<button
						className={getSidebarClass("reporte")}
						onClick={() => {
							setVistaActiva("reporte");
							cerrarMenu();
						}}
					>
						<BarChart2 size={18} /> Reporte del Día
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
					className={`bottom-nav-item ${vistaActiva === "control" ? "active" : ""}`}
					onClick={() => setVistaActiva("control")}
				>
					<ClipboardList className="nav-icon" size={24} />
					<span>Control</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "paradas" ? "active" : ""}`}
					onClick={() => setVistaActiva("paradas")}
				>
					<MapPin className="nav-icon" size={24} />
					<span>Paradas</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "novedad" ? "active" : ""}`}
					onClick={() => setVistaActiva("novedad")}
				>
					<AlertTriangle className="nav-icon" size={24} />
					<span>Novedad</span>
				</button>
				<button
					className={`bottom-nav-item ${vistaActiva === "reporte" ? "active" : ""}`}
					onClick={() => setVistaActiva("reporte")}
				>
					<BarChart2 className="nav-icon" size={24} />
					<span>Reporte</span>
				</button>
			</nav>

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
						{vistaActiva === "control" && "Despacho de Unidades"}
						{vistaActiva === "flota" && "Toda la Flota"}
						{vistaActiva === "paradas" && "Bitácora de Paradas"}
						{vistaActiva === "novedad" && "Central de Reportes"}
						{vistaActiva === "reporte" && "📊 Reporte Diario de Operaciones"}
						{vistaActiva === "seguridad" && "Configuración de Seguridad"}
					</h2>
				</div>

				{/* ── INICIO ── */}
				{vistaActiva === "home" && (
					<div className="fade-in-tab">
						<div
							style={{
								background:
									"linear-gradient(135deg, rgba(52,152,219,0.12) 0%, rgba(41,128,185,0.06) 100%)",
								border: "1px solid rgba(52,152,219,0.2)",
								borderRadius: "20px",
								padding: "28px 24px",
								marginBottom: "28px",
								display: "flex",
								alignItems: "center",
								gap: "20px",
							}}
						>
							<div
								style={{
									width: "64px",
									height: "64px",
									borderRadius: "50%",
									background: "linear-gradient(135deg, #3498db, #2980b9)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "1.8rem",
									fontWeight: 900,
									color: "var(--text-main)",
									flexShrink: 0,
									boxShadow: "0 4px 20px rgba(52,152,219,0.35)",
								}}
							>
								{nombreFiscal.charAt(0).toUpperCase()}
							</div>
							<div>
								<p
									style={{
										color: "var(--text-muted)",
										margin: "0 0 4px 0",
										fontSize: "0.85rem",
										textTransform: "uppercase",
										letterSpacing: "1px",
									}}
								>
									Panel del Fiscal
								</p>
								<h2
									style={{
										color: "var(--text-main)",
										margin: "0 0 4px 0",
										fontSize: "1.6rem",
										fontWeight: 900,
										lineHeight: 1.2,
									}}
								>
									Hola, <span style={{ color: "#3498db" }}>{nombreFiscal}</span>{" "}
									👋
								</h2>
								<p
									style={{
										color: "var(--text-muted)",
										margin: 0,
										fontSize: "0.85rem",
									}}
								>
									Ruta Express · Las Calderas
								</p>
							</div>
						</div>

						<h3
							style={{
								color: "var(--text-muted)",
								fontSize: "0.8rem",
								fontWeight: 600,
								textTransform: "uppercase",
								letterSpacing: "2px",
								margin: "0 0 16px 0",
							}}
						>
							Acceso Rápido
						</h3>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
								gap: "14px",
							}}
						>
							{[
								{
									label: "Control Despacho",
									sub: "Gestionar salidas",
									icon: <ClipboardList size={28} />,
									color: "#3b82f6",
									vista: "control",
								},
								{
									label: "Ver Flota",
									sub: "Estado vehículos",
									icon: <Bus size={28} />,
									color: "#3498db",
									vista: "flota",
								},
								{
									label: "Paradas",
									sub: "Registrar llegadas",
									icon: <MapPin size={28} />,
									color: "#e67e22",
									vista: "paradas",
								},
								{
									label: "Reportar",
									sub: "Novedades del turno",
									icon: <AlertTriangle size={28} />,
									color: "#e74c3c",
									vista: "novedad",
								},
								{
									label: "Reporte",
									sub: "Resumen del día",
									icon: <BarChart2 size={28} />,
									color: "#9b59b6",
									vista: "reporte",
								},
								{
									label: "Mi Perfil",
									sub: "Expediente personal",
									icon: <User size={28} />,
									color: "#1abc9c",
									vista: "expediente",
								},
							].map((item, i) => (
								<button
									key={i}
									onClick={() => setVistaActiva(item.vista)}
									style={{
										background: "rgba(255,255,255,0.04)",
										border: "1px solid rgba(255,255,255,0.08)",
										borderRadius: "16px",
										padding: "20px 16px",
										cursor: "pointer",
										textAlign: "left",
										transition: "all 0.25s ease",
										color: "var(--text-main)",
										display: "flex",
										flexDirection: "column",
										gap: "12px",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = "translateY(-4px)";
										e.currentTarget.style.background = `linear-gradient(135deg, ${item.color}18, ${item.color}05)`;
										e.currentTarget.style.borderColor = `${item.color}40`;
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = "translateY(0)";
										e.currentTarget.style.background = "rgba(255,255,255,0.04)";
										e.currentTarget.style.borderColor =
											"rgba(255,255,255,0.08)";
									}}
								>
									<div
										style={{
											width: "48px",
											height: "48px",
											borderRadius: "12px",
											background: `${item.color}20`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color: item.color,
										}}
									>
										{item.icon}
									</div>
									<div>
										<div
											style={{
												fontWeight: 700,
												fontSize: "0.9rem",
												color: "var(--text-main)",
												marginBottom: "2px",
											}}
										>
											{item.label}
										</div>
										<div
											style={{
												fontSize: "0.75rem",
												color: "var(--text-muted)",
											}}
										>
											{item.sub}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* ── EXPEDIENTE ── */}
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

				{/* ── CONTROL (Inicio) ── */}
				{vistaActiva === "control" && (
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
						<h3 style={{ color: "#3b82f6" }}>Panel de Supervisión Principal</h3>
						<p>
							Dirígete a las pestañas laterales para gestionar tiempos de la
							ruta.
						</p>
					</div>
				)}

				{/* ── FLOTA ── */}
				{vistaActiva === "flota" && (
					<div>
						<h3 style={{ color: "var(--text-main)" }}>Estado de Unidades</h3>
						{listaUnidades.length === 0 ? (
							<p>No hay registro de vehículos.</p>
						) : (
							<div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
								{listaUnidades.map((un) => (
									<div
										key={un._id}
										style={{
											flex: "1 1 250px",
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
											{un.nombre}
										</h4>
										<div style={{ fontSize: "0.9rem", marginBottom: "5px" }}>
											{un.modelo} - Placa: {un.placa}
										</div>
										<div style={{ fontSize: "0.9rem", color: "#f39c12" }}>
											A cargo: {un.choferAsignado || "Ninguno"}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* ── PARADAS ── */}
				{vistaActiva === "paradas" && (
					<div>
						{!paradaFiscalSeleccionada ? (
							<div className="parada-list-container">
								<h2 style={{ color: "var(--text-main)", marginBottom: "20px" }}>
									Registro Oficial de Paradas
								</h2>
								<div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
									<div
										className="parada-card calderas"
										onClick={() => setParadaFiscalSeleccionada("CALDERAS")}
									>
										<h3>📍 Las Calderas</h3>
										<p>Gestionar llegadas en la cabecera principal.</p>
									</div>
									<div
										className="parada-card san-antonio"
										onClick={() => setParadaFiscalSeleccionada("SAN ANTONIO")}
									>
										<h3>📍 San Antonio</h3>
										<p>Gestionar llegadas en el punto medio.</p>
									</div>
									<div
										className="parada-card falcon"
										onClick={() =>
											setParadaFiscalSeleccionada("JUAN CRISOSTOMO FALCON")
										}
									>
										<h3>📍 J.C. Falcón</h3>
										<p>Gestionar llegadas en el retorno.</p>
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
										Parada Activa: {paradaFiscalSeleccionada}
									</h2>
									<button
										className="btn-login"
										style={{
											width: "auto",
											margin: 0,
											padding: "10px 20px",
											background: "#7f8c8d",
										}}
										onClick={() => {
											setParadaFiscalSeleccionada(null);
											setEditandoId(null);
											setHora("");
											setAdminUser("");
											setAdminPass("");
										}}
									>
										⬅ Cambiar Parada
									</button>
								</div>

								<div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
									{/* Formulario Registrar / Editar */}
									<div style={{ flex: "1", minWidth: "300px" }}>
										<h3
											style={{
												color: "var(--text-main)",
												marginBottom: "15px",
											}}
										>
											{editandoId ? "Editar Llegada" : "Registrar Llegada"}
										</h3>

										{editandoId && (
											<div
												style={{
													background: "rgba(231, 76, 60, 0.2)",
													padding: "10px",
													borderRadius: "8px",
													marginBottom: "15px",
													border: "1px solid #e74c3c",
												}}
											>
												<p
													style={{
														margin: "0 0 10px 0",
														fontSize: "0.9rem",
														color: "var(--text-main)",
													}}
												>
													ATENCIÓN: Se requieren permisos administrativos para
													esta corrección.
												</p>
												<input
													type="text"
													placeholder="Usuario de Admin"
													value={adminUser}
													onChange={(e) => setAdminUser(e.target.value)}
													style={{
														width: "calc(100% - 20px)",
														marginBottom: "10px",
														padding: "10px",
														borderRadius: "5px",
														background: "rgba(28, 40, 51, 0.45)",
														backdropFilter: "blur(12px)",
														WebkitBackdropFilter: "blur(12px)",
														boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
														border: "none",
														color: "var(--text-main)",
													}}
												/>
												<input
													type="password"
													placeholder="Contraseña de Admin"
													value={adminPass}
													onChange={(e) => setAdminPass(e.target.value)}
													style={{
														width: "calc(100% - 20px)",
														marginBottom: "10px",
														padding: "10px",
														borderRadius: "5px",
														background: "rgba(28, 40, 51, 0.45)",
														backdropFilter: "blur(12px)",
														WebkitBackdropFilter: "blur(12px)",
														boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
														border: "none",
														color: "var(--text-main)",
													}}
												/>
											</div>
										)}

										<form
											onSubmit={
												editandoId
													? handleModificarLlegada
													: handleRegistrarLlegada
											}
										>
											{!editandoId && (
												<SearchableSelector
													label="Unidad"
													placeholder="🔍 Busca unidad por nombre o placa..."
													options={unidadesOperativasOptions}
													value={uSeleccionada}
													onChange={(val) => setUSeleccionada(val)}
												/>
											)}

											<div
												className="input-group"
												style={{ marginTop: "15px" }}
											>
												<label>Hora Registrada</label>
												<input
													type="time"
													value={hora}
													onChange={(e) => setHora(e.target.value)}
													required
												/>
											</div>

											<div style={{ display: "flex", gap: "10px" }}>
												<button
													type="submit"
													className="btn-login"
													style={{
														flex: 1,
														background: editandoId ? "#e74c3c" : "#3498db",
													}}
												>
													{editandoId ? "APLICAR EDICIÓN" : "GUARDAR HORARIO"}
												</button>
												{editandoId && (
													<button
														type="button"
														onClick={() => {
															setEditandoId(null);
															setHora("");
															setAdminUser("");
															setAdminPass("");
														}}
														className="btn-login"
														style={{ flex: 1, background: "#7f8c8d" }}
													>
														CANCELAR
													</button>
												)}
											</div>
										</form>
									</div>

									{/* Lista de llegadas */}
									<div style={{ flex: "1.5", minWidth: "350px" }}>
										<h3
											style={{
												color: "var(--text-main)",
												marginBottom: "15px",
											}}
										>
											Llegadas Registradas: {paradaFiscalSeleccionada}
										</h3>
										{listaLlegadas.filter(
											(ll) => ll.parada === paradaFiscalSeleccionada,
										).length === 0 ? (
											<p>No hay llegadas registradas aquí hoy.</p>
										) : (
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													gap: "15px",
													maxHeight: "400px",
													overflowY: "auto",
												}}
											>
												{listaLlegadas
													.filter(
														(ll) => ll.parada === paradaFiscalSeleccionada,
													)
													.map((ll) => (
														<div
															key={ll._id}
															style={{
																background: "rgba(52, 152, 219, 0.2)",
																padding: "15px",
																borderRadius: "12px",
																borderLeft: "4px solid #3498db",
																display: "flex",
																justifyContent: "space-between",
																alignItems: "center",
															}}
														>
															<div>
																<h4
																	style={{
																		margin: "0 0 5px 0",
																		color: "var(--text-main)",
																	}}
																>
																	{ll.nombreUnidad}
																</h4>
																<p style={{ margin: "5px 0" }}>
																	<strong>Parada:</strong> {ll.parada}
																</p>
																<p style={{ margin: "0" }}>
																	<strong>Hora:</strong> {ll.horaLlegada}
																</p>
															</div>
															<button
																onClick={() => abrirEdicion(ll)}
																style={{
																	background: "rgba(255,255,255,0.1)",
																	color: "var(--text-main)",
																	border: "none",
																	padding: "8px 15px",
																	borderRadius: "5px",
																	cursor: "pointer",
																}}
															>
																✏️ Editar
															</button>
														</div>
													))}
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* ── NOVEDAD ── */}
				{vistaActiva === "novedad" && (
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
							<h4 style={{ margin: "0 0 15px 0", color: "#e74c3c" }}>
								Reporte General
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
									placeholder="Ej: Chofer conduciendo a exceso de velocidad..."
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
									NOTIFICAR ADMINISTRADOR
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
							<h4 style={{ margin: "0 0 15px 0", color: "#3498db" }}>
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

				{/* ── REPORTE DEL DÍA ── */}
				{vistaActiva === "reporte" && (
					<div className="fade-in-tab">
						<p className="slogan" style={{ marginBottom: "25px" }}>
							Genera un reporte PDF del día con todas las operaciones
							registradas: unidades activas, llegadas por parada, intervalos y
							el conteo secuencial de vueltas completadas.
						</p>

						{/* Estadísticas rápidas */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
								gap: "15px",
								marginBottom: "30px",
							}}
						>
							{[
								{
									label: "Total Llegadas",
									value: listaLlegadas.length,
									color: "#3b82f6",
									icon: "🚌",
								},
								{
									label: "Unidades Operativas",
									value: listaUnidades.filter((u) => u.estado === "Operativa")
										.length,
									color: "#3498db",
									icon: "✅",
								},
								{
									label: "Paradas Monitoreadas",
									value: 3,
									color: "#f1c40f",
									icon: "📍",
								},
								{
									label: "Hora Inicio Op.",
									value:
										listaLlegadas.length > 0
											? [...listaLlegadas].sort((a, b) =>
													a.horaLlegada?.localeCompare(b.horaLlegada),
												)[0]?.horaLlegada || "N/A"
											: "N/A",
									color: "#e67e22",
									icon: "🕐",
								},
							].map((stat, i) => (
								<div
									key={i}
									style={{
										background: "rgba(28, 40, 51, 0.45)",
										backdropFilter: "blur(12px)",
										WebkitBackdropFilter: "blur(12px)",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
										border: `1px solid ${stat.color}30`,
										borderRadius: "14px",
										padding: "20px",
										textAlign: "center",
									}}
								>
									<div style={{ fontSize: "2rem", marginBottom: "5px" }}>
										{stat.icon}
									</div>
									<div
										style={{
											color: stat.color,
											fontSize: "1.8rem",
											fontWeight: "bold",
										}}
									>
										{stat.value}
									</div>
									<div
										style={{
											color: "var(--text-muted)",
											fontSize: "0.8rem",
											marginTop: "4px",
										}}
									>
										{stat.label}
									</div>
								</div>
							))}
						</div>

						{/* Botón Exportar PDF */}
						<div
							style={{
								display: "flex",
								gap: "15px",
								flexWrap: "wrap",
								marginBottom: "30px",
							}}
						>
							<button
								onClick={generarReportePDF}
								disabled={generandoPDF}
								className="btn-login"
								style={{
									background: "linear-gradient(135deg, #e74c3c, #c0392b)",
									maxWidth: "280px",
									display: "flex",
									alignItems: "center",
									gap: "10px",
									justifyContent: "center",
								}}
							>
								{generandoPDF ? "⏳ Generando..." : "📄 EXPORTAR REPORTE PDF"}
							</button>
						</div>

						{/* NUEVO: Tabla de Vueltas Completadas (Ciclos) */}
						{listaLlegadas.length > 0 && (
							<div style={{ marginBottom: "35px" }}>
								<h4
									style={{
										color: "#3b82f6",
										marginBottom: "15px",
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
								>
									🔄 Vueltas Completadas por las Unidades (Ciclos de 3 Paradas)
								</h4>
								<div
									style={{
										background: "rgba(28, 40, 51, 0.45)",
										backdropFilter: "blur(12px)",
										WebkitBackdropFilter: "blur(12px)",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
										borderRadius: "12px",
										padding: "18px",
										overflowX: "auto",
										border: "1px solid rgba(59, 130, 246,0.15)",
									}}
								>
									<table
										style={{
											width: "100%",
											borderCollapse: "collapse",
											color: "var(--text-main)",
											fontSize: "0.9rem",
										}}
									>
										<thead>
											<tr
												style={{
													borderBottom: "2px solid rgba(59, 130, 246,0.3)",
													textAlign: "left",
												}}
											>
												<th style={{ padding: "12px 10px" }}>Unidad</th>
												<th style={{ padding: "12px 10px" }}>Ciclo / Vuelta</th>
												<th style={{ padding: "12px 10px" }}>
													📍 Calderas (Inicio)
												</th>
												<th style={{ padding: "12px 10px" }}>
													📍 San Antonio (Medio)
												</th>
												<th style={{ padding: "12px 10px" }}>
													📍 J.C. Falcón (Fin)
												</th>
												<th style={{ padding: "12px 10px", color: "#3b82f6" }}>
													Duración Total
												</th>
											</tr>
										</thead>
										<tbody>
											{(() => {
												const uniqUnidades = [
													...new Set(
														listaLlegadas.map((ll) => ll.nombreUnidad),
													),
												];
												const listVueltas = [];
												uniqUnidades.forEach((unidad) => {
													const llU = listaLlegadas.filter(
														(ll) => ll.nombreUnidad === unidad,
													);
													const resV = calcularVueltasPorUnidad(llU);
													resV.detalles.forEach((d) => {
														listVueltas.push({ unidad, ...d });
													});
												});
												if (listVueltas.length === 0) {
													return (
														<tr>
															<td
																colSpan="6"
																style={{
																	padding: "20px",
																	textAlign: "center",
																	color: "var(--text-muted)",
																}}
															>
																Ninguna unidad ha completado la secuencia de las
																3 paradas hoy todavía.
															</td>
														</tr>
													);
												}
												return listVueltas.map((v, idx) => (
													<tr
														key={idx}
														style={{
															borderBottom: "1px solid rgba(255,255,255,0.05)",
															background:
																idx % 2 === 0
																	? "rgba(255,255,255,0.02)"
																	: "transparent",
														}}
													>
														<td
															style={{
																padding: "12px 10px",
																fontWeight: "bold",
															}}
														>
															{v.unidad}
														</td>
														<td
															style={{ padding: "12px 10px", color: "#3498db" }}
														>
															Vuelta {v.numero}
														</td>
														<td style={{ padding: "12px 10px", color: "#ccc" }}>
															{v.inicio}
														</td>
														<td style={{ padding: "12px 10px", color: "#ccc" }}>
															{v.medio}
														</td>
														<td style={{ padding: "12px 10px", color: "#ccc" }}>
															{v.fin}
														</td>
														<td
															style={{
																padding: "12px 10px",
																fontWeight: "bold",
																color: "#3b82f6",
															}}
														>
															⏱️ {v.duracion}
														</td>
													</tr>
												));
											})()}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Vista previa de llegadas */}
						{listaLlegadas.length > 0 && (
							<div>
								<h4 style={{ color: "var(--text-main)", marginBottom: "15px" }}>
									Vista Previa de Registros del Día
								</h4>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "10px",
										maxHeight: "350px",
										overflowY: "auto",
									}}
								>
									{listaLlegadas.map((ll, i) => (
										<div
											key={ll._id || i}
											style={{
												background: "rgba(28, 40, 51, 0.45)",
												backdropFilter: "blur(12px)",
												WebkitBackdropFilter: "blur(12px)",
												border: "1px solid rgba(255, 255, 255, 0.1)",
												boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
												borderRadius: "10px",
												padding: "12px 18px",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												borderLeft: "3px solid #3b82f6",
											}}
										>
											<div>
												<span
													style={{
														fontWeight: "bold",
														color: "var(--text-main)",
													}}
												>
													{ll.nombreUnidad}
												</span>
												<span
													style={{
														color: "var(--text-muted)",
														fontSize: "0.85rem",
														marginLeft: "10px",
													}}
												>
													📍 {ll.parada}
												</span>
											</div>
											<span style={{ color: "#3b82f6", fontWeight: "bold" }}>
												{ll.horaLlegada}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* ── SEGURIDAD ── */}
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

export default Fiscal;
