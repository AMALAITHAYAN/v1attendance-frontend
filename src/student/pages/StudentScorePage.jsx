import { Link } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt, FaStar, FaAward, FaFire } from 'react-icons/fa';

// --- Reusing styles from the dashboard for consistency ---
const styles = {
  theme: {
    '--font-family': "'Inter', sans-serif", '--bg-color': '#101014', '--surface-color': '#1a1a21',
    '--border-color': 'rgba(255, 255, 255, 0.1)', '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    '--primary-color': '#6366f1', '--secondary-color': '#2dd4bf', '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--text-primary': '#f0f0f0', '--text-secondary': '#a0a0b0', '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  page: {
    fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)',
    color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden',
  },
  backgroundBlob: {
    position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)',
    opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite',
  },
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  card: {
    background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
    padding: '32px', boxShadow: '0 8px 32px 0 var(--shadow-color)', marginBottom: '24px',
  },
  btnBack: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)', padding: '0 20px', height: '48px', borderRadius: '12px',
    fontWeight: 600, textDecoration: 'none', transition: 'var(--transition)',
  },
  // --- Score Page Specific Styles ---
  scoreDisplay: { textAlign: 'center', padding: '20px 0' },
  scoreValue: {
    fontSize: '72px', fontWeight: 'bold', margin: 0,
    background: 'linear-gradient(120deg, var(--primary-color), var(--secondary-color))',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
  },
  scoreLabel: { fontSize: '18px', color: 'var(--text-secondary)', marginTop: '8px' },
  rankSection: { display: 'flex', alignItems: 'center', gap: '24px' },
  rankIcon: { fontSize: '64px', color: 'var(--secondary-color)' },
  rankInfo: { flex: 1 },
  rankTitle: { margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 },
  progressContainer: { width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '99px', overflow: 'hidden' },
  progressBar: { height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', borderRadius: '99px' },
  progressLabel: { fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' },
  statCard: { background: '#101014', padding: '20px', borderRadius: '12px', textAlign: 'center' },
  statValue: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' },
  statLabel: { fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }
};
Object.assign(styles.page, styles.theme);

export default function StudentScorePage() {
  // --- Dummy Data ---
  const score = 88;
  const currentXP = 1250;
  const nextLevelXP = 2000;
  const progressPercent = (currentXP / nextLevelXP) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundBlob}></div>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>My Score & Rank</h1>
          <Link to="/student" style={styles.btnBack}>
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </header>

        {/* --- Overall Score Card --- */}
        <div style={styles.card}>
          <div style={styles.scoreDisplay}>
            <p style={styles.scoreValue}>{score}%</p>
            <p style={styles.scoreLabel}>Overall Attendance Score</p>
          </div>
        </div>

        {/* --- Rank & Level Up Card --- */}
        <div style={styles.card}>
          <div style={styles.rankSection}>
            <div style={styles.rankIcon}><FaShieldAlt /></div>
            <div style={styles.rankInfo}>
              <h2 style={styles.rankTitle}>Rank: Attendance Knight</h2>
              <div style={styles.progressContainer}>
                <div style={{ ...styles.progressBar, width: `${progressPercent}%` }}></div>
              </div>
              <p style={styles.progressLabel}>
                {currentXP} / {nextLevelXP} XP ({nextLevelXP - currentXP} to next rank: <strong>Guardian</strong>)
              </p>
            </div>
          </div>
        </div>
        
        {/* --- Stats & Achievements Grid --- */}
        <div style={styles.statsGrid}>
            <div style={styles.statCard}><FaStar /><p style={styles.statValue}>1</p><p style={styles.statLabel}>Perfect Weeks</p></div>
            <div style={styles.statCard}><FaAward /><p style={styles.statValue}>Top 10%</p><p style={styles.statLabel}>Class Ranking</p></div>
            <div style={styles.statCard}><FaFire /><p style={styles.statValue}>5 Days</p><p style={styles.statLabel}>On-Time Streak</p></div>
        </div>

      </div>
    </div>
  );
}