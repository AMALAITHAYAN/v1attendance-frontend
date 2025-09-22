import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePasswordApi } from "../api/authApi";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner
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
    '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '32px', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  inputReadonly: { cursor: 'not-allowed', color: 'var(--text-secondary)', background: '#2a2a33' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  buttonGroup: { marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  messageBox: { padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  toggleContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', userSelect: 'none' },
  toggleSwitch: { position: 'relative', display: 'inline-block', width: '40px', height: '24px' },
  toggleSlider: { position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#374151', transition: 'var(--transition)', borderRadius: '34px', before: { position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', transition: 'var(--transition)', borderRadius: '50%' }},
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
function ToggleSwitch({ checked, onChange, label }) {
    const sliderStyle = {
        ...styles.toggleSlider,
        backgroundColor: checked ? 'var(--primary-color)' : '#374151',
    };
    const knobStyle = {
        ...styles.toggleSlider.before,
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
    };
    return (
        <label style={styles.toggleContainer}>
            <div style={styles.toggleSwitch}>
                <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={sliderStyle}><span style={knobStyle}></span></span>
            </div>
            {label}
        </label>
    );
}

// --- Logic Functions (defined once) ---
function getActiveRole() {
  if (localStorage.getItem("attendance:adminUser") && localStorage.getItem("attendance:adminPass")) { return "SUPER_ADMIN"; }
  if (localStorage.getItem("attendance:user") && localStorage.getItem("attendance:teacherPass")) { return "TEACHER"; }
  if (localStorage.getItem("attendance:studentUser") && localStorage.getItem("attendance:studentPass")) { return "STUDENT"; }
  return null;
}
function currentUsernameForRole(role) {
  switch (role) {
    case "SUPER_ADMIN": return localStorage.getItem("attendance:adminUser") || "";
    case "TEACHER":     
      try {
        const user = JSON.parse(localStorage.getItem("attendance:user"));
        return user.username || "";
      } catch { return "" }
    case "STUDENT":     return localStorage.getItem("attendance:studentUser") || "";
    default:            return "";
  }
}
function setNewPasswordLocally(role, newPass) {
  switch (role) {
    case "SUPER_ADMIN": localStorage.setItem("attendance:adminPass", newPass); break;
    case "TEACHER":     localStorage.setItem("attendance:teacherPass", newPass); break;
    case "STUDENT":     localStorage.setItem("attendance:studentPass", newPass); break;
    default: break;
  }
}

export default function ChangePasswordPage() {
  const nav = useNavigate();
  const role = useMemo(getActiveRole, []);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => { if (!role) nav("/login", { replace: true }); }, [role, nav]);

  const [username] = useState(currentUsernameForRole(role));
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setOk("");
    if (!username || !oldPassword || !newPassword || !confirm) {
      setErr("Please fill all fields."); return;
    }
    if (newPassword.length < 4) {
      setErr("New password must be at least 4 characters."); return;
    }
    if (newPassword !== confirm) {
      setErr("Passwords do not match."); return;
    }

    try {
      setLoading(true);
      await changePasswordApi({ username, oldPassword, newPassword });
      setNewPasswordLocally(role, newPassword);
      setOk("Password changed. You will use the new password next time.");
      setOldPassword(""); setNewPassword(""); setConfirm("");
    } catch (e) {
      setErr(e?.message || "Change password failed");
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = {
    grid: { ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.title}>Change Password</h1>
            <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => nav(-1)}>
              <FaArrowLeft /> Back
            </StyleButton>
          </header>

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={styles.successBox}><FaCheckCircle/> {ok}</p>}

          <div style={styles.card}>
            <Field label="Username">
              <StyledInput value={username} readOnly />
            </Field>

            <div style={dynamicStyles.grid}>
              <Field label="Current Password">
                <StyledInput
                  type={show ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e)=>setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </Field>
              <Field label="New Password">
                <StyledInput
                  type={show ? "text" : "password"}
                  value={newPassword}
                  onChange={(e)=>setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </Field>
            </div>
            
            <Field label="Confirm New Password">
              <StyledInput
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e)=>setConfirm(e.target.value)}
                placeholder="Confirm new password"
              />
            </Field>

            <ToggleSwitch
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
                label="Show passwords"
            />
            
            <div style={styles.buttonGroup}>
              <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={submit} disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : "Change Password"}
              </StyleButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}