import { useEffect, useState, useCallback } from "react";
import { getAdminPassword, setAdminPassword, getAdminUser } from "../utils/saAuth";

// --- Icon Imports ---
import { FaKey, FaEye, FaEyeSlash, FaSave, FaUserCog } from 'react-icons/fa';

// --- STYLES OBJECT ---
const styles = {
  // --- Design System: "Celestial Slate" ---
  theme: {
    '--font-family': "'Inter', sans-serif",
    '--surface-color': '#1a1a21',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--primary-color': '#6366f1',
    '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--text-primary': '#f0f0f0',
    '--text-secondary': '#a0a0b0',
    '--text-placeholder': '#6c7693',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // --- Component Styles ---
  bar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '12px 16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginRight: 'auto',
    minWidth: '200px',
  },
  userLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  username: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  
  inputContainer: { position: 'relative', width: '340px' },
  inputIcon: { position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', zIndex: 2, lineHeight: 0 },
  input: {
    width: '100%', height: '48px',
    backgroundColor: '#101014',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '12px', padding: '0 16px 0 48px',
    fontSize: '15px', 
    transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none',
  },
  inputFocus: {
    borderColor: 'var(--primary-color)',
    boxShadow: '0 0 0 4px var(--primary-glow)',
  },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  btnSecondary: {
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '0 20px', height: '48px',
    borderRadius: '12px',
    fontWeight: 500,
  },
  btnSecondaryHover: {
      borderColor: 'var(--text-secondary)',
      color: 'var(--text-primary)',
  },
};
Object.assign(styles.bar, styles.theme);
Object.assign(styles.input, styles.theme);

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
    const disabledStyle = props.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {};

    return (
        <div style={styles.inputContainer}>
            <span style={styles.inputIcon}><FaKey color={styles.theme['--text-placeholder']} /></span>
            <input style={{...combinedStyle, ...disabledStyle}} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />
        </div>
    );
}

export default function AdminPasswordBar() {
  const admin = getAdminUser();
  const [show, setShow] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    setPass(getAdminPassword() || "");
  }, []);
  
  const onChange = useCallback((e) => {
    const v = e.target.value ?? "";
    setPass(v);
    setAdminPassword(v); // Auto-save on change
  }, []);

  const save = useCallback(() => {
    setAdminPassword(pass ?? "");
    // Optional: Add feedback like a toast notification here if desired
  }, [pass]);

  const disabled = !admin?.username;

  return (
    <div style={styles.bar}>
      <div style={styles.userInfo}>
        <FaUserCog size={20} color={styles.theme['--text-secondary']} />
        <div>
            <div style={styles.userLabel}>Super Admin</div>
            <div style={styles.username}>
                {admin?.username || "— Not Logged In —"}
            </div>
        </div>
      </div>

      <StyledInput
        type={show ? "text" : "password"}
        placeholder="Admin password for actions"
        value={pass}
        onChange={onChange}
        disabled={disabled}
        autoComplete="current-password"
      />
      <StyleButton
        type="button"
        baseStyle={styles.btnSecondary}
        hoverStyle={styles.btnSecondaryHover}
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
        {show ? "Hide" : "Show"}
      </StyleButton>
      <StyleButton type="button" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={save} disabled={disabled}>
        <FaSave/>
        Save
      </StyleButton>
    </div>
  );
}