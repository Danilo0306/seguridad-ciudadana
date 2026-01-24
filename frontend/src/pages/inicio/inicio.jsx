import '../../css/inicio/inicio.css'; // archivo CSS responsive
import Aside from "./components/Aside";
import Footer from "./components/footer";
import Header from "./components/Header";
import MainSection from "./components/MainSection";

export default function Inicio() {
    return (
        <div className="inicio-container">
            {/* HEADER */}
            <Header />

            {/* Wrapper para centrar contenido */}
            <div className="inicio-wrapper">
                {/* CONTENIDO PRINCIPAL */}
                <main className="main-container">
                    {/* Fila superior: contenido principal + mapa */}
                    <div className="top-row">
                        {/* Sección principal */}
                        <div className="main-column">
                            <MainSection onlyMainCard={true} />
                        </div>

                        {/* Barra lateral (Aside / Mapa) */}
                        <div className="aside-column">
                            <Aside />
                        </div>
                    </div>

                    {/* Fila inferior: sección que ocupa todo el ancho */}
                    <div className="lower-row">
                        <MainSection onlyLower={true} />
                    </div>
                </main>
            </div>

            {/* FOOTER */}
            <Footer />
        </div>
    );
}
