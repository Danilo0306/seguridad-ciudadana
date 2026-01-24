import { useState, useEffect, useCallback } from "react";
import usuarioImg from "../../img/usuario/img.png";
import "../../css/Vista_usuario/perfil.css";
import { FaEdit, FaLock, FaPhoneAlt } from "react-icons/fa";

const API = "http://127.0.0.1:8000/api";

async function fetchJSON(path, token) {
  try {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchFirst(paths, token) {
  for (const p of paths) {
    const data = await fetchJSON(p, token);
    if (data) return data;
  }
  return null;
}

const getIatMsFromJWT = (token) => {
  try {
    const payload = JSON.parse(atob(String(token).split(".")[1]));
    const sec = payload?.iat || payload?.auth_time;
    return sec ? sec * 1000 : null;
  } catch {
    return null;
  }
};

const prettyLastAccess = (raw) => {
  let ts = null;
  if (raw && raw !== "No disponible") {
    const d = new Date(raw);
    if (!isNaN(d)) ts = d.getTime();
  }
  if (!ts) {
    const tok = localStorage.getItem("access");
    ts = getIatMsFromJWT(tok);
  }
  if (!ts) return "🕓 Sin registro";

  const d = new Date(ts);
  const now = Date.now();
  const diffMs = now - ts;
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);

  const timeStr = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sec < 60) return "🟢 Ahora mismo";
  if (min < 60) return `⏱️ hace ${min} min`;
  if (hr < 24 && sameDay(d, today)) return `🕒 hoy a las ${timeStr}`;
  if (sameDay(d, yesterday)) return `🗓️ ayer a las ${timeStr}`;
  return `📅 ${dateStr} • ${timeStr}`;
};

const modalCard = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 12px 30px rgba(0,0,0,.12)",
  padding: "18px 18px 14px",
  width: "min(520px, 92vw)",
};
const modalHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};
const modalClose = {
  cursor: "pointer",
  fontSize: 22,
  lineHeight: 1,
  border: "none",
  background: "transparent",
};
const field = { display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" };
const input = {
  padding: "10px 12px",
  border: "1px solid #e3e6eb",
  borderRadius: 10,
  outline: "none",
};
const actions = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  marginTop: 14,
};

const statusWrap = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#eaf7ee",
  color: "#1e7d3a",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 600,
};
const glowDot = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#4caf50",
  boxShadow: "0 0 0 0 rgba(76, 175, 80, .7)",
  animation: "pulseGlow 1.8s infinite",
};
const statusText = { letterSpacing: ".2px" };

export default function Perfil({ darkMode, setDarkMode, setFotoPerfil }) {
  const [usuario, setUsuario] = useState({
    nombre: "Usuario",
    email: "No registrado",
    telefono: "No hay número registrado",
    activo: true,
    ultimo_acceso: "No disponible",
    contacto_emergencia: { nombre: "No registrado", telefono: "No registrado" },
    preferencias: {},
    foto_url: null,
  });

  const [loading, setLoading] = useState(true);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    contacto_emergencia_nombre: "",
    contacto_emergencia_telefono: "",
  });
  const [saving, setSaving] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [pwd, setPwd] = useState({ actual: "", nueva: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  // Nueva solución: prioridad al localStorage
  const [previewFoto, setPreviewFoto] = useState(localStorage.getItem("fotoPerfil") || usuarioImg);
  const [nuevaFoto, setNuevaFoto] = useState(null);

  const handleKey = useCallback((e) => {
    if (e.key === "Escape") {
      setShowEdit(false);
      setShowPass(false);
    }
  }, []);

  useEffect(() => {
    if (showEdit || showPass) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showEdit, showPass, handleKey]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("access");
      if (!token) { setLoading(false); return; }

      const me = await fetchJSON(`${API}/me/`, token);
      if (me) {
        setUsuario(prev => ({
          ...prev,
          nombre: me.username || localStorage.getItem("username") || prev.nombre,
          email: me.email || prev.email,
          foto_url: me.foto_url || prev.foto_url
        }));
        // Forzar persistencia en localStorage
        if (me.foto_url) {
          localStorage.setItem("fotoPerfil", me.foto_url);
          setPreviewFoto(me.foto_url);
          setFotoPerfil?.(me.foto_url);
        }
      }

      const perfil = await fetchFirst(
        [`${API}/perfil-usuario/`, `${API}/perfilUsuario/`, `${API}/perfil/`],
        token
      );
      if (perfil) {
        setUsuario(prev => ({
          ...prev,
          telefono: perfil.telefono || prev.telefono,
          activo: true,
          ultimo_acceso: perfil.ultimo_acceso || perfil.last_login || prev.ultimo_acceso,
          contacto_emergencia: {
            nombre: perfil.contacto_emergencia_nombre ?? perfil?.contacto_emergencia?.nombre ?? prev.contacto_emergencia.nombre,
            telefono: perfil.contacto_emergencia_telefono ?? perfil?.contacto_emergencia?.telefono ?? prev.contacto_emergencia.telefono,
          },
          preferencias: perfil.preferencias || prev.preferencias,
        }));
      }

      setLoading(false);
    })();
  }, [setFotoPerfil]);

  const isNineDigits = (v) => /^\d{9}$/.test(String(v).trim());
  const validar = () => {
    const nombre = form.nombre.trim();
    if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (form.telefono && !isNineDigits(form.telefono))
      return "El teléfono debe tener exactamente 9 dígitos";
    if (form.contacto_emergencia_telefono && !isNineDigits(form.contacto_emergencia_telefono))
      return "El teléfono de emergencia debe tener exactamente 9 dígitos";
    return "";
  };

  const abrirEditar = () => {
    setForm({
      nombre: usuario.nombre || "",
      telefono: usuario.telefono && usuario.telefono !== "No hay número registrado" ? usuario.telefono : "",
      contacto_emergencia_nombre: usuario.contacto_emergencia?.nombre && usuario.contacto_emergencia.nombre !== "No registrado" ? usuario.contacto_emergencia.nombre : "",
      contacto_emergencia_telefono: usuario.contacto_emergencia?.telefono && usuario.contacto_emergencia.telefono !== "No registrado" ? usuario.contacto_emergencia.telefono : "",
    });
    setNuevaFoto(null);
    setError("");
    setGuardado(false);
    setShowEdit(true);
  };

  const guardarPerfil = async (e) => {
    e?.preventDefault?.();
    const token = localStorage.getItem("access");
    if (!token) return;

    const v = validar();
    if (v) { setError(v); return; }

    setSaving(true);
    setError("");
    setGuardado(false);

    try {
      const payload = {};
      for (const [k, v] of Object.entries(form)) if (String(v).trim() !== "") payload[k] = v.trim();

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      if (nuevaFoto) formData.append("foto", nuevaFoto);

      const res = await fetch(`${API}/perfil-usuario/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo actualizar");
      }

      setUsuario(prev => ({
        ...prev,
        ...payload,
        telefono: payload.telefono ?? prev.telefono ?? "No hay número registrado",
        contacto_emergencia: {
          nombre: payload.contacto_emergencia_nombre ?? prev.contacto_emergencia.nombre ?? "No registrado",
          telefono: payload.contacto_emergencia_telefono ?? prev.contacto_emergencia.telefono ?? "No registrado",
        },
      }));

      if (payload.nombre) localStorage.setItem("username", payload.nombre);

      if (nuevaFoto) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewFoto(reader.result);
          setFotoPerfil?.(reader.result);
          localStorage.setItem("fotoPerfil", reader.result); // <--- Guardar en localStorage
        };
        reader.readAsDataURL(nuevaFoto);
      }

      setGuardado(true);
      setShowEdit(false);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const cambiarPassword = async (e) => {
    e?.preventDefault?.();
    const token = localStorage.getItem("access");
    if (!token) return;

    if (!pwd.actual || !pwd.nueva || pwd.nueva.length < 6) {
      setPwdMsg("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPwdSaving(true);
    setPwdMsg("");

    try {
      const res = await fetch(`${API}/cambiar-password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actual: pwd.actual, nueva: pwd.nueva }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "No se pudo cambiar la contraseña");

      setPwdMsg("Contraseña actualizada ✅");
      setPwd({ actual: "", nueva: "" });
      setShowPass(false);
      setTimeout(() => setPwdMsg(""), 2000);
    } catch (e2) {
      setPwdMsg(e2.message);
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <p>Cargando información del usuario...</p>;

  return (
    <section className={`perfil ${darkMode ? "dark" : "light"}`}>
      <style>{`@keyframes pulseGlow {0% {box-shadow:0 0 0 0 rgba(76,175,80,.6);} 70% {box-shadow:0 0 0 10px rgba(76,175,80,0);} 100% {box-shadow:0 0 0 0 rgba(76,175,80,0);}}`}</style>

      <div className="perfil-grid">
        <div className="card perfil-foto">
          <img src={previewFoto} alt="Usuario" className="profile-avatar" />
          <h2>{usuario.nombre}</h2>
          <p><FaPhoneAlt /> Teléfono: {usuario.telefono}</p>
          <p>Email: {usuario.email}</p>

          <div style={statusWrap}>
            <span style={glowDot} />
            <span style={statusText}>Activo</span>
          </div>
        </div>

        <div className="card perfil-info">
          <h3>Información de Contacto <FaEdit /></h3>
          <div className="contacto">
            <h4>Contacto de Emergencia</h4>
            <p><FaPhoneAlt /> Nombre: {usuario.contacto_emergencia?.nombre || "No registrado"}</p>
            <p><FaPhoneAlt /> Teléfono: {usuario.contacto_emergencia?.telefono || "No registrado"}</p>
          </div>

          {guardado && <p style={{ color: "#22a06b", fontWeight: 600, marginTop: 8 }}>Datos actualizados ✅</p>}
          {error && <p style={{ color: "#d33", marginTop: 8 }}>{error}</p>}

          <button className="btn-edit" onClick={abrirEditar}><FaEdit /> Editar Información</button>
        </div>

        <div className="card perfil-seguridad">
          <h3>Seguridad</h3>
          <p>Último acceso: {prettyLastAccess(usuario.ultimo_acceso)}</p>
          <button className="btn-change-pass" onClick={() => setShowPass(true)}><FaLock /> Cambiar Contraseña</button>
          {!!pwdMsg && <p style={{ marginTop: 8 }}>{pwdMsg}</p>}
        </div>

        <div className="card perfil-preferencias">
          <h3>Preferencias</h3>
          <label className="toggle">
            <input type="checkbox" checked={!!darkMode} onChange={() => setDarkMode && setDarkMode(!darkMode)} />
            <span className="slider"></span>
            Modo Oscuro
          </label>
        </div>
      </div>

      {showEdit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <form style={modalCard} className="modal" onSubmit={guardarPerfil}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Editar Información</h3>
              <button type="button" aria-label="Cerrar" style={modalClose} onClick={() => setShowEdit(false)}>×</button>
            </div>

            <div style={field}>
              <label>Nombre</label>
              <input style={input} type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>

            <div style={field}>
              <label>Teléfono (9 dígitos)</label>
              <input style={input} type="tel" inputMode="numeric" pattern="\d{9}" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>

            <div style={field}>
              <label>Contacto de emergencia - Nombre</label>
              <input style={input} type="text" value={form.contacto_emergencia_nombre} onChange={(e) => setForm({ ...form, contacto_emergencia_nombre: e.target.value })} />
            </div>

            <div style={field}>
              <label>Contacto de emergencia - Teléfono (9 dígitos)</label>
              <input style={input} type="tel" inputMode="numeric" pattern="\d{9}" value={form.contacto_emergencia_telefono} onChange={(e) => setForm({ ...form, contacto_emergencia_telefono: e.target.value })} />
            </div>

            <div style={field}>
              <label>Foto de Perfil</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNuevaFoto(file);
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPreviewFoto(reader.result);
                    setFotoPerfil?.(reader.result);
                    localStorage.setItem("fotoPerfil", reader.result); // Guardar en localStorage
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            <div style={actions}>
              <button type="button" onClick={() => setShowEdit(false)}>Cancelar</button>
              <button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      )}

      {showPass && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowPass(false)}>
          <form style={modalCard} className="modal" onSubmit={cambiarPassword}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Cambiar contraseña</h3>
              <button type="button" aria-label="Cerrar" style={modalClose} onClick={() => setShowPass(false)}>×</button>
            </div>

            <div style={field}>
              <label>Contraseña actual</label>
              <input style={input} type="password" value={pwd.actual} onChange={(e) => setPwd({ ...pwd, actual: e.target.value })} />
            </div>

            <div style={field}>
              <label>Nueva contraseña</label>
              <input style={input} type="password" value={pwd.nueva} onChange={(e) => setPwd({ ...pwd, nueva: e.target.value })} />
            </div>

            <div style={actions}>
              <button type="submit" disabled={pwdSaving}>{pwdSaving ? "Actualizando..." : "Actualizar"}</button>
              <button type="button" onClick={() => setShowPass(false)} disabled={pwdSaving}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}  
