import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTeacher, updateTeacher } from "../api/adminApi";
import { getAdminUser } from "../utils/saAuth";
import AdminPasswordBar from "./AdminPasswordBar";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaSave
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
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px', fontSize: '18px', color: 'var(--text-secondary)' },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

// --- Reusable Styled Helper Components ---
function Field({ label, children, span }) {
    const style = { gridColumn: span ? "1 / -1" : "auto" };
    return (<div style={style}><label style={styles.fieldLabel}>{label}</label>{children}</div>);
}
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
function StyledSelect(props) {
  const [focus, setFocus] = useState(false);
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus } : styles.input;
  return <select style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}

export default function EditTeacherPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getAdminUser();
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", gender: "", subjects: "", phoneNumber: "", idNumber: "", gmailId: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false); // For save button

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await getTeacher(id);
        setForm({
          name: t.name || "",
          gender: t.gender || "",
          subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : "",
          phoneNumber: t.phoneNumber || "",
          idNumber: t.idNumber || "",
          gmailId: t.gmailId || "",
          newPassword: "",
        });
      } catch (e) { setErr(e.message || "Failed to load teacher data"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const body = {
      name: form.name.trim(),
      gender: form.gender || null,
      subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      phoneNumber: form.phoneNumber.trim() || null,
      idNumber: form.idNumber.trim() || null,
      newPassword: form.newPassword?.trim() || null,
    };
    if (!body.name) { setErr("Name is required."); return; }
    try {
      setSubmitting(true);
      await updateTeacher(id, body);
      setMsg("Teacher details saved successfully!");
      setForm((f) => ({ ...f, newPassword: "" }));
    } catch (e2) { setErr(e2.message || "Update failed"); }
    finally { setSubmitting(false); }
  };
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    grid: { ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' },
  };

  if (loading) {
    return (
        <div style={styles.page}>
            <div style={styles.backgroundBlob}></div>
            <div style={styles.loadingContainer}>
                <FaSpinner className="spinner"/> Loading Teacher Data...
            </div>
        </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Edit Teacher</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin/teachers")}>← Teachers</StyleButton>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin")}>Dashboard</StyleButton>
            </div>
          </header>

          <AdminPasswordBar />

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {msg && <p style={styles.successBox}><FaCheckCircle/> {msg}</p>}

          <form onSubmit={submit} style={styles.card}>
            <div style={dynamicStyles.grid}>
              <Field label="Name *"><StyledInput name="name" value={form.name} onChange={onChange} /></Field>
              <Field label="Gender">
                <StyledSelect name="gender" value={form.gender} onChange={onChange}>
                  <option value="">— Select —</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </StyledSelect>
              </Field>
              <Field label="Subjects * (comma separated)" span>
                <StyledInput name="subjects" value={form.subjects} onChange={onChange} />
              </Field>
              <Field label="Phone"><StyledInput name="phoneNumber" value={form.phoneNumber} onChange={onChange} /></Field>
              <Field label="ID Number"><StyledInput name="idNumber" value={form.idNumber} onChange={onChange} /></Field>
              <Field label="Gmail ID (login)"><StyledInput value={form.gmailId} readOnly /></Field>
              <Field label="Reset Password (optional)"><StyledInput name="newPassword" value={form.newPassword} onChange={onChange} placeholder="Enter new password to update"/></Field>
            </div>

            <div style={styles.buttonGroup}>
              <StyleButton type="button" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/superadmin/teachers")}>Cancel</StyleButton>
              <StyleButton type="submit" disabled={submitting} baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover}>
                {submitting ? <FaSpinner className="spinner"/> : <><FaSave /> Save Changes</>}
              </StyleButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}