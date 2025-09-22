import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminUser } from "../utils/saAuth";
import { registerFaceForStudent } from "../api/faceApi";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaUserPlus, FaCopy
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
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  pre: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "monospace", background: '#101014', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', fontSize: '13px', maxHeight: '400px', overflow: 'auto' },
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

export default function FaceRegisterPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const admin = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => { if (!admin) navigate("/login", { replace: true }); }, [admin, navigate]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [ok, setOk] = useState("");

  const onRegister = async () => {
    setErr(""); setResult(null); setOk("");
    try {
      setLoading(true);
      const data = await registerFaceForStudent(id);
      setResult(data);
      setOk("Face registration triggered successfully.");
    } catch (e) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
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
            <h1 style={styles.title}>Face Registration</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
              </StyleButton>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin")}>
                Dashboard
              </StyleButton>
            </div>
          </header>

          <AdminPasswordBar />
          
          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={styles.successBox}><FaCheckCircle/> {ok}</p>}

          <div style={styles.card}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Student ID</div>
              <div style={{ fontWeight: 700, fontSize: '24px', fontFamily: 'monospace' }}>{id}</div>
            </div>

            <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={onRegister} disabled={loading}>
                {loading ? <FaSpinner className="spinner"/> : <><FaUserPlus /> Register Face</>}
              </StyleButton>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                This uses the student's stored photo on the server to build face embeddings.
              </span>
            </div>
          </div>

          {result && (
            <div style={{...styles.card, marginTop: '24px', padding: '32px'}}>
              <h2 style={{margin: '0 0 16px 0', fontSize: '20px'}}>API Result</h2>
              <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
              <div style={{marginTop: '24px'}}>
                <StyleButton
                  baseStyle={styles.btnSecondary}
                  hoverStyle={styles.btnSecondaryHover}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                      setOk("Result copied to clipboard.");
                      setTimeout(() => setOk(""), 2000);
                    } catch {}
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