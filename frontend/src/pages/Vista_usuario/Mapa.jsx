import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Importar iconos de Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Configuración de iconos predeterminados de Leaflet
delete L.Icon.Default.prototype._getIconUrl; // Eliminar url de iconos default
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x, // Icono retina
  iconUrl: markerIcon,          // Icono normal
  shadowUrl: markerShadow,      // Sombra del icono
});

// Componente principal del mapa
export default function Mapa({ incidentes = [] }) {
  // Estado para la búsqueda de direcciones
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // Sugerencias de Nominatim
  const [selected, setSelected] = useState(null);     // Incidente seleccionado
  const [center, setCenter] = useState([-11.95, -77.07]); // Centro inicial del mapa
  const abortControllerRef = useRef(null); // Para cancelar peticiones fetch
  const debounceRef = useRef(null);        // Para implementar debounce

  // Función para calcular distancia entre coordenadas en metros
  const distanciaMetros = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Función para buscar dirección con Nominatim y asociarla a incidentes cercanos
  const buscarDireccion = async (text) => {
    if (!text) return setSuggestions([]);
    if (abortControllerRef.current) abortControllerRef.current.abort(); // Cancelar petición anterior
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          text
        )}&countrycodes=PE&limit=5`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "TuAppNombre/1.0 (tuemail@dominio.com)",
          },
        }
      );
      const data = await res.json();

      // Vincular resultados con incidentes cercanos
      const resultados = data.map((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        // Buscar un incidente dentro de 50 metros
        const incidenteCercano = incidentes.find(
          (inc) =>
            inc.Latitud &&
            inc.Longitud &&
            !isNaN(inc.Latitud) &&
            !isNaN(inc.Longitud) &&
            distanciaMetros(parseFloat(inc.Latitud), parseFloat(inc.Longitud), lat, lon) < 50
        );

        return { ...item, incidenteCercano };
      });

      setSuggestions(resultados);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
  };

  // Manejar cambio de texto en input de búsqueda
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null); // Limpiar selección previa

    // Debounce para no hacer muchas peticiones
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarDireccion(val), 400);
  };

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (item) => {
    if (item.incidenteCercano) {
      // Si hay un incidente cercano, seleccionar ese incidente
      const inc = item.incidenteCercano;
      setSelected({
        Latitud: parseFloat(inc.Latitud),
        Longitud: parseFloat(inc.Longitud),
        Ubicacion: inc.Ubicacion,
        NombreIncidente: inc.NombreIncidente,
        Descripcion: inc.Descripcion,
        Escala: inc.Escala,
      });
      setCenter([parseFloat(inc.Latitud), parseFloat(inc.Longitud)]);
    } else {
      // Si no hay incidente, solo mostrar la ubicación buscada
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        setSelected({
          Latitud: lat,
          Longitud: lon,
          Ubicacion: item.display_name,
          NombreIncidente: "",
          Descripcion: "",
        });
        setCenter([lat, lon]);
      }
    }

    setQuery(item.display_name); // Actualizar input
    setSuggestions([]);           // Limpiar sugerencias
  };

  // Centrar en el último incidente registrado al cargar el mapa
  useEffect(() => {
    if (incidentes.length > 0) {
      const ultimo = incidentes[incidentes.length - 1];
      if (
        ultimo.Latitud &&
        ultimo.Longitud &&
        !isNaN(ultimo.Latitud) &&
        !isNaN(ultimo.Longitud)
      ) {
        setCenter([parseFloat(ultimo.Latitud), parseFloat(ultimo.Longitud)]);
      }
    }
  }, [incidentes]);

  return (
    <div>
      {/* Input de búsqueda */}
      <div style={{ marginBottom: "10px", position: "relative", maxWidth: "400px" }}>
        <input
          type="text"
          placeholder="Buscar dirección en Perú..."
          value={query}
          onChange={handleInputChange}
          style={{ width: "100%", padding: "8px" }}
        />
        {/* Sugerencias de búsqueda */}
        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "36px",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 1000,
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {suggestions.map((item, i) => (
              <li
                key={i}
                onClick={() => handleSelectSuggestion(item)}
                style={{ padding: "8px", cursor: "pointer" }}
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contenedor del mapa */}
      <div style={{ width: "100%", height: "500px" }}>
        <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Marcadores de todos los incidentes */}
          {incidentes
            .filter(
              (inc) =>
                inc.Latitud &&
                inc.Longitud &&
                !isNaN(inc.Latitud) &&
                !isNaN(inc.Longitud)
            )
            .map((inc, index) => (
              <Marker
                key={index}
                position={[parseFloat(inc.Latitud), parseFloat(inc.Longitud)]}
              >
                <Popup>
                  <strong>{inc.NombreIncidente}</strong>
                  <br />
                  {inc.Descripcion}
                  <br />
                  <em>{inc.Ubicacion}</em>
                  {inc.Escala && <br />}
                  {inc.Escala && <span>Escala: {inc.Escala}</span>}
                </Popup>
              </Marker>
            ))}

          {/* Marcador de la búsqueda seleccionada */}
          {selected && selected.Latitud && selected.Longitud && (
            <Marker
              position={[selected.Latitud, selected.Longitud]}
              opacity={0.8} // Marcador ligeramente transparente para diferenciarlo
            >
              <Popup>
                <strong>{selected.NombreIncidente}</strong>
                <br />
                {selected.Descripcion}
                <br />
                <em>{selected.Ubicacion}</em>
                {selected.Escala && <br />}
                {selected.Escala && <span>Escala: {selected.Escala}</span>}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
