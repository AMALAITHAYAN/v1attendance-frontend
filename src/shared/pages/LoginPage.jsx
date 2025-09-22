import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../api/authApi";

// --- Icon Imports ---
import { 
  FaSignInAlt, FaUserShield, FaKey, FaEye, FaEyeSlash, 
  FaExclamationTriangle, FaSpinner 
} from 'react-icons/fa';

// --- Helper component to inject global styles (animations) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
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
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0',
    '--text-placeholder': '#6c7693', '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // FIXED: Changed 'background' to 'backgroundColor' to resolve console warning
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  
  card: { 
    width: '100%', maxWidth: '440px',
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)', 
    boxShadow: '0 8px 32px 0 var(--shadow-color)',
    position: 'relative', zIndex: 1,
  },
  headerSection: { textAlign: 'center', marginBottom: '40px' },
  iconContainer: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '64px', height: '64px',
    backgroundColor: 'var(--primary-color)',
    boxShadow: '0 0 20px 0 var(--primary-glow)',
    borderRadius: '16px', marginBottom: '24px',
  },
  title: { margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  subtitle: { margin: 0, fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 400 },
  field: { marginBottom: '24px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' },
  inputContainer: { position: 'relative' },
  inputIcon: { position: 'absolute', top: '50%', left: '18px', transform: 'translateY(-50%)', zIndex: 2, lineHeight: 0 },
  input: { width: '100%', height: '52px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '16px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  inputReadonly: { cursor: 'not-allowed', color: 'var(--text-secondary)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  toggleBtn: {
    position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)',
    height: '36px', width: '36px', borderRadius: '8px', color: 'var(--text-placeholder)',
  },
  toggleBtnHover: { color: 'var(--text-primary)', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  submitBtn: {
    width: '100%', height: '52px', borderRadius: '12px',
    backgroundColor: 'var(--primary-color)', color: '#ffffff',
    fontWeight: 600, fontSize: '16px',
    boxShadow: '0 4px 14px 0 var(--primary-glow)',
  },
  submitBtnHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  buttonGroup: { marginTop: '32px' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };


// --- Reusable Styled Helper Components ---
function Field({ label, children }) { return (<div style={styles.field}><label style={styles.fieldLabel}>{label}</label>{children}</div>); }
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}
function StyledInput({ icon, actionButton, ...props }) {
    const [focus, setFocus] = useState(false);
    const readOnlyStyle = props.readOnly ? styles.inputReadonly : {};
    const hasIcon = Boolean(icon);
    const inputStyleWithIcon = hasIcon ? {...styles.input, paddingLeft: '52px'} : styles.input;
    const combinedStyle = focus ? { ...inputStyleWithIcon, ...styles.inputFocus, ...readOnlyStyle } : { ...inputStyleWithIcon, ...readOnlyStyle };

    return (
        <div style={styles.inputContainer}>
            {hasIcon && <span style={styles.inputIcon}>{icon}</span>}
            <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />
            {actionButton}
        </div>
    );
}


/* --- route by role --- */
const roleToRoute = (role) => {
  switch ((role || "").toUpperCase()) {
    case "SUPER_ADMIN": return "/superadmin";
    case "TEACHER": return "/admin";
    case "STUDENT": return "/student";
    default: return "/login";
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromRef = useRef(location.state?.from || null);
  const isMobile = useMediaQuery('(max-width: 480px)');

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const persistRoleKeys = (role, username, password) => {
    const u = (username || "").trim().toLowerCase();
    try {
      const raw = localStorage.getItem("attendance:user");
      if (raw && !raw.trim().startsWith("{")) {
        localStorage.removeItem("attendance:user");
      }
    } catch {}

    switch ((role || "").toUpperCase()) {
      case "TEACHER":
      case "SUPER_ADMIN":
        localStorage.setItem("attendance:user", JSON.stringify({ username: u, role: "TEACHER" }));
        localStorage.setItem("attendance:teacherPass", password);
        if (role === "SUPER_ADMIN") {
            localStorage.setItem("attendance:adminUser", u);
            localStorage.setItem("attendance:adminPass", password);
        }
        break;
      case "STUDENT":
        localStorage.setItem("attendance:studentUser", u);
        localStorage.setItem("attendance:studentPass", password);
        break;
      default:
        throw new Error("Unknown role from server");
    }
    localStorage.setItem("attendance:lastRole", (role || "").toUpperCase());
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { username, password } = form;
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    try {
      setLoading(true);
      const res = await login({ username: username.trim(), password });
      const role = res?.role;
      if (!role) throw new Error(res?.message || "Login response missing role");
      persistRoleKeys(role, username, password);
      const dest = fromRef.current || roleToRoute(role);
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err?.response?.status === 401 ? "Invalid credentials" : err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  
  const dynamicStyles = {
      card: {...styles.card, padding: isMobile ? '32px 24px' : '48px'}
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={dynamicStyles.card}>
          <div style={styles.headerSection}>
            <div style={styles.iconContainer}>
              <FaSignInAlt size={28} color="#fff" />
            </div>
            <h1 style={styles.title}>AttendEase</h1>
            <p style={styles.subtitle}>Authentication Required</p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <Field label="Email Address">
              <StyledInput
                name="username" type="email" placeholder="you@school.edu"
                value={form.username} onChange={onChange} autoComplete="username"
                icon={<FaUserShield color={styles.theme['--text-placeholder']} />}
                required
              />
            </Field>

            <Field label="Password">
              <StyledInput
                name="password" type={showPassword ? "text" : "password"}
                placeholder="••••••••••••" value={form.password} onChange={onChange}
                autoComplete="current-password"
                icon={<FaKey color={styles.theme['--text-placeholder']} />}
                actionButton={
                    <StyleButton 
                        baseStyle={styles.toggleBtn} 
                        hoverStyle={styles.toggleBtnHover}
                        onClick={() => setShowPassword(s => !s)}
                        type="button"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </StyleButton>
                }
                required
              />
            </Field>

            {error && (
              <p style={styles.errorBox}>
                <FaExclamationTriangle/> {error}
              </p>
            )}

            <div style={styles.buttonGroup}>
                <StyleButton baseStyle={styles.submitBtn} hoverStyle={styles.submitBtnHover} type="submit" disabled={loading}>
                    {loading ? <FaSpinner className="spinner" /> : 'Sign In'}
                </StyleButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}