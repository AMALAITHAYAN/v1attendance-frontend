import { useEffect, useMemo, useState, useCallback, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import TeacherPasswordBar from "./TeacherPasswordBar";
import {
  fetchTeacherSessions,
  fetchTeacherSessionSummary,
} from "../api/teacherReportApi";
  
// --- Icon Imports ---
import { 
  FaArrowLeft, FaSignOutAlt, FaExclamationTriangle, FaSpinner,
  FaChartBar, FaUsers, FaPercentage, FaChevronDown, FaChevronUp
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
  container: { width: '100%', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)', marginBottom: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent', textDecoration: 'none' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDanger: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 20px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnDangerHover: { borderColor: 'var(--danger-color)', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger-color)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '16px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', borderBottom: '1px solid var(--border-color)', padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  td: { padding: '16px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  summaryRow: { td: { padding: 0, borderBottom: '1px solid var(--border-color)' }, content: { padding: '24px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', gap: '24px' }, kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } },
  kpiCard: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', icon: { fontSize: '20px' }, content: {}, label: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }, value: { fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }},
  progressOuter: { height: '8px', background: 'var(--surface-color)', borderRadius: '999px', overflow: 'hidden' },
  progressInner: { height: '100%', backgroundImage: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', transition: 'width 0.5s ease-in-out' },
  noDataText: { color: 'var(--text-secondary)', padding: '48px', textAlign: 'center' },
  filters: { padding: '32px', display: 'grid', gap: '16px', alignItems: 'flex-end' },
  filterButtons: { display: 'flex', gap: '8px' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };

// --- Reusable Styled Helper Components ---
function Field({ label, children }) { return (<div style={styles.field}><label style={styles.fieldLabel}>{label}</label>{children}</div>); }
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  const Component = props.as || 'button';
  const componentProps = {...props};
  delete componentProps.as;
  return (<Component style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...componentProps}>{children}</Component>);
}
function StyledInput(props) {
  const [focus, setFocus] = useState(false);
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function KPI({ icon, label, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{...styles.kpiCard.icon, color }}>{icon}</div>
      <div style={styles.kpiCard.content}>
        <div style={styles.kpiCard.label}>{label}</div>
        <div style={styles.kpiCard.value}>{value}</div>
      </div>
    </div>
  );
}
function SessionSummaryRow({ data }) {
  if (!data) return <div style={{padding: '24px', color: 'var(--text-secondary)'}}>Loading summary…</div>;
  if (data.error) return <div style={{padding: '24px'}}><p style={{...styles.errorBox, margin: 0}}>{String(data.error)}</p></div>;
  
  const pct = data.percentage ?? 0;
  return (
    <div style={styles.summaryRow.content}>
        <div style={styles.summaryRow.kpiGrid}>
            <KPI icon={<FaUsers/>} label="Present" value={data.present ?? '...'} color={styles.theme['--primary-color']} />
            <KPI icon={<FaChartBar/>} label="Total Marks" value={data.total ?? '...'} color={styles.theme['--secondary-color']} />
            <KPI icon={<FaPercentage/>} label="Percentage" value={`${pct}%`} color={pct > 80 ? styles.theme['--success-color'] : styles.theme['--warn-color']} />
        </div>
        <div>
            <div style={styles.progressOuter} title={`${pct}%`}>
                <div style={{...styles.progressInner, width: `${pct}%`}} />
            </div>
        </div>
    </div>
  );
}

// --- Logic ---
function toLocal(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toApi(localVal) {
  return localVal.length === 16 ? `${localVal}:00` : localVal;
}
function fmt(isoLocal) {
  try {
    const d = new Date(isoLocal.replace(" ", "T"));
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return isoLocal; }
}

export default function TeacherReportsPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');

  const now = useMemo(() => new Date(), []);
  const fromDefault = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }, [now]);

  const [from, setFrom] = useState(toLocal(fromDefault));
  const [to, setTo] = useState(toLocal(now));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [openId, setOpenId] = useState(null);

  const quick = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFrom(toLocal(start));
    setTo(toLocal(end));
  };

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      if (new Date(from) > new Date(to)) throw new Error("From date must be before To date.");
      const list = await fetchTeacherSessions(toApi(from), toApi(to));
      setRows(list || []);
      setSummaries({});
      setOpenId(null);
    } catch (e) {
      setErr(e?.response?.data || e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const openSummary = async (id) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (summaries[id]) return;
    try {
      const s = await fetchTeacherSessionSummary(id);
      const pct = s.total ? Math.round((s.present * 10000) / s.total) / 100 : 0;
      setSummaries((m) => ({ ...m, [id]: { ...s, percentage: pct } }));
    } catch (e) {
      setSummaries((m) => ({ ...m, [id]: { error: e?.response?.data || e?.message || "Failed to load summary" }}));
    }
  };

  useEffect(() => { load(); }, [load]);

  const logout = useCallback(() => {
    localStorage.removeItem("attendance:user");
    localStorage.removeItem("attendance:lastRole");
    navigate("/login", { replace: true });
  }, [navigate]);
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    filters: { ...styles.filters, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto' }
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Teacher Reports</h1>
            <div style={styles.headerActions}>
              <StyleButton as={Link} to="/admin" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                <FaArrowLeft /> Dashboard
              </StyleButton>
              <StyleButton baseStyle={styles.btnDanger} hoverStyle={styles.btnDangerHover} onClick={logout}>
                <FaSignOutAlt /> Logout
              </StyleButton>
            </div>
          </header>

          <TeacherPasswordBar />

          <div style={styles.card}>
            <div style={dynamicStyles.filters}>
              <Field label="From"><StyledInput type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
              <Field label="To"><StyledInput type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
              <div style={styles.filterButtons}>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => quick(7)}>7d</StyleButton>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => quick(30)}>30d</StyleButton>
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={load} disabled={loading}>{loading ? <FaSpinner className="spinner"/> : "Load"}</StyleButton>
              </div>
            </div>
            {err && <p style={{...styles.errorBox, margin: '0 32px 32px'}}><FaExclamationTriangle/> {String(err)}</p>}
          </div>

          <div style={{...styles.card, padding: 0}}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Start</th>
                    <th style={styles.th}>End</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={5}><p style={styles.noDataText}>No sessions found in this date range.</p></td></tr>
                  )}
                  {rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr>
                        <td style={styles.td}>{r.subject}</td>
                        <td style={styles.td}>{r.className}</td>
                        <td style={styles.td}>{fmt(r.startTime)}</td>
                        <td style={styles.td}>{fmt(r.endTime)}</td>
                        <td style={styles.td}>
                          <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => openSummary(r.id)} style={{height: '40px', padding: '0 16px'}}>
                            {openId === r.id ? <FaChevronUp/> : <FaChevronDown/>}
                            {openId === r.id ? "Hide" : "Summary"}
                          </StyleButton>
                        </td>
                      </tr>
                      {openId === r.id && (
                        <tr>
                          <td style={styles.summaryRow.td} colSpan={5}>
                            <SessionSummaryRow data={summaries[r.id]} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}