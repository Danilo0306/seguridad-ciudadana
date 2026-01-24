import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../../../css/inicio/styleMainSection.css';
import AutoridadesImg from '../../../img/inicio/autoridades.png';
import CiudadanosImg from '../../../img/inicio/ciudadano.png';
import EmpresasImg from '../../../img/inicio/empresas.png';

// Card de estadísticas
function StatCard({ label, value, accent }) {
    return (
        <div className="stat-card" style={{ borderLeft: `6px solid ${accent}` }}>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
}

// Card de características / tecnología - MODIFICADA
function FeatureCard({ icon, title, desc, bg }) {
    return (
        <div className="feature-card-new" style={{ '--card-accent': bg }}>
            <div className="feature-card-icon-new">{icon}</div>
            <div className="feature-card-content">
                <h4 className="feature-card-title-new">{title}</h4>
                <p className="feature-card-desc-new">{desc}</p>
            </div>
        </div>
    );
}

// Nuevo componente para ítems de servicio
function ServiceItem({ text, subtext }) {
    return (
        <div className="service-item">
            <div className="service-checkbox">✓</div>
            <div className="service-item-content">
                <span className="service-item-text">{text}</span>
                {subtext && <span className="service-item-subtext">{subtext}</span>}
            </div>
        </div>
    );
}

// Nuevo componente para tarjeta de servicio
function ServiceCardNew({ title, description, items, buttonText, image, bgColor }) {
    return (
        <div className="service-card-new" style={{ backgroundColor: bgColor }}>
            <div className="service-card-header">
                <div className="service-card-image">
                    <img src={image} alt={title} />
                </div>
                <h4 className="service-card-title-new">{title}</h4>
                <p className="service-card-desc-new">{description}</p>
            </div>

            <div className="service-items-container">
                {items.map((item, index) => (
                    <ServiceItem key={index} text={item.text} subtext={item.subtext} />
                ))}
            </div>
        </div>
    );
}

export default function MainSection({ onlyMainCard = false, onlyLower = false }) {
    const navigate = useNavigate(); // <-- aquí obtienes navigate
    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };

    }, []);

    // Datos para los servicios
    const servicios = [
        {
            title: "Para Ciudadanos",
            description: "Herramientas para mantenerte seguro y conectado con tu comunidad",
            image: CiudadanosImg,
            bgColor: "#f0f9ff",
            buttonText: "Descargar App Ciudadano",
            items: [
                { text: "Reportes Anónimos", subtext: "Reporta incidentes de forma segura y anónima" },
                { text: "Alertas Personalizadas", subtext: "Recibe notificaciones de tu área de interés" },
                { text: "Rutas Seguras", subtext: "Navegación inteligente evitando zonas de riesgo" }
            ]
        },
        {
            title: "Para Empresas",
            description: "Soluciones de seguridad privada para negocios y residencias",
            image: EmpresasImg,
            bgColor: "#f0fdf4",
            buttonText: "Contratar Seguridad Privada",
            items: [
                { text: "Seguridad Personalizada", subtext: "Planes adaptados a tu tipo de negocio" },
                { text: "Monitoreo 24/7", subtext: "Vigilancia continua con respuesta inmediata" },
                { text: "Integración Completa", subtext: "Conecta con cámaras y sistemas existentes" }
            ]
        },
        {
            title: "Para Autoridades",
            description: "Panel de control avanzado para fuerzas de seguridad y emergencias",
            image: AutoridadesImg,
            bgColor: "#fffbeb",
            buttonText: "Acceso Autoridades",
            items: [
                { text: "Dashboard Operativo", subtext: "Vista completa de incidentes en tiempo real" },
                { text: "Coordinación Interinstitucional", subtext: "Comunicación entre policía, bomberos y hospitales" },
                { text: "Análisis Predictivo", subtext: "IA para prevenir crímenes antes de que ocurran" }
            ]
        }
    ];

    return (
        <section className="main-section">
            <div className="main-section-container">
                {/* Bloque superior: solo la card principal */}
                {!onlyLower && (
                    <div className="main-card">
                        <div className="main-card-left">
                            <h1 style={{ fontSize: "60px", lineHeight: '1' }}>
                                Seguridad en <span>Tiempo Real</span> para tu Ciudad
                            </h1>
                            <p>
                                Plataforma inteligente que conecta ciudadanos, autoridades y servicios de emergencia para crear comunidades más seguras mediante datos y respuesta inmediata.
                            </p>
                            <div style={{ fontSize: "24px", textAlign: "center", color: "black" }}>
                                <span style={{ fontWeight: "bold" }}>
                                    Resultados que Hablan por Sí Solos
                                </span>
                                <p style={{ color: "black" }}>
                                    Nuestra tecnología está transformando la seguridad ciudadana con resultados medibles
                                </p>
                            </div>

                            <div className="stats-container">
                                <StatCard label="Usuarios registrados" value="12.3k" accent="#0ea5e9" />
                                <StatCard label="Incidentes reportados" value="3.4k" accent="#fb7185" />
                                <StatCard label="Tiempo resp. promedio" value="4m 12s" accent="#f59e0b" />
                                <StatCard label="Reducción de Crimen" value="27%" accent="#10b981" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Bloque inferior: secciones que ocupan todo el ancho */}
                {!onlyMainCard && (
                    <div className="section-lower">
                        {/* Tecnología avanzada - SECCIÓN MODIFICADA */}
                        <div id="Servicios" className="tech-section">
                            <div className="tech-header">
                                <h2>Tecnología Avanzada para tu <span>Seguridad</span></h2>
                                <p>Nuestra plataforma integra múltiples funcionalidades para crear un ecosistema completo de seguridad ciudadana conectando a todos los actores importantes.</p>
                            </div>

                            <div className="tech-grid">
                                <FeatureCard
                                    icon="🗺️"
                                    title="Mapa Interactivo en Tiempo Real"
                                    desc="Visualiza incidentes de seguridad en tu área con actualizaciones instantáneas, similar a Waze pero enfocado en seguridad ciudadana."
                                    bg="#0ea5e9"
                                />
                                <FeatureCard
                                    icon="🏛️"
                                    title="Acceso para Autoridades"
                                    desc="Policía, bomberos y hospitales tienen acceso privilegiado para coordinar respuestas rápidas y efectivas ante emergencias."
                                    bg="#6366f1"
                                />
                                <FeatureCard
                                    icon="📣"
                                    title="Sistema de Reportes Ciudadanos"
                                    desc="Reporta robos, asaltos y situaciones sospechosas de forma rápida y anónima. Tu reporte ayuda a proteger a toda la comunidad."
                                    bg="#fb7185"
                                />
                                <FeatureCard
                                    icon="🤖"
                                    title="Monitoreo Inteligente"
                                    desc="Algoritmos de IA analizan patrones de criminalidad para predecir y prevenir incidentes antes de que ocurran."
                                    bg="#f59e0b"
                                />
                                <FeatureCard
                                    icon="🔒"
                                    title="Contratación de Seguridad Privada"
                                    desc="Conecta con empresas de seguridad certificadas para proteger tu hogar o negocio. Cotiza y contrata servicios de forma segura."
                                    bg="#10b981"
                                />
                                <FeatureCard
                                    icon="⚡"
                                    title="Alertas Instantáneas"
                                    desc="Recibe notificaciones inmediatas sobre incidentes cerca de tu ubicación y rutas alternativas seguras."
                                    bg="#ef4444"
                                />
                            </div>
                        </div>

                        {/* NUEVA SECCIÓN DE SERVICIOS ESPECIALIZADOS */}
                        <div className="services-section">
                            <div className="services-header">
                                <h2>Servicios Especializados para <span>Cada Necesidad</span></h2>
                                <p>Desde ciudadanos hasta autoridades, ofrecemos soluciones adaptadas para cada tipo de usuario en nuestro ecosistema de seguridad.</p>
                            </div>

                            <div className="services-grid-new">
                                {servicios.map((servicio, index) => (
                                    <ServiceCardNew
                                        key={index}
                                        title={servicio.title}
                                        description={servicio.description}
                                        items={servicio.items}
                                        image={servicio.image}
                                        bgColor={servicio.bgColor}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* CTA final */}
                        <div className="cta-container">
                            <div className="cta-card">
                                <h2>¿Listo para hacer tu ciudad más segura?</h2>
                                <p>Únete a miles de ciudadanos, empresas y autoridades que ya confían en nuestra plataforma.</p>
                                <div className="cta-buttons">
                                    <button className="cta-btn-main" onClick={() => navigate("/login")}>Comenzar Ahora</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}