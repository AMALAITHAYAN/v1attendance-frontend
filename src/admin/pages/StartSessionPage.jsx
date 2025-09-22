import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { startSessionForClass } from "../api/sessionsApi";
import { listClasses } from "../api/classesApi";
import TeacherPasswordBar from "./TeacherPasswordBar";

// --- Icon Imports ---
import {
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaSyncAlt, FaMapMarkerAlt,
  FaWifi, FaGlobe, FaSmile, FaQrcode
} from "react-icons/fa";

// --- Helper component to inject global styles (fonts and animations) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes backgroundPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  `}</style>
);

// --- Helper hook for responsive design ---
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
};

// --- STYLES OBJECT ---
const styles = {
  // Design System: "Celestial Slate"
  theme: {
    "--font-family": "'Inter', sans-serif",
    "--bg-color": "#101014", "--surface-color": "#1a1a21",
    "--border-color": "rgba(255, 255, 255, 0.1)", "--shadow-color": "rgba(0, 0, 0, 0.5)",
    "--primary-color": "#6366f1", "--secondary-color": "#2dd4bf",
    "--primary-glow": "rgba(99, 102, 241, 0.3)", "--danger-color": "#f43f5e",
    "--success-color": "#22c55e",
    "--text-primary": "#f0f0f0", "--text-secondary": "#a0a0b0",
    "--radius": "16px", "--transition": "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  page: { fontFamily: "var(--font-family)", minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-primary)", boxSizing: "border-box", padding: "40px 24px", position: "relative", overflow: "hidden" },
  backgroundBlob: { position: "absolute", width: "600px", height: "600px", top: "-200px", left: "50%", transform: "translateX(-50%)", zIndex: 0, background: "radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)", opacity: 0.1, filter: "blur(150px)", animation: "backgroundPan 20s ease-in-out infinite" },
  container: { width: "100%", maxWidth: "980px", margin: "0 auto", position: "relative", zIndex: 1 },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" },
  title: { margin: 0, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.025em" },
  card: { background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "32px", boxShadow: "0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)", marginBottom: "24px" },
  sectionTitle: { fontWeight: 600, fontSize: "20px", marginBottom: "24px", color: "var(--text-primary)" },
  infoText: { fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "-16px", marginBottom: "24px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  fieldLabel: { display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" },
  input: { width: "100%", height: "48px", backgroundColor: "#101014", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "12px", padding: "0 16px", fontSize: "15px", transition: "var(--transition)", boxSizing: "border-box", outline: "none" },
  inputFocus: { borderColor: "var(--primary-color)", boxShadow: "0 0 0 4px var(--primary-glow)" },
  btn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", transition: "var(--transition)", border: "none", background: "transparent", textDecoration: "none" },
  btnPrimary: { background: "var(--primary-color)", color: "#ffffff", boxShadow: "0 4px 14px 0 var(--primary-glow)", padding: "0 24px", height: "48px", borderRadius: "12px", fontWeight: 600, fontSize: "15px" },
  btnPrimaryHover: { transform: "translateY(-2px)", boxShadow: "0 6px 20px 0 var(--primary-glow)" },
  btnSecondary: { background: "var(--surface-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "0 24px", height: "48px", borderRadius: "12px", fontWeight: 500 },
  btnSecondaryHover: { borderColor: "var(--text-secondary)", color: "var(--text-primary)" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed", transform: "none", boxShadow: "none" },
  messageBox: { padding: "16px", borderRadius: "12px", marginBottom: "24px", fontSize: "15px", fontWeight: 500, display: "flex", alignItems: "center", gap: "12px", borderWidth: "1px", borderStyle: "solid" },
  errorBox: { background: "rgba(244, 63, 94, 0.1)", borderColor: "var(--danger-color)", color: "var(--danger-color)" },
  successBox: { background: "rgba(34, 197, 94, 0.1)", borderColor: "var(--success-color)", color: "var(--success-color)" },
  grid: { display: "grid", gap: "24px" },
  ipDisplay: { display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", flexWrap: "wrap" },
  ipText: { fontSize: "14px", color: "var(--text-secondary)" },
  geoDisplay: { display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", flexWrap: "wrap" },
  chips: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" },
  chipLabel: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "999px", border: "1px solid var(--border-color)", fontSize: "14px", cursor: "pointer", transition: "var(--transition)", userSelect: "none" },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

// --- Reusable Styled Helper Components ---
function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled
    ? { ...combinedBase, ...styles.btnDisabled }
    : hover
    ? { ...combinedBase, ...hoverStyle }
    : combinedBase;
  return (
    <button
      style={combinedStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </button>
  );
}
function StyledInput(props) {
  const [focus, setFocus] = useState(false);
  const s = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <input style={s} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function StyledSelect(props) {
  const [focus, setFocus] = useState(false);
  const s = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <select style={s} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function CheckChip({ label, icon, checked, onChange }) {
  const chipStyle = {
    ...styles.chipLabel,
    backgroundColor: checked ? "var(--primary-color)" : "var(--surface-color)",
    color: checked ? "#ffffff" : "var(--text-secondary)",
    borderColor: checked ? "var(--primary-color)" : "var(--border-color)",
  };
  return (
    <label style={chipStyle}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {icon} {label}
    </label>
  );
}

// --- Logic helpers ---
async function getPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data?.ip || "";
  } catch {
    return "";
  }
}
function toLocal(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toApi(localVal) {
  return localVal.length === 16 ? `${localVal}:00` : localVal;
}

export default function StartSessionPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const now = useMemo(() => new Date(), []);
  const plus60 = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000), [now]);

  // 🔸 class-first
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");

  const [form, setForm] = useState({
    subject: "",
    startTime: toLocal(now),
    endTime: toLocal(plus60),
    latitude: "",
    longitude: "",
    radiusMeters: 50,
    wifiPolicy: "PUBLIC_IP",   // valid back-end values: NONE | PUBLIC_IP | BOTH
    qrIntervalSeconds: 5,
  });
  const [flow, setFlow] = useState({ WIFI: true, GEO: true, FACE: true, QR: true });
  const [publicIp, setPublicIp] = useState("");
  const [geoMsg, setGeoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listClasses();
        if (!mounted) return;
        setClasses(Array.isArray(list) ? list : []);
        if (list?.length && !classId) setClassId(String(list[0].id));
      } catch (e) {
        setErr(e?.message || "Failed to load classes");
      }
      const ip = await getPublicIp();
      if (mounted) setPublicIp(ip);
    })();
    return () => { mounted = false; };
  }, []); // load once

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const setNumber = (name, value) => {
    setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
  };

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoMsg("Geolocation is not supported."); return; }
    setGeoMsg("Fetching location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setForm((f) => ({ ...f, latitude, longitude }));
        setGeoMsg(`Location set (±${Math.round(accuracy)}m)`);
      },
      (e) => setGeoMsg(`Location error: ${e.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const refreshIp = useCallback(async () => {
    const ip = await getPublicIp();
    setPublicIp(ip);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");

    if (!classId) { setErr("Please select a class."); return; }
    if (!form.subject) { setErr("Please enter subject."); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setErr("End time must be after start time.");
      return;
    }
    if (!["NONE", "PUBLIC_IP", "BOTH"].includes(form.wifiPolicy)) {
      setErr("Wi-Fi policy must be NONE, PUBLIC_IP or BOTH.");
      return;
    }

    try {
      setLoading(true);

      const config = {
        subject: form.subject.trim(),
        startTime: toApi(form.startTime),
        endTime: toApi(form.endTime),
        qrIntervalSeconds: Number(form.qrIntervalSeconds) || 5,
        wifiPolicy: form.wifiPolicy,
        publicIp: form.wifiPolicy === "NONE" ? null : (publicIp || null),
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        radiusMeters: form.radiusMeters === "" ? null : Number(form.radiusMeters),
        flow: ["WIFI", "GEO", "FACE", "QR"].filter((k) => flow[k]),
      };

      const session = await startSessionForClass(Number(classId), config);
      setOk("Session started successfully.");
      navigate(`/admin/active-session/${session.id}`, { replace: true });
    } catch (e2) {
      if (e2.status === 409) setErr(e2.message || "Conflict: overlapping session");
      else if (e2.status === 400) setErr(e2.message || "Validation error: missing/invalid fields");
      else setErr(e2.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "16px" : "0" },
    grid4: { ...styles.grid, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" },
    grid2: { ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" },
    grid3: { ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)" },
  };

  const selectedClass = classes.find((c) => String(c.id) === String(classId));

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Start a New Session</h1>
            <Link to="/admin" style={{ ...styles.btn, ...styles.btnSecondary }}>
              <FaArrowLeft /> Dashboard
            </Link>
          </header>

          <TeacherPasswordBar />

          {err && <p style={{ ...styles.messageBox, ...styles.errorBox }}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={{ ...styles.messageBox, ...styles.successBox }}><FaCheckCircle/> {ok}</p>}

          <form onSubmit={onSubmit}>
            {/* ---------- Class & Subject ---------- */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Class & Subject</h2>
              <div style={dynamicStyles.grid2}>
                <Field label="Class *">
                  <StyledSelect value={classId} onChange={(e) => setClassId(e.target.value)}>
                    {!classes.length && <option value="">No classes yet</option>}
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {`Y${c.year} ${c.department} • Sec ${c.section} • Block ${c.block} • ${c.name}`}
                      </option>
                    ))}
                  </StyledSelect>
                </Field>
                <Field label="Subject *">
                  <StyledInput
                    name="subject"
                    value={form.subject}
                    onChange={onChange}
                    placeholder="Database Systems"
                  />
                </Field>
              </div>

              <div style={{ ...dynamicStyles.grid2, marginTop: "24px" }}>
                <Field label="Start Time *">
                  <StyledInput type="datetime-local" name="startTime" value={form.startTime} onChange={onChange} />
                </Field>
                <Field label="End Time *">
                  <StyledInput type="datetime-local" name="endTime" value={form.endTime} onChange={onChange} />
                </Field>
              </div>

              <p style={styles.infoText}>
                {selectedClass
                  ? <>Selected: <b>{selectedClass.name}</b> — Year {selectedClass.year}, {selectedClass.department},
                     Section {selectedClass.section}, Block {selectedClass.block}</>
                  : "Choose a class to start a session for that roster."}
              </p>
            </div>

            {/* ---------- Validation Flow ---------- */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Validation Flow</h2>
              <p style={styles.infoText}>
                Select which checks students must pass to mark their attendance.
              </p>
              <div style={styles.chips}>
                <CheckChip label="WIFI" icon={<FaWifi/>} checked={flow.WIFI} onChange={(e)=>setFlow(f=>({ ...f, WIFI: e.target.checked }))} />
                <CheckChip label="GEO" icon={<FaGlobe/>} checked={flow.GEO} onChange={(e)=>setFlow(f=>({ ...f, GEO: e.target.checked }))} />
                <CheckChip label="FACE" icon={<FaSmile/>} checked={flow.FACE} onChange={(e)=>setFlow(f=>({ ...f, FACE: e.target.checked }))} />
                <CheckChip label="QR" icon={<FaQrcode/>} checked={flow.QR} onChange={(e)=>setFlow(f=>({ ...f, QR: e.target.checked }))} />
              </div>
            </div>

            {/* ---------- Wi-Fi & QR Policy ---------- */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Wi-Fi & QR Policy</h2>
              <div style={dynamicStyles.grid3}>
                <Field label="Wi-Fi Policy *">
                  <StyledSelect name="wifiPolicy" value={form.wifiPolicy} onChange={onChange}>
                    <option value="PUBLIC_IP">Public IP</option>
                    <option value="BOTH">Both (Public IP + QR)</option>
                    <option value="NONE">None</option>
                  </StyledSelect>
                </Field>
                <Field label="QR Interval (seconds)">
                  <StyledInput
                    type="number"
                    min="1"
                    name="qrIntervalSeconds"
                    value={form.qrIntervalSeconds}
                    onChange={(e)=>setNumber("qrIntervalSeconds", e.target.value)}
                  />
                </Field>
                <div />
              </div>
              <div style={styles.ipDisplay}>
                <span style={styles.ipText}>
                  Detected Public IP: <strong>{publicIp || "…"}</strong>
                </span>
                <StyleButton
                  type="button"
                  baseStyle={styles.btnSecondary}
                  hoverStyle={styles.btnSecondaryHover}
                  onClick={refreshIp}
                  style={{ height: "36px", padding: "0 16px" }}
                >
                  <FaSyncAlt/> Refresh
                </StyleButton>
              </div>
            </div>

            {/* ---------- Geofence ---------- */}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Geofence</h2>
              <div style={dynamicStyles.grid3}>
                <Field label="Latitude">
                  <StyledInput name="latitude" value={form.latitude} onChange={onChange} placeholder="e.g., 12.9716" />
                </Field>
                <Field label="Longitude">
                  <StyledInput name="longitude" value={form.longitude} onChange={onChange} placeholder="e.g., 77.5946" />
                </Field>
                <Field label="Radius (meters)">
                  <StyledInput
                    type="number"
                    min="1"
                    name="radiusMeters"
                    value={form.radiusMeters}
                    onChange={(e)=>setNumber("radiusMeters", e.target.value)}
                  />
                </Field>
              </div>
              <div style={styles.geoDisplay}>
                <StyleButton
                  type="button"
                  baseStyle={styles.btnSecondary}
                  hoverStyle={styles.btnSecondaryHover}
                  onClick={useCurrentLocation}
                >
                  <FaMapMarkerAlt/> Use Current Location
                </StyleButton>
                <span style={styles.ipText}>{geoMsg}</span>
              </div>
            </div>

            {/* ---------- Submit ---------- */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <StyleButton type="submit" baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : "Start Session"}
              </StyleButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
