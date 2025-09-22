import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// --- Icon Imports (FaTrophy added) ---
import { 
  FaRegCheckCircle, FaChartPie, FaKey, FaSignOutAlt, FaTrophy 
} from 'react-icons/fa';

// --- Helper component to inject global styles (fonts and animations) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes backgroundPan {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
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
    '--bg-color': '#101014', // Dark Slate
    '--surface-color': '#1a1a21', // Lighter Slate for cards
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    
    '--primary-color': '#6366f1', // Indigo
    '--secondary-color': '#2dd4bf', // Teal
    '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--danger-color': '#f43f5e',
    
    '--text-primary': '#f0f0f0',
    '--text-secondary': '#a0a0b0',
    '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // --- Layout & Page ---
  page: {
    fontFamily: 'var(--font-family)', minHeight: '100vh',
    background: 'var(--bg-color)',
    color: 'var(--text-primary)', boxSizing: 'border-box',
    padding: '40px 24px',
    position: 'relative',
    overflow: 'hidden', // Important for the background blob
  },
  // This div creates the slow-moving glow in the background
  backgroundBlob: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    top: '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 0,
    background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)',
    opacity: 0.1,
    filter: 'blur(150px)',
    animation: 'backgroundPan 20s ease-in-out infinite',
  },
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },

  // --- Buttons ---
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent' },
  btnLogout: {
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '0 20px', height: '48px',
    borderRadius: '12px',
    fontWeight: 600,
  },
  btnLogoutHover: {
      borderColor: 'var(--danger-color)',
      background: 'rgba(244, 63, 94, 0.1)',
      color: 'var(--danger-color)',
  },

  // --- Welcome Banner ---
  welcomeBanner: { 
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)', 
    padding: '32px', 
    boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
    marginBottom: '40px',
    title: {
        margin: '0 0 8px 0',
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    text: {
        margin: 0,
        fontSize: '16px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    }
  },

  // --- Action Grid & Cards ---
  actionGrid: { display: 'grid', gap: '24px' },
  // This is the outer container that creates the gradient border on hover
  actionCardContainer: {
    borderRadius: 'var(--radius)',
    padding: '1px', // This padding acts as the border width
    background: 'transparent',
    backgroundImage: 'none',
    transition: 'var(--transition)',
    textDecoration: 'none',
  },
  actionCardContainerHover: {
    transform: 'translateY(-5px)',
    backgroundImage: 'linear-gradient(120deg, var(--primary-color), var(--secondary-color))',
    boxShadow: '0 10px 32px 0 var(--primary-glow)',
  },
  // This is the inner card with the actual content
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    background: 'var(--surface-color)',
    borderRadius: 'calc(var(--radius) - 1px)', // Inner radius is slightly smaller
    padding: '24px',
    height: '100%',
    boxSizing: 'border-box',
    iconContainer: {
        width: '52px', height: '52px',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary-color)',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        transition: 'var(--transition)',
    },
    title: {
        margin: '0 0 8px 0', fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    description: {
        margin: 0, fontSize: '14px',
        color: 'var(--text-secondary)', lineHeight: 1.6,
    }
  }
};
Object.assign(styles.page, styles.theme);

// --- Reusable Styled Helper Components ---
function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}

function ActionCard({ to, icon, title, description }) {
    const [hover, setHover] = useState(false);
    const containerStyle = { ...styles.actionCardContainer, ...(hover && styles.actionCardContainerHover) };
    const iconStyle = { ...styles.actionCard.iconContainer, ...(hover && { color: '#ffffff', background: 'var(--primary-color)', borderColor: 'var(--primary-color)' }) };

    return (
        <Link to={to} style={containerStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div style={styles.actionCard}>
                <div style={iconStyle}>{icon}</div>
                <div>
                    <h3 style={styles.actionCard.title}>{title}</h3>
                    <p style={styles.actionCard.description}>{description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function StudentDashboard() {
  const nav = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const username = useMemo(() => String(localStorage.getItem("attendance:studentUser") || ""), []);

  const onLogout = () => {
    localStorage.removeItem("attendance:studentUser");
    localStorage.removeItem("attendance:studentPass");
    nav("/login", { replace: true });
  };
  
  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    actionGrid: { ...styles.actionGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' },
  };

  return (
    <>
        <GlobalStyles />
        <div style={styles.page}>
            <div style={styles.backgroundBlob}></div>
            <div style={styles.container}>
                <header style={dynamicStyles.header}>
                    <h1 style={styles.title}>Student Dashboard</h1>
                    <StyleButton baseStyle={styles.btnLogout} hoverStyle={styles.btnLogoutHover} onClick={onLogout}>
                        <FaSignOutAlt /> Logout
                    </StyleButton>
                </header>

                <div style={styles.welcomeBanner}>
                    <h2 style={styles.welcomeBanner.title}>Welcome, {username || 'Student'}!</h2>
                    <p style={styles.welcomeBanner.text}>
                        This is your central hub for managing your attendance. Select an action below to get started.
                    </p>
                </div>

                <div style={dynamicStyles.actionGrid}>
                    <ActionCard 
                        to="/student/mark"
                        icon={<FaRegCheckCircle size={24} />}
                        title="Mark Attendance"
                        description="Complete the required checks to mark your attendance for an active session."
                    />
                    <ActionCard 
                        to="/student/reports"
                        icon={<FaChartPie size={24} />}
                        title="My Reports"
                        description="View your complete attendance history, summaries, and detailed logs for past sessions."
                    />
                    {/* --- NEW ACTION CARD ADDED HERE --- */}
                    <ActionCard 
                        to="/student/score"
                        icon={<FaTrophy size={24} />}
                        title="Attendance Score"
                        description="Check your rank, level up, and view your overall performance score and achievements."
                    />
                    <ActionCard 
                        to="/change-password"
                        icon={<FaKey size={24} />}
                        title="Change Password"
                        description="Update your account credentials to keep your profile secure at all times."
                    />
                </div>
            </div>
        </div>
    </>
  );
}