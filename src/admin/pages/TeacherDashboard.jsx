import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import TeacherPasswordBar from "./TeacherPasswordBar";

// --- Icon Imports ---
import {
  FaSignOutAlt, FaKey, FaPlusCircle, FaUsers, FaChartLine, FaExclamationTriangle
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
    '--warn-color': '#f59e0b',
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0',
    '--radius': '16px', '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent', textDecoration: 'none' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDanger: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 20px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnDangerHover: { borderColor: 'var(--danger-color)', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger-color)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  
  note: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid var(--warn-color)',
    color: '#fcd34d', // Amber-300
    padding: '16px', borderRadius: '12px',
    marginBottom: '24px', fontSize: '15px', fontWeight: 500,
  },
  
  actionGrid: { display: 'grid', gap: '24px' },
  actionCardContainer: { borderRadius: 'var(--radius)', padding: '1px', background: 'transparent', backgroundImage: 'none', transition: 'var(--transition)', textDecoration: 'none' },
  actionCardContainerHover: { transform: 'translateY(-5px)', backgroundImage: 'linear-gradient(120deg, var(--primary-color), var(--secondary-color))', boxShadow: '0 10px 32px 0 var(--primary-glow)' },
  actionCard: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--surface-color)',
    borderRadius: 'calc(var(--radius) - 1px)',
    padding: '24px', height: '100%', boxSizing: 'border-box',
    justifyContent: 'space-between',
    content: { marginBottom: '24px' },
    icon: { fontSize: '24px' },
    title: { margin: '16px 0 8px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' },
    description: { margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 },
    badge: { display: 'inline-block', padding: '4px 10px', fontSize: '12px', borderRadius: '999px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '16px' }
  },
};
Object.assign(styles.page, styles.theme);

// --- Reusable Styled Helper Components ---
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  // If 'as' prop is Link, render a Link, otherwise a button
  const Component = props.as || 'button';
  const componentProps = {...props};
  delete componentProps.as;

  return (
    <Component 
      style={combinedStyle} 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)} 
      {...componentProps}
    >
        {children}
    </Component>
  );
}

function ActionCard({ to, icon, badge, title, description }) {
    const [hover, setHover] = useState(false);
    const containerStyle = { ...styles.actionCardContainer, ...(hover && styles.actionCardContainerHover) };
    const iconStyle = { ...styles.actionCard.icon, color: hover ? 'var(--primary-color)' : 'var(--text-secondary)', transition: 'var(--transition)' };
    const btnStyle = { ...styles.btn, ...styles.btnSecondary, ...(hover && { borderColor: 'var(--primary-color)', color: 'var(--text-primary)'}) };

    return (
        <Link to={to} style={containerStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div style={styles.actionCard}>
                <div style={styles.actionCard.content}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        {badge && <div style={styles.actionCard.badge}>{badge}</div>}
                        <div style={iconStyle}>{icon}</div>
                    </div>
                    <h3 style={styles.actionCard.title}>{title}</h3>
                    <p style={styles.actionCard.description}>{description}</p>
                </div>
                <div style={btnStyle}>
                    {title}
                </div>
            </div>
        </Link>
    );
}


export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [needsPass, setNeedsPass] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    try {
      const u = localStorage.getItem("attendance:user");
      const p = localStorage.getItem("attendance:teacherPass");
      setNeedsPass(!p);
      if (!u) {
        navigate("/login", { replace: true });
      }
    } catch {}
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem("attendance:user");
    localStorage.removeItem("attendance:teacherPass");
    localStorage.removeItem("attendance:adminUser");
    localStorage.removeItem("attendance:adminPass");
    localStorage.removeItem("attendance:lastRole");
    navigate("/login", { replace: true });
  }, [navigate]);
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    actionGrid: { ...styles.actionGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))' },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
            <header style={dynamicStyles.header}>
              <h1 style={styles.title}>Teacher Dashboard</h1>
              <div style={styles.headerActions}>
                <StyleButton as={Link} to="/change-password" baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover}>
                    <FaKey /> Change Password
                </StyleButton>
                <StyleButton baseStyle={styles.btnDanger} hoverStyle={styles.btnDangerHover} onClick={logout}>
                    <FaSignOutAlt /> Logout
                </StyleButton>
              </div>
            </header>

            <TeacherPasswordBar />

            {needsPass && (
              <div style={styles.note}>
                <FaExclamationTriangle style={{ color: 'var(--warn-color)' }} />
                <span><strong>Heads up:</strong> Enter your teacher password above to authorize API requests.</span>
              </div>
            )}

            <div style={dynamicStyles.actionGrid}>
                <ActionCard 
                    to="/admin/start-session"
                    icon={<FaPlusCircle />}
                    badge="Start"
                    title="Start Session"
                    description="Configure a new attendance session with a custom validation flow, geofence, and time window."
                />
                <ActionCard 
                    to="/admin/students"
                    icon={<FaUsers />}
                    badge="Manage"
                    title="Manage Students"
                    description="Create new student profiles, bulk upload rosters via XLSX, and manage face registration data."
                />
                <ActionCard 
                    to="/admin/reports"
                    icon={<FaChartLine />}
                    badge="Analyze"
                    title="View Reports"
                    description="Browse historical attendance data by date range and view detailed per-session summaries."
                />
            </div>
        </div>
      </div>
    </>
  );
}