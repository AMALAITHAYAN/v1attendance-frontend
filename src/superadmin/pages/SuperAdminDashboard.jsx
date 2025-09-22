import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAdminUser, setAdminPassword } from "../utils/saAuth";

// --- Icon Imports ---
import { 
  FaSignOutAlt, FaUsersCog, FaPlus, FaBroadcastTower, FaChartArea, FaSearch
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
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0',
    '--radius': '16px', '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  signedInAs: { fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent', textDecoration: 'none' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDanger: { backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 20px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnDangerHover: { borderColor: 'var(--danger-color)', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger-color)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  btnIcon: { padding: 0, width: '48px', height: '48px' }, // NEW: Style for icon-only buttons
  actionGrid: { display: 'grid', gap: '24px' },
  actionCardContainer: { borderRadius: 'var(--radius)', padding: '1px', background: 'transparent', backgroundImage: 'none', transition: 'var(--transition)' },
  actionCardContainerHover: { transform: 'translateY(-5px)', backgroundImage: 'linear-gradient(120deg, var(--primary-color), var(--secondary-color))', boxShadow: '0 10px 32px 0 var(--primary-glow)' },
  actionCard: { background: 'var(--surface-color)', borderRadius: 'calc(var(--radius) - 1px)', padding: '32px', height: '100%', boxSizing: 'border-box' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  badge: { display: 'inline-block', padding: '4px 10px', fontSize: '12px', borderRadius: '999px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500 },
  cardTitle: { margin: '0', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' },
  cardDescription: { margin: '0 0 24px 0', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  cardActions: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
};
Object.assign(styles.page, styles.theme);

// --- Reusable Styled Helper Components ---
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  const Component = props.as || 'button';
  const componentProps = {...props};
  delete componentProps.as;
  return (<Component style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...componentProps}>{children}</Component>);
}
// FIXED: StyledInput now correctly merges incoming style props
function StyledInput({ style: incomingStyle, ...props }) {
  const [focus, setFocus] = useState(false);
  const readOnlyStyle = props.readOnly ? styles.inputReadonly : {};
  const combinedStyle = focus 
    ? { ...styles.input, ...styles.inputFocus, ...readOnlyStyle, ...incomingStyle } 
    : { ...styles.input, ...readOnlyStyle, ...incomingStyle };
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function ActionCard({ badge, title, description, children }) {
    const [hover, setHover] = useState(false);
    const containerStyle = { ...styles.actionCardContainer, ...(hover && styles.actionCardContainerHover) };
    return (
        <div style={containerStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div style={styles.actionCard}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{title}</h3>
                    <span style={styles.badge}>{badge}</span>
                </div>
                <p style={styles.cardDescription}>{description}</p>
                <div style={styles.cardActions}>
                    {children}
                </div>
            </div>
        </div>
    );
}


export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const user = getAdminUser();
  const [studentId, setStudentId] = useState("");
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  const goToStudentSummary = () => {
    const id = studentId.trim();
    if (id) navigate(`/superadmin/reports/students/${id}`);
  };

  const onLogout = () => {
    try {
      localStorage.removeItem("attendance:user");
      setAdminPassword("");
    } finally {
      navigate("/login", { replace: true });
    }
  };
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Super Admin</h1>
            <div style={styles.signedInAs}>
              <span>{user?.username}</span>
              <StyleButton baseStyle={styles.btnDanger} hoverStyle={styles.btnDangerHover} onClick={onLogout}>
                <FaSignOutAlt />
              </StyleButton>
            </div>
          </header>

          <div style={styles.actionGrid}>
            <ActionCard
              title="Teacher Management"
              badge="Manage"
              description="Add, edit, view, and remove teacher accounts from the system."
            >
              <StyleButton as={Link} to="/superadmin/teachers" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                <FaUsersCog /> Open Teachers
              </StyleButton>
              <StyleButton as={Link} to="/superadmin/teachers/new" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                <FaPlus /> Create Teacher
              </StyleButton>
            </ActionCard>

            <ActionCard
              title="Live Sessions"
              badge="Monitor"
              description="View a real-time stream of all active and recently started sessions."
            >
              <StyleButton as={Link} to="/superadmin/live" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                <FaBroadcastTower /> Open Live Stream
              </StyleButton>
            </ActionCard>

            <ActionCard
              title="Reports"
              badge="Analyze"
              description="View a snapshot of all currently active sessions or look up a specific student's summary."
            >
              <StyleButton as={Link} to="/superadmin/reports/active" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                <FaChartArea /> Active Sessions Report
              </StyleButton>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StyledInput
                  inputMode="numeric"
                  placeholder="Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                  style={{width: '160px'}}
                />
                <StyleButton
                  baseStyle={{...styles.btnPrimary, ...styles.btnIcon}} // APPLIED FIX
                  hoverStyle={styles.btnPrimaryHover}
                  onClick={goToStudentSummary}
                  disabled={!studentId}
                >
                  <FaSearch/>
                </StyleButton>
              </div>
            </ActionCard>
          </div>
        </div>
      </div>
    </>
  );
}