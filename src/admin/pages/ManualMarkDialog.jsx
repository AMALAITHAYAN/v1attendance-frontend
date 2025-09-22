import { useEffect, useRef, useState } from "react";
import { manualMarkAttendance } from "../api/manualMarkAttendance";

// --- Icon Imports ---
import { FaTimes, FaExclamationTriangle, FaSpinner, FaSave } from 'react-icons/fa';

// --- Helper component to inject global styles (fonts and animations) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `}</style>
);

// --- STYLES OBJECT ---
const styles = {
  // --- Design System: "Celestial Slate" ---
  theme: {
    '--font-family': "'Inter', sans-serif",
    '--surface-color': '#1a1a21',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--primary-color': '#6366f1',
    '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--danger-color': '#f43f5e',
    '--text-primary': '#f0f0f0',
    '--text-secondary': '#a0a0b0',
    '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(16, 16, 20, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', zIndex: 50,
    animation: 'fadeIn 0.2s ease-out forwards',
  },
  modal: {
    width: '100%', maxWidth: '480px',
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,.5)',
    animation: 'scaleIn 0.2s ease-out forwards',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute', top: '16px', right: '16px',
    width: '36px', height: '36px',
    borderRadius: '50%',
    color: 'var(--text-secondary)',
  },
  closeButtonHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--text-primary)',
  },
  title: { margin: '0 0 8px 0', fontSize: '22px', fontWeight: 600 },
  infoText: { marginTop: 0, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 },
  field: { marginBottom: '24px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', minHeight: '90px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '12px 16px', fontSize: '15px', resize: 'vertical' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  buttonGroup: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  messageBox: { padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
};
Object.assign(styles.modal, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };

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
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function StyledTextarea(props) {
  const [focus, setFocus] = useState(false);
  const combinedStyle = focus ? { ...styles.textarea, ...styles.inputFocus } : styles.textarea;
  return <textarea style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}

export default function ManualMarkDialog({ open, onClose, sessionId, onSuccess }) {
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setReason("");
    setStudentId("");
    const t = setTimeout(() => inputRef.current?.focus(), 50); // Small delay for animation
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && !loading) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const sid = Number(String(studentId).trim());
    if (!sid) { setErr("Valid Student ID is required"); return; }
    try {
      setLoading(true);
      const saved = await manualMarkAttendance({
        sessionId: Number(sessionId),
        studentId: sid,
        reason: reason?.trim() || null,
      });
      onSuccess?.(saved);
      onClose?.();
    } catch (e2) {
      setErr(e2?.message || "Manual mark failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = () => { if (!loading) onClose?.(); };
  const disableSave = loading || !String(studentId).trim();

  return (
    <>
      <GlobalStyles />
      <div style={styles.backdrop} onMouseDown={handleBackdrop}>
        <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
          <StyleButton baseStyle={styles.closeButton} hoverStyle={styles.closeButtonHover} onClick={onClose} disabled={loading}>
            <FaTimes />
          </StyleButton>
          <h3 style={styles.title}>Manual Mark Attendance</h3>
          <p style={styles.infoText}>
            Override checks and mark a student present for this session. Use this only for exceptions.
          </p>

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}

          <form onSubmit={submit}>
            <Field label="Student ID">
              <StyledInput
                ref={inputRef}
                inputMode="numeric"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g., 101"
              />
            </Field>
            <Field label="Reason (Optional)">
              <StyledTextarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Device issue, approved absence"
                rows={3}
              />
            </Field>
            <div style={styles.buttonGroup}>
              <StyleButton type="button" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={onClose} disabled={loading}>
                Cancel
              </StyleButton>
              <StyleButton type="submit" baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} disabled={disableSave}>
                {loading ? <FaSpinner className="spinner" /> : <><FaSave/> Save</>}
              </StyleButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}