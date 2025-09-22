import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActiveSessions } from "../api/reportApi";
import { getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaFileCsv, FaSyncAlt
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
    '--success-color': '#22c55e',
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0',
    '--radius': '16px', '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)', overflow: 'hidden' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', margin: '24px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', borderBottom: '1px solid var(--border-color)', padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  td: { padding: '16px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  noDataText: { color: 'var(--text-secondary)', padding: '48px', textAlign: 'center' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

// --- Reusable Styled Helper Components ---
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}

// --- Logic ---
function fmtDT(s) {
  if (!s) return "";
  try {
    const d = new Date(s.replace(" ", "T"));
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return s;
  }
}

export default function ReportsActiveSessionsPage() {
  const navigate = useNavigate();
  const user = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 768px)');
  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      setErr(""); setInfo("");
      setLoading(true);
      const data = await fetchActiveSessions();
      setRows(Array.isArray(data) ? data : []);
      setInfo(`Loaded ${Array.isArray(data) ? data.length : 0} active session(s)`);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const header = ["ID","Subject","Class","StartTime","EndTime","TeacherName"];
    const body = rows.map(r => [r.id, r.subject, r.className, r.startTime, r.endTime ?? "", r.teacherName]);
    const csv = [header, ...body].map(a => a.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `active-sessions-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
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
            <h1 style={styles.title}>Active Sessions Report</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin")}>
                <FaArrowLeft /> Dashboard
              </StyleButton>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={exportCSV} disabled={!rows.length}>
                <FaFileCsv /> Export CSV
              </StyleButton>
              <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={load} disabled={loading}>
                {loading ? <FaSpinner className="spinner"/> : <><FaSyncAlt/> Refresh</>}
              </StyleButton>
            </div>
          </header>

          <AdminPasswordBar />

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {info && <p style={styles.successBox}><FaCheckCircle/> {info}</p>}

          <div style={styles.card}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Teacher</th>
                    <th style={styles.th}>Start Time</th>
                    <th style={styles.th}>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}><p style={styles.noDataText}><FaSpinner className="spinner"/> Loading...</p></td></tr>
                  ) : rows.length ? rows.map(s => (
                    <tr key={s.id}>
                      <td style={styles.td}>{s.subject}</td>
                      <td style={styles.td}>{s.className}</td>
                      <td style={styles.td}>{s.teacherName}</td>
                      <td style={styles.td}>{fmtDT(s.startTime)}</td>
                      <td style={styles.td}>{s.endTime ? fmtDT(s.endTime) : "—"}</td>
                    </tr>
                  )) : (
                    <tr><td style={styles.td} colSpan={5}><p style={styles.noDataText}>No active sessions found.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}