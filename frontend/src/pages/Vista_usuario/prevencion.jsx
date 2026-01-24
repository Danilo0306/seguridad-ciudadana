import React from "react";
import "../../css/Vista_usuario/prevencion.css";

export default function Prevencion() {
  const cards = [
    // --- CATEGORÍA: SEGURIDAD VIAL Y PERSONAL ---
    { 
      icon: "🚶‍♂️", 
      title: "En la Calle / Personal", 
      category: "Vía Pública",
      desc: "Evita usar el celular o auriculares en calles solitarias o mal iluminadas. Mantente alerta a tu entorno y camina en sentido contrario al tráfico vehicular.",
      level: 1
    },
    { 
      icon: "💰", 
      title: "Transacciones y Bancos",
      category: "Financiera", 
      desc: "Nunca retires grandes sumas de dinero solo. Si usas un cajero, verifica que nadie te observe y evita contar dinero en público. Divide tu efectivo.",
      level: 2
    },
    { 
      icon: "🚗", 
      title: "Transporte y Vehículos",
      category: "Vehicular", 
      desc: "Usa apps de taxi formales; evita los taxis de la calle. Al conducir, mantén los seguros puestos y no dejes bolsos o laptops a la vista en los asientos.",
      level: 2
    },
    
    // --- CATEGORÍA: HOGAR Y PROPIEDAD ---
    { 
      icon: "🏠", 
      title: "Seguridad en el Hogar",
      category: "Hogar", 
      desc: "Refuerza cerraduras, no abras la puerta a desconocidos y simula presencia si vas a salir por periodos largos (luces, radio).",
      level: 1
    },
    { 
      icon: "💡", 
      title: "Iluminación y Visibilidad",
      category: "Hogar",
      desc: "Asegura que la entrada de tu casa y la calle colindante estén bien iluminadas. Las zonas oscuras son un riesgo mayor.",
      level: 1
    },
    
    // --- CATEGORÍA: CIBERSEGURIDAD Y FRAUDE ---
    { 
      icon: "🔒", 
      title: "Contraseñas y Cuentas",
      category: "Digital",
      desc: "Usa contraseñas únicas y complejas. Activa la Autenticación de Dos Factores (2FA) en tu correo y banca online.",
      level: 2
    },
    { 
      icon: "📧", 
      title: "Phishing y Estafas",
      category: "Digital",
      desc: "Nunca hagas clic en enlaces ni descargues archivos de correos o mensajes que soliciten datos personales o bancarios (Phishing).",
      level: 3
    },
    
    // --- CATEGORÍA: PREPARACIÓN Y EMERGENCIAS (Contexto Perú) ---
    { 
      icon: "🎒", 
      title: "Mochila de Emergencia",
      category: "Desastres",
      desc: "Ten siempre lista tu mochila de emergencia (documentos, agua, alimentos, botiquín) para casos de sismos o desastres naturales.",
      level: 1
    },
    { 
      icon: "🚨", 
      title: "Números de Contacto",
      category: "Emergencias",
      desc: "Guarda los números de emergencia: Policía: 105, Bomberos: 116, Serenazgo (consulta el número local de Los Olivos).",
      level: 1
    },
  ];

  const categories = [...new Set(cards.map(card => card.category))];

  return (
    <section className="prevencion-page">
      <h2>Consejos de Prevención y Autoprotección</h2>
      <p className="subtitle">Información esencial para mantener la seguridad en casa, en la calle y en el entorno digital.</p>
      
      {categories.map(category => (
        <div key={category} className="category-group">
          <h3 className="category-title">{category}</h3>
          <div className="prevencion-grid">
            {cards.filter(card => card.category === category).map((card, idx) => (
              <div 
                key={idx} 
                className={`prevencion-card level-${card.level}`}
                data-level={card.level === 3 ? "¡Alto Riesgo!" : card.level === 2 ? "Medio Riesgo" : "Bajo Riesgo"}
              >
                <div className="card-header">
                  <span className="icon">{card.icon}</span>
                  <h4>{card.title}</h4>
                </div>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      
    </section>
  );
}