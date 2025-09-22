import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { fetchStudentSummary } from "../api/reportApi";
import { getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaSpinner, FaFileCsv, FaSyncAlt, FaUserPlus,
  FaChartBar, FaUsers, FaPercentage
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
  btnSecondary: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' },
  kpiCard: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', icon: { fontSize: '24px' }, content: { flexGrow: 1 }, label: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }, value: { fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }},
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', borderBottom: '1px solid var(--border-color)', padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  td: { padding: '16px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  tdNum: { textAlign: 'right' },
  noDataText: { color: 'var(--text-secondary)', padding: '48px', textAlign: 'center' },
  filters: { padding: '32px', display: 'grid', gap: '16px', alignItems: 'flex-end', gridTemplateColumns: '1fr 1fr 1fr' },
  filterButtons: { display: 'flex', gap: '8px', marginTop: '8px' },
  progressOuter: { height: '8px', background: 'var(--bg-color)', borderRadius: '999px', overflow: 'hidden' },
  progressInner: { height: '100%', backgroundImage: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', transition: 'width 0.5s ease-in-out' },
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

// --- Logic ---
function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear(), m = pad(d.getMonth()+1), day = pad(d.getDate());
  const h = pad(d.getHours()), min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
function toApiISO(localVal) {
  return localVal.length === 16 ? `${localVal}:00` : localVal;
}

export default function ReportsStudentSummaryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 900px)');
  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1, 0, 0), [now]);

  const [studentId, setStudentId] = useState(id || "");
  const [from, setFrom] = useState(toLocalInputValue(monthStart));
  const [to, setTo] = useState(toLocalInputValue(now));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);

  const load = async () => {
    if (!studentId) { setErr("Student ID is required"); return; }
    if (new Date(from) > new Date(to)) { setErr("From date must be before To date."); return; }
    try {
      setErr(""); setLoading(true);
      const fromISO = toApiISO(from);
      const toISO = toApiISO(to);
      const data = await fetchStudentSummary(studentId, fromISO, toISO);
      setSummary(data);
    } catch (e) {
      setErr(e.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (id) setStudentId(id); }, [id]);
  
  const quick = (days) => {
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    setFrom(toLocalInputValue(start)); setTo(toLocalInputValue(end));
  };
  
  const exportCSV = () => {
    if (!summary) return;
    const rows = [
      ["present", summary.present],
      ["total", summary.total],
      ["percentage", summary.percentage],
      [],
      ["Subject","Present","Total","Percentage"],
      ...(summary.bySubject || []).map(s => [s.subject, s.present, s.total, s.percentage]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `student-${studentId}-summary-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const faceRegisterPath = `/superadmin/students/${studentId || id}/face-register`;
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    filters: { ...styles.filters, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Student Summary Report</h1>
            <div style={styles.headerActions}>
              <StyleButton as={Link} to="/superadmin" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}><FaArrowLeft /> Dashboard</StyleButton>
              <StyleButton as={Link} to={faceRegisterPath} baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} disabled={!(studentId || id)}><FaUserPlus /> Register Face</StyleButton>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={exportCSV} disabled={!summary}><FaFileCsv /> Export CSV</StyleButton>
            </div>
          </header>

          <AdminPasswordBar />

          <div style={styles.card}>
            <div style={dynamicStyles.filters}>
              <Field label="Student ID *"><StyledInput value={studentId} onChange={(e) => setStudentId(e.target.value.replace(/\D/g,''))} placeholder="e.g. 101" /></Field>
              <Field label="From Date"><StyledInput type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
              <Field label="To Date"><StyledInput type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            </div>
             <div style={{ ...styles.filterButtons, padding: '0 32px 32px' }}>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => quick(7)}>Last 7d</StyleButton>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => quick(30)}>Last 30d</StyleButton>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => { setFrom(toLocalInputValue(monthStart)); setTo(toLocalInputValue(now)); }}>This Month</StyleButton>
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={load} disabled={loading} style={{marginLeft: 'auto'}}>{loading ? <FaSpinner className="spinner"/> : <><FaSyncAlt/> Load</>}</StyleButton>
            </div>
          </div>
          
          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}

          {loading && !summary && (
              <div style={{...styles.card, textAlign: 'center', padding: '64px'}}>
                  <FaSpinner className="spinner"/>
                  <p style={{marginTop: '16px', color: 'var(--text-secondary)'}}>Loading summary...</p>
              </div>
          )}

          {summary && !loading && (
            <>
              <div style={styles.kpiGrid}>
                <KPI icon={<FaChartBar/>} label="Present" value={summary.present} color={styles.theme['--primary-color']} />
                <KPI icon={<FaUsers/>} label="Total Sessions" value={summary.total} color={styles.theme['--secondary-color']} />
                <KPI icon={<FaPercentage/>} label="Percentage" value={`${summary.percentage}%`} color={summary.percentage > 80 ? styles.theme['--success-color'] : styles.theme['--warn-color']} />
              </div>

              <div style={{...styles.card, padding: 0}}>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Subject</th>
                        <th style={{...styles.th, ...styles.tdNum}}>Present</th>
                        <th style={{...styles.th, ...styles.tdNum}}>Total</th>
                        <th style={{...styles.th, ...styles.tdNum}}>%</th>
                        <th style={{...styles.th, minWidth: '200px'}}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.bySubject || []).length > 0 ? summary.bySubject.map((s) => (
                        <tr key={s.subject}>
                          <td style={styles.td}>{s.subject}</td>
                          <td style={{...styles.td, ...styles.tdNum}}>{s.present}</td>
                          <td style={{...styles.td, ...styles.tdNum}}>{s.total}</td>
                          <td style={{...styles.td, ...styles.tdNum}}>{s.percentage}%</td>
                          <td style={styles.td}>
                            <div style={styles.progressOuter}><div style={{ ...styles.progressInner, width: `${s.percentage}%` }} /></div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5}><p style={styles.noDataText}>No subject data found for this student in the selected range.</p></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}