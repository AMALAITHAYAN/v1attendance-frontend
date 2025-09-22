import { useEffect, useMemo, useRef, useState, useCallback } from "react"; // FIXED: Added useCallback
import { useNavigate } from "react-router-dom";
import { createLiveClient } from "../api/liveSseClient";
import { getAdminPassword, getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaSpinner, FaPlay, FaStop, FaBroom, FaDownload
} from 'react-icons/fa';

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
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

// --- STYLES OBJECT ---
const styles = {
  // --- Design System: "Celestial Slate" ---
  theme: {
    '--font-family': "'Inter', sans-serif",
    '--bg-color': '#101014', '--surface-color': '#1a1a21',
    '--border-color': 'rgba(255, 255, 255, 0.1)', '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    '--primary-color': '#6366f1', '--secondary-color': '#2dd4bf',
    '--primary-glow': 'rgba(99, 102, 241, 0.3)', '--danger-color': '#f43f5e',
    '--success-color': '#22c55e', '--warn-color': '#f59e0b',
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0',
    '--radius': '16px', '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: '24px', flexWrap: 'wrap' },
  statusBar: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusText: { fontWeight: 600, fontSize: '15px', textTransform: 'capitalize' },
  retryText: { fontSize: '13px', color: 'var(--text-secondary)' },
  logContainer: { padding: 0, maxHeight: '65vh', overflowY: 'auto' },
  logList: { listStyle: 'none', margin: 0, padding: 0 },
  logItem: { display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-color)'},
  logContent: { flex: 1 },
  logMessage: { fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' },
  logTime: { fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' },
  pill: { display: 'inline-block', minWidth: '80px', textAlign: 'center', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px' },
  noEvents: { padding: '48px', color: 'var(--text-secondary)', textAlign: 'center' },
  note: { marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };

// --- Reusable Styled Helper Components ---
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}
function StatusDot({ status }) {
  const color =
    status === "connected" ? 'var(--success-color)' :
    status === "connecting" ? 'var(--warn-color)' :
    status === "reconnecting" ? 'var(--primary-color)' :
    'var(--danger-color)';
  const dotStyle = { width: '12px', height: '12px', backgroundColor: color, borderRadius: '50%', display: 'inline-block' };
  return <span style={dotStyle} />;
}
function EventPill({ type }) {
  const labelFor = (t) => {
    if (t === "session-started") return "Started";
    if (t === "session-stopped") return "Stopped";
    return t || "Message";
  };
  const pillStyle = {
    ...styles.pill,
    background: type === "session-started" ? 'rgba(34, 197, 94, 0.1)' :
               type === "session-stopped" ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-color)',
    color: type === "session-started" ? 'var(--success-color)' :
           type === "session-stopped" ? 'var(--danger-color)' : 'var(--text-secondary)',
    border: `1px solid ${
        type === "session-started" ? 'var(--success-color)' :
        type === "session-stopped" ? 'var(--danger-color)' :
        'var(--border-color)'
    }`
  };
  return <span style={pillStyle}>{labelFor(type)}</span>;
}


export default function LiveSessionsPage() {
  const navigate = useNavigate();
  const admin = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => { if (!admin) navigate("/login", { replace: true }); }, [admin, navigate]);

  const [status, setStatus] = useState("disconnected");
  const [attempts, setAttempts] = useState(0);
  const [err, setErr] = useState("");
  const [events, setEvents] = useState([]);
  const pw = getAdminPassword();
  const clientRef = useRef(null);

  const canConnect = useMemo(() => !!(admin?.username && pw), [admin, pw]);

  const handleConnect = useCallback(() => {
    if (!canConnect) { setErr("Enter admin password to connect."); return; }
    setErr("");
    setStatus(attempts === 0 ? "connecting" : "reconnecting");

    const c = createLiveClient({
      adminUsername: admin.username, adminPassword: pw,
      onOpen: ({ attempts: a }) => { setAttempts(a); setStatus("connected"); },
      onMessage: ({ id, event, data, raw }) => {
        const msg = typeof data === "object" && data?.message ? data.message : raw;
        const item = { id: id || `${Date.now()}`, type: event || "message", message: msg, time: new Date().toLocaleString() };
        setEvents((prev) => [item, ...prev].slice(0, 500));
      },
      onError: (e) => { setErr((e && e.message) || "Stream error"); },
      onClose: () => { if (status !== "disconnected") { setStatus("reconnecting"); }},
    });

    clientRef.current = c;
    c.connect();
  }, [canConnect, admin, pw, attempts, status]);

  useEffect(() => {
    if (canConnect && status === "disconnected") {
      handleConnect();
    }
  }, [canConnect, status, handleConnect]);

  const handleDisconnect = () => {
    clientRef.current?.close();
    clientRef.current = null;
    setStatus("disconnected");
  };

  const handleSnapshot = () => {
    const snap = {
      takenAt: new Date().toISOString(),
      count: events.length,
      events: events.slice().reverse(), // chronological
    };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `live-sessions-snapshot-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Live Sessions</h1>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin")}>
              <FaArrowLeft /> Dashboard
            </StyleButton>
          </header>

          <AdminPasswordBar />

          <div style={styles.controlBar}>
            <div style={styles.statusBar}>
              <StatusDot status={status} />
              <div style={styles.statusText}>{status}</div>
              {attempts > 0 && status !== 'disconnected' && <span style={styles.retryText}>(retry #{attempts})</span>}
            </div>
            <div style={{ display: "flex", gap: '12px', flexWrap: 'wrap' }}>
              {status === "connected" ? (
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={handleDisconnect}><FaStop/> Disconnect</StyleButton>
              ) : (
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={handleConnect} disabled={!canConnect || status === 'connecting'}>
                  {status === 'connecting' ? <FaSpinner className="spinner"/> : <FaPlay/>}
                  {attempts === 0 ? "Connect" : "Reconnect"}
                </StyleButton>
              )}
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => setEvents([])}><FaBroom/> Clear</StyleButton>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={handleSnapshot} disabled={events.length === 0}><FaDownload/> Snapshot</StyleButton>
            </div>
          </div>

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}

          <div style={styles.card}>
            <div style={styles.logContainer}>
              {events.length === 0 ? (
                <div style={styles.noEvents}>
                  {status === "connected" ? "Waiting for events…" : "Not connected to the live stream."}
                </div>
              ) : (
                <ul style={styles.logList}>
                  {events.map((e, index) => (
                    <li key={e.id} style={{...styles.logItem, borderBottom: index === events.length - 1 ? 'none' : '1px solid var(--border-color)'}}>
                      <EventPill type={e.type} />
                      <div style={styles.logContent}>
                        <div style={styles.logMessage}>{e.message}</div>
                        <div style={styles.logTime}>{e.time}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p style={styles.note}>Note: The stream attempts to reconnect automatically with exponential backoff.</p>
        </div>
      </div>
    </>
  );
}