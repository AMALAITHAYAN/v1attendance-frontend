// src/student/pages/StudentPasswordBar.jsx

import { useState } from "react";
import { getStudentPass, setStudentPass } from "../utils/studentAuth";
import { toast } from 'react-toastify'; // Import toast

// --- Icon Imports ---
import { FaKey, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';

// --- STYLES OBJECT ---
// Using the "Celestial Slate" design system principles
const styles = {
  // --- Design System Variables (for consistency) ---
  theme: {
    '--font-family': "'Inter', sans-serif",
    '--surface-color': '#1a1a21',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--primary-color': '#6366f1', // Indigo
    '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--text-primary': '#f0f0f0',
    '--text-secondary': '#a0a0b0',
    '--text-placeholder': '#6c7693',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // --- Component Styles ---
  barContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap', // Ensures responsiveness on smaller screens
  },
  
  // --- Input Styles ---
  inputContainer: { position: 'relative', flexGrow: 1, minWidth: '260px' },
  inputIcon: { position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', zIndex: 2, lineHeight: 0 },
  input: {
    width: '100%', height: '48px',
    backgroundColor: 'var(--surface-color)',
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

  // --- Button Styles ---
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent' },
  btnGhost: {
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '0 20px', height: '48px',
    borderRadius: '12px',
    fontWeight: 500,
  },
  btnGhostHover: {
      borderColor: 'var(--text-secondary)',
      color: 'var(--text-primary)',
  },
};

// Apply theme variables to root styles
Object.assign(styles.barContainer, styles.theme);
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
    return (
        <div style={styles.inputContainer}>
            <span style={styles.inputIcon}><FaKey color={styles.theme['--text-placeholder']} /></span>
            <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />
        </div>
    );
}

export default function StudentPasswordBar() {
  const [show, setShow] = useState(false);
  const [pwd, setPwd] = useState(getStudentPass());

  return (
    <div style={styles.barContainer}>
      <StyledInput
        type={show ? "text" : "password"}
        placeholder="Student session password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
      />
      <StyleButton baseStyle={styles.btnGhost} hoverStyle={styles.btnGhostHover} onClick={() => setShow(s => !s)}>
        {show ? <FaEyeSlash /> : <FaEye />}
        {show ? "Hide" : "Show"}
      </StyleButton>
      <StyleButton
        baseStyle={styles.btnGhost}
        hoverStyle={styles.btnGhostHover}
        onClick={() => {
          setStudentPass(pwd);
          // NEW: Replaced alert with a success toast
          toast.success('Password saved for this session!');
        }}
        title="Save password for API requests during this session"
      >
        <FaSave />
        Save
      </StyleButton>
    </div>
  );
}