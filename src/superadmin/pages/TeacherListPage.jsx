import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listTeachers, deleteTeacher } from "../api/adminApi";
import { getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaPlus, FaSearch, FaEdit, FaTrash
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
  btnSmall: { padding: '0 12px', height: '36px', fontSize: '14px' },
  btnSmallDanger: { borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  btnSmallDangerHover: { background: 'rgba(244, 63, 94, 0.1)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', margin: '24px 0', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  toolbar: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  searchInput: { flexGrow: 1, position: 'relative' },
  searchIcon: { position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-secondary)' },
  input: { width: '100%', height: '48px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px 0 48px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', borderBottom: '1px solid var(--border-color)', padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  td: { padding: '16px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  noDataText: { color: 'var(--text-secondary)', padding: '48px', textAlign: 'center' },
  pager: { display: "flex", justifyContent: "center", alignItems: "center", gap: '16px', marginTop: '24px', color: 'var(--text-secondary)' },
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
function StyledInput(props) {
  const [focus, setFocus] = useState(false);
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}


export default function TeacherListPage() {
  const navigate = useNavigate();
  const user = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 768px)');
  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async (p = page, query = q) => {
    try {
      setLoading(true);
      const res = await listTeachers({ page: p, size, q: query });
      setData(res);
      setPage(res.number || 0);
    } catch (e) {
      setErr(e.message || "Failed to load teachers");
    } finally { setLoading(false); }
  }, [page, q, size]);

  useEffect(() => { load(0, ""); }, []); // Removed load from dependency array as it causes re-triggering issues

  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) return;
    try {
      await deleteTeacher(id);
      setInfo("Teacher deleted successfully.");
      load(page, q); // Reload current page
      setTimeout(() => setInfo(""), 3000);
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
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
            <h1 style={styles.title}>Teachers</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin")}>
                <FaArrowLeft /> Dashboard
              </StyleButton>
              <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={() => navigate("/superadmin/teachers/new")}>
                <FaPlus /> Create Teacher
              </StyleButton>
            </div>
          </header>

          <AdminPasswordBar />

          <div style={styles.toolbar}>
            <div style={styles.searchInput}>
                <span style={styles.searchIcon}><FaSearch/></span>
                <StyledInput
                    placeholder="Search by name or email..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load(0, q)}
                />
            </div>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => load(0, q)} disabled={loading}>
              Search
            </StyleButton>
          </div>

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {info && <p style={styles.successBox}><FaCheckCircle/> {info}</p>}

          <div style={styles.card}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Gmail</th>
                    <th style={styles.th}>Subjects</th>
                    <th style={{ ...styles.th, width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data.content?.length ? (
                     <tr><td colSpan={4}><p style={styles.noDataText}><FaSpinner className="spinner"/> Loading...</p></td></tr>
                  ) : data.content?.length ? data.content.map((t) => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.name}</td>
                      <td style={styles.td}>{t.gmailId}</td>
                      <td style={styles.td}>{Array.isArray(t.subjects) ? t.subjects.join(", ") : ""}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <StyleButton baseStyle={{...styles.btnSecondary, ...styles.btnSmall}} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate(`/superadmin/teachers/${t.id}`)}><FaEdit/></StyleButton>
                          <StyleButton baseStyle={{...styles.btnSecondary, ...styles.btnSmall, ...styles.btnSmallDanger}} hoverStyle={styles.btnDangerHover} onClick={() => onDelete(t.id)}><FaTrash/></StyleButton>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td style={styles.td} colSpan={4}><p style={styles.noDataText}>No teachers found.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.pager}>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} disabled={page <= 0 || loading} onClick={() => load(page - 1, q)}>Prev</StyleButton>
            <span>Page {page + 1} / {Math.max(1, data.totalPages || 1)}</span>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} disabled={page + 1 >= (data.totalPages || 1) || loading} onClick={() => load(page + 1, q)}>Next</StyleButton>
          </div>
        </div>
      </div>
    </>
  );
}