import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { registerStudentFace } from "../api/faceAdminApi";
import { getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaUserPlus, FaCopy, FaBroom
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
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '32px', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)', marginBottom: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  buttonGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  messageBox: { padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'flex-end' },
  hint: { marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' },
  pre: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "monospace", background: '#101014', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', fontSize: '13px', maxHeight: '400px', overflow: 'auto' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

// --- Reusable Styled Helper Components ---
function Field({ label, children }) { return (<div style={styles.field}><label style={styles.fieldLabel}>{label}</label>{children}</div>); }
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}
function StyledInput(props) {
  const [focus, setFocus] = useState(false);
  const readOnlyStyle = props.readOnly ? styles.inputReadonly : {};
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus, ...readOnlyStyle } : { ...styles.input, ...readOnlyStyle };
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}


export default function FaceRegisterPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const user = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  const [studentId, setStudentId] = useState(paramId || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [resBody, setResBody] = useState(null);

  useEffect(() => { if (paramId) setStudentId(paramId); }, [paramId]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    setErr(""); setOk(""); setResBody(null);
    const idNum = Number(String(studentId).trim());
    if (!idNum) { setErr("Student ID is required"); return; }
    try {
      setLoading(true);
      const data = await registerStudentFace(idNum);
      setResBody(data);
      setOk("Face registration triggered successfully.");
    } catch (e2) {
      setErr(e2?.message || "Failed to register face");
    } finally {
      setLoading(false);
    }
  }

  const prettyJson = useMemo(() => {
    try {
      return resBody ? JSON.stringify(resBody, null, 2) : "";
    } catch {
      return String(resBody ?? "");
    }
  }, [resBody]);

  const canSubmit = Boolean(String(studentId).trim()) && !loading;
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    grid: { ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? '16px' : '24px' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Register Student Face</h1>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </StyleButton>
          </header>

          <AdminPasswordBar />

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={styles.successBox}><FaCheckCircle/> {ok}</p>}

          <form onSubmit={onSubmit} style={styles.card}>
            <div style={dynamicStyles.grid}>
              <div>
                <Field label="Student ID">
                  <StyledInput
                    inputMode="numeric"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g., 101"
                  />
                </Field>
                <div style={styles.hint}>
                  This triggers the backend to build face embeddings from the student's stored photo.
                </div>
              </div>
              <div style={styles.buttonGroup}>
                <StyleButton type="submit" baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} disabled={!canSubmit}>
                  {loading ? <FaSpinner className="spinner" /> : <><FaUserPlus /> Register Face</>}
                </StyleButton>
                <StyleButton
                  type="button"
                  baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}
                  onClick={() => { setStudentId(""); setErr(""); setOk(""); setResBody(null); }}
                  disabled={loading}
                >
                  <FaBroom/> Clear
                </StyleButton>
              </div>
            </div>
          </form>

          {resBody && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>API Result</h2>
              <pre style={styles.pre}>{prettyJson}</pre>
              <div style={{...styles.buttonGroup, justifyContent: 'flex-start', marginTop: '24px'}}>
                <StyleButton
                  baseStyle={styles.btnSecondary}
                  hoverStyle={styles.btnSecondaryHover}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(prettyJson);
                      setOk("Result copied to clipboard.");
                      setTimeout(() => setOk(""), 2000);
                    } catch { /* ignore */ }
                  }}
                >
                  <FaCopy /> Copy JSON
                </StyleButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}