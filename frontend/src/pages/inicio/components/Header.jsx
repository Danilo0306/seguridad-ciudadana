import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../css/inicio/styleHeader.css";
import PoliciaImg from "../../../img/inicio/policia.png";

export default function Header() {
	const navigate = useNavigate();
	const [openMenu, setOpenMenu] = useState(false); // estado del drawer
	const firstLinkRef = useRef(null); // referencia para accesibilidad (primer enlace del menú)

	// Cierra el menú si el usuario presiona "ESC"
	useEffect(() => {
		function handleKeyDown(e) {
			if (e.key === "Escape") setOpenMenu(false);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Bloquear scroll del body cuando el menú está abierto
	useEffect(() => {
		if (openMenu) {
			document.body.style.overflow = "hidden";
			// Enfocar el primer link por accesibilidad
			setTimeout(() => {
				firstLinkRef.current?.focus();
			}, 120);
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [openMenu]);

	// Alternar estado del menú
	function toggleMenu() {
		setOpenMenu(prev => !prev);
	}

	// Cerrar menú
	function closeMenu() {
		setOpenMenu(false);
	}

	return (
		<>
			{/* CABECERA PRINCIPAL */}
			<header className="header" role="banner">
				<div className="header-container">

					{/* Sección izquierda: logo */}
					<div
						className="logo-section"
						onClick={() => navigate("/")}
						role="link"
						tabIndex={0}
						onKeyDown={(e) => e.key === "Enter" && navigate("/")}
						aria-label="Ir al inicio"
					>
						<div className="logo-circle" aria-hidden="true">
							<img src={PoliciaImg} alt="Logo Policía" />
						</div>
						<div className="logo-text">
							<div className="title">SEGURIDAD CIUDADANA</div>
							<div className="subtitle">Protección Inteligente</div>
						</div>
					</div>

					{/* Sección derecha: navegación + acciones */}
					<div className="right-section">
						{/* Navegación principal */}
						<nav className="nav-center" aria-label="Navegación principal">
							<a className="nav-link" href="#">Inicio</a>
							<a className="nav-link" href="#">Tecnologías</a>
							<a className="nav-link" href="#">Servicios</a>
						</nav>

						{/* Acciones: login y menú móvil */}
						<div className="header-actions" role="group" aria-label="Acciones">
							<button
								className="btn-authorities"
								onClick={() => navigate("/login")}
								aria-label="Iniciar Sesión"
							>
								Iniciar Sesión
							</button>

							{/* Botón hamburguesa para móviles */}
							<button
								className="btn-menu"
								aria-expanded={openMenu}
								aria-label={openMenu ? "Cerrar menú" : "Abrir menú"}
								onClick={toggleMenu}
								title={openMenu ? "Cerrar menú" : "Abrir menú"}
							>
								<svg
									width="28"
									height="28"
									viewBox="0 0 24 24"
									aria-hidden="true"
									focusable="false"
								>
									<rect x="4" y="6" width="16" height="2" rx="1" fill="#111" />
									<rect x="4" y="11" width="16" height="2" rx="1" fill="#111" />
									<rect x="4" y="16" width="16" height="2" rx="1" fill="#111" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Fondo oscuro del menú móvil */}
			<div
				className={`header-drawer-overlay ${openMenu ? "open" : ""}`}
				onClick={closeMenu}
				aria-hidden={!openMenu}
			/>

			{/* Drawer lateral para móviles */}
			<aside
				className={`header-drawer ${openMenu ? "open" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-hidden={!openMenu}
				aria-label="Menú principal"
			>
				<div className="drawer-top">
					{/* Logo dentro del drawer */}
					<div
						className="logo-section"
						onClick={() => { navigate("/"); closeMenu(); }}
						role="link"
						tabIndex={0}
					>
						<div className="logo-circle" aria-hidden="true">
							<img src={PoliciaImg} alt="Logo Policía" />
						</div>
						<div className="logo-text">
							<div className="title">SEGURIDAD CIUDADANA</div>
						</div>
					</div>

					{/* Botón cerrar */}
					<button
						className="drawer-close"
						onClick={closeMenu}
						aria-label="Cerrar menú"
					>
						✕
					</button>
				</div>

				{/* Navegación móvil */}
				<nav className="drawer-nav" aria-label="Navegación móvil">
					<a ref={firstLinkRef} href="#" onClick={closeMenu}>Inicio</a>
					<a href="#" onClick={closeMenu}>Tecnologías</a>
					<a href="#mapa" onClick={closeMenu}>Planes</a>
				</nav>

				{/* Acciones dentro del drawer */}
				<div className="drawer-actions">
					<button
						className="btn-authorities"
						onClick={() => { closeMenu(); navigate("/login"); }}
					>
						Iniciar Sesión
					</button>
				</div>
			</aside>
		</>
	);
}
