// src/admin/pages/ActiveSessionPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTeacherUser, setTeacherPassword } from "../utils/teacherAuth";
import { fetchCurrentQrToken } from "../api/qrsApi";
import {
  stopSession,
  fetchSessionSummary,
  fetchSessionById,
  openSessionEventStream,   // live updates
} from "../api/sessionsApi";
import TeacherPasswordBar from "./TeacherPasswordBar";
import ManualMarkDialog from "./ManualMarkDialog";
import QRCode from "qrcode";

// Icons
import {
  FaArrowLeft, FaSignOutAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner,
  FaSyncAlt, FaCopy, FaUserEdit, FaStopCircle
} from "react-icons/fa";

/* ---------- Styles + helpers ---------- */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes backgroundPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  `}</style>
);
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const cb = () => setMatches(m.matches);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, [query]);
  return matches;
};

const styles = {
  theme: {
    "--font-family": "'Inter', sans-serif",
    "--bg-color": "#101014",
    "--surface-color": "#1a1a21",
    "--border-color": "rgba(255, 255, 255, 0.1)",
    "--shadow-color": "rgba(0, 0, 0, 0.5)",
    "--primary-color": "#6366f1",
    "--secondary-color": "#2dd4bf",
    "--primary-glow": "rgba(99, 102, 241, 0.3)",
    "--danger-color": "#f43f5e",
    "--success-color": "#22c55e",
    "--warn-color": "#f59e0b",
    "--text-primary": "#f0f0f0",
    "--text-secondary": "#a0a0b0",
    "--radius": "16px",
    "--transition": "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  page: { fontFamily: "var(--font-family)", minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-primary)", boxSizing: "border-box", padding: "40px 24px", position: "relative", overflow: "hidden" },
  backgroundBlob: { position: "absolute", width: "600px", height: "600px", top: "-200px", left: "50%", transform: "translateX(-50%)", zIndex: 0, background: "radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)", opacity: 0.1, filter: "blur(150px)", animation: "backgroundPan 20s ease-in-out infinite" },
  container: { width: "100%", maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" },
  title: { margin: 0, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.025em" },
  headerActions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  card: { background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius)", padding: "32px", boxShadow: "0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)", marginBottom: "24px" },
  sectionTitle: { fontWeight: 600, fontSize: "20px", marginBottom: "16px" },
  infoText: { fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "8px" },
  btn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", transition: "var(--transition)", border: "none", background: "transparent" },
  btnPrimary: { background: "var(--primary-color)", color: "#ffffff", boxShadow: "0 4px 14px 0 var(--primary-glow)", padding: "0 24px", height: "48px", borderRadius: "12px", fontWeight: 600, fontSize: "15px" },
  btnPrimaryHover: { transform: "translateY(-2px)", boxShadow: "0 6px 20px 0 var(--primary-glow)" },
  btnSecondary: { background: "var(--surface-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "0 24px", height: "48px", borderRadius: "12px", fontWeight: 500 },
  btnSecondaryHover: { borderColor: "var(--text-secondary)", color: "var(--text-primary)" },
  btnDanger: { background: "var(--surface-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "0 20px", height: "48px", borderRadius: "12px", fontWeight: 500 },
  btnDangerHover: { borderColor: "var(--danger-color)", background: "rgba(244, 63, 94, 0.1)", color: "var(--danger-color)" },
  btnWarn: { background: "rgba(245, 158, 11, 0.1)", border: "1px solid var(--warn-color)", color: "var(--warn-color)", padding: "0 24px", height: "48px", borderRadius: "12px", fontWeight: 500 },
  btnWarnHover: { background: "var(--warn-color)", color: "#ffffff" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed", transform: "none", boxShadow: "none" },
  messageBox: { padding: "16px", borderRadius: "12px", marginTop: "24px", fontSize: "15px", fontWeight: 500, display: "flex", alignItems: "center", gap: "12px", borderWidth: "1px", borderStyle: "solid" },
  errorBox: { background: "rgba(244, 63, 94, 0.1)", borderColor: "var(--danger-color)", color: "var(--danger-color)" },
  successBox: { background: "rgba(34, 197, 94, 0.1)", borderColor: "var(--success-color)", color: "var(--success-color)" },
  layout: { display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px" },
  qrPanel: { display: "flex", flexDirection: "column", gap: "16px" },
  qrCanvas: { width: "320px", height: "320px", borderRadius: "var(--radius)", background: "#ffffff" },
  qrDisabled: { width: "320px", height: "320px", borderRadius: "var(--radius)", background: "var(--bg-color)", border: "1px dashed var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", title: { fontWeight: 600, marginBottom: "8px" }, text: { fontSize: "14px", color: "var(--text-secondary)" }},
  qrActions: { display: "flex", flexWrap: "wrap", gap: "12px" },
  statsPanel: { display: "flex", flexDirection: "column", gap: "24px" },
  infoRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", padding: "12px 0", label: { color: "var(--text-secondary)", fontSize: 13 }, value: { fontWeight: 600, fontFamily: "monospace" }},
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" },
  kpiCard: { background: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", label: { fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }, value: { fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }},
  progressOuter: { height: "8px", background: "var(--bg-color)", borderRadius: "999px", overflow: "hidden", marginTop: "16px" },
  progressInner: { height: "100%", backgroundImage: "linear-gradient(90deg, var(--primary-color), var(--secondary-color))", transition: "width 0.5s ease-in-out" },
  textarea: { width: "100%", minHeight: 110, background: "#101014", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "12px", padding: "12px", fontFamily: "monospace", fontSize: 12, resize: "vertical" },
  confirmBox: { display: "inline-flex", gap: "8px", alignItems: "center", background: "var(--surface-color)", border: "1px solid var(--warn-color)", padding: "4px 8px", borderRadius: "12px", color: "var(--warn-color)", fontWeight: 500 },
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

function StyleButton({ baseStyle, hoverStyle, children, ...props }) {
  const [hover, setHover] = useState(false);
  const combinedBase = { ...styles.btn, ...baseStyle };
  const combinedStyle = props.disabled ? { ...combinedBase, ...styles.btnDisabled } : (hover ? { ...combinedBase, ...hoverStyle } : combinedBase);
  return (<button style={combinedStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...props}>{children}</button>);
}
function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoRow.label}>{label}</div>
      <div style={styles.infoRow.value}>{value}</div>
    </div>
  );
}
function KPI({ label, value }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiCard.label}>{label}</div>
      <div style={styles.kpiCard.value}>{value}</div>
    </div>
  );
}

const parseJwt = (jwt) => {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const base = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(base).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(json);
  } catch { return null; }
};

/* ---------- Component ---------- */
export default function ActiveSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getTeacherUser();
  const isMobile = useMediaQuery("(max-width: 900px)");

  const [token, setToken] = useState("");
  const [lastUpdated, setLastUpdated] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [showManual, setShowManual] = useState(false);

  // KPIs
  const [present, setPresent] = useState(0);
  const [total, setTotal] = useState(0);

  // Live list of punches
  const [recentMarks, setRecentMarks] = useState([]); // {id, name, rollNo, username, at}[]

  const countsTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const sseRef = useRef(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => { if (!user) navigate("/login", { replace: true }); }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      if (countsTimerRef.current) clearInterval(countsTimerRef.current);
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("attendance:user");
    setTeacherPassword("");
    navigate("/login", { replace: true });
  };

  const scheduleTick = (expiresMs) => {
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => setCountdown(Math.max(0, expiresMs - Date.now())), 200);
  };

  const scheduleRefresh = (expiresMs) => {
    const delay = Math.max(500, expiresMs - Date.now() - 200);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => { void loadToken(); }, delay);
  };

  const drawQR = async (val) => {
    if (!canvasRef.current) return;
    try {
      await QRCode.toCanvas(canvasRef.current, val || "NO_TOKEN", {
        width: 320, margin: 1, color: { dark: "#000000", light: "#FFFFFF" },
      });
    } catch (e) { console.error("QR draw failed", e); }
  };

  const clearQRCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width || 320, c.height || 320);
  };

  const loadToken = useCallback(async () => {
    if (!qrEnabled) return;
    try {
      setErr(""); setLoading(true);
      const t = await fetchCurrentQrToken(id);
      setToken(t || ""); setLastUpdated(Date.now());
      const payload = t ? parseJwt(t) : null;
      const expSec = payload?.exp;
      const expMs = (expSec && Number.isFinite(expSec)) ? expSec * 1000 : Date.now() + 5000;
      setExpiresAt(expMs); setCountdown(Math.max(0, expMs - Date.now()));
      scheduleTick(expMs); scheduleRefresh(expMs);
      await drawQR(t);
    } catch (e) {
      if (e.status === 403) { setErr("Forbidden: TEACHER required. Please re-login."); navigate("/login", { replace: true }); }
      else { setErr(e.message || "Failed to load QR token"); }
    } finally { setLoading(false); }
  }, [id, qrEnabled, navigate]);

  const loadCounts = async () => {
    try {
      const sum = await fetchSessionSummary(id);
      setPresent(sum?.present ?? 0);
      setTotal(sum?.total ?? 0);
    } catch (e) { console.warn("Counts fetch failed", e?.message); }
  };

  const loadSessionMeta = useCallback(async () => {
    try {
      const s = await fetchSessionById(id);
      const enabled = Array.isArray(s?.flow) && s.flow.includes("QR");
      setQrEnabled(enabled);
      if (!enabled) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        if (tickTimerRef.current) clearInterval(tickTimerRef.current);
        setToken(""); setExpiresAt(0); setCountdown(0); clearQRCanvas();
      }
    } catch { setQrEnabled(true); }
  }, [id]);

  // Start SSE stream for live “attendance-marked” events
  useEffect(() => {
    if (!id) return;
    if (sseRef.current) sseRef.current.close();
    sseRef.current = openSessionEventStream(id, {
      onMarked: (evt) => {
        // live counts
        setPresent(Number(evt?.present ?? 0));
        setTotal(Number(evt?.total ?? 0));

        // live list item
        const s = evt?.student || {};
        const row = {
          id: s.id ?? `${s.username || ""}-${evt?.at || Date.now()}`,
          name: s.name || "(Unknown)",
          rollNo: s.rollNo || "",
          username: s.username || "",
          at: evt?.at || Date.now(),
        };
        setRecentMarks((prev) => {
          const filtered = prev.filter((r) => String(r.id) !== String(row.id));
          const next = [row, ...filtered];
          return next.slice(0, 100); // keep last 100
        });
      },
      onError: () => {
        // optional: setErr("Live stream disconnected");
      },
    });
    return () => { if (sseRef.current) sseRef.current.close(); };
  }, [id]);

  useEffect(() => {
    loadSessionMeta();
    loadCounts();
    countsTimerRef.current = setInterval(loadCounts, 5000);
  }, [id, loadSessionMeta]);

  useEffect(() => { if (qrEnabled) loadToken(); }, [id, qrEnabled, loadToken]);

  const copyToken = async () => {
    try { await navigator.clipboard.writeText(token); setOk("Token copied!"); setTimeout(() => setOk(""), 3000); }
    catch { setErr("Could not copy token"); }
  };

  const onManualRefresh = () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); loadToken(); };

  const onManualSuccess = (attendance) => {
    setOk(`Marked present: student #${attendance?.student?.id ?? ""}`);
    setTimeout(() => setOk(""), 4000);
    loadCounts();
  };

  const doStopSession = async () => {
    try { setStopping(true); await stopSession(id); navigate("/admin", { replace: true }); }
    catch (e) { setErr(e.message || "Failed to stop session"); }
    finally { setStopping(false); setConfirmStop(false); }
  };

  const pct = total > 0 ? Math.round((present * 100) / total) : 0;
  const secondsLeft = Math.ceil(countdown / 1000);

  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "16px" : "0" },
    layout: { ...styles.layout, gridTemplateColumns: isMobile ? "1fr" : "auto 1fr" },
  };

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Active Session</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => navigate("/admin")}>
                <FaArrowLeft /> Dashboard
              </StyleButton>
              <StyleButton baseStyle={styles.btnDanger} hoverStyle={styles.btnDangerHover} onClick={logout}>
                <FaSignOutAlt /> Logout
              </StyleButton>
            </div>
          </header>

          <TeacherPasswordBar />

          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={styles.successBox}><FaCheckCircle/> {ok}</p>}

          <div style={dynamicStyles.layout}>
            <div style={{...styles.card, padding: "24px"}}>
              <div style={styles.qrPanel}>
                {qrEnabled ? (<canvas ref={canvasRef} style={styles.qrCanvas} />) : (
                  <div style={styles.qrDisabled}>
                    <h3 style={styles.qrDisabled.title}>QR Disabled</h3>
                    <p style={styles.qrDisabled.text}>This session does not require a QR code scan.</p>
                  </div>
                )}
                <div style={styles.qrActions}>
                  {qrEnabled && (
                    <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={onManualRefresh} disabled={loading}>
                      <FaSyncAlt /> Refresh QR
                    </StyleButton>
                  )}
                  <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => setShowManual(true)}>
                    <FaUserEdit /> Manual Mark
                  </StyleButton>
                  {!confirmStop ? (
                    <StyleButton baseStyle={styles.btnWarn} hoverStyle={styles.btnWarnHover} onClick={() => setConfirmStop(true)}>
                      <FaStopCircle/> Stop Session
                    </StyleButton>
                  ) : (
                    <div style={styles.confirmBox}>
                      <span>Sure?</span>
                      <StyleButton
                        baseStyle={{...styles.btnSecondary, color: "var(--danger-color)", borderColor: "var(--danger-color)"}}
                        hoverStyle={{ backgroundColor: "var(--danger-color)", color: "#fff" }}
                        onClick={doStopSession}
                        disabled={stopping}
                      >
                        {stopping ? <FaSpinner className="spinner"/> : "Confirm"}
                      </StyleButton>
                      <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => setConfirmStop(false)}>
                        Cancel
                      </StyleButton>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.statsPanel}>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Session Details</h2>
                <InfoRow label="Session ID" value={id} />
                {qrEnabled && (
                  <>
                    <InfoRow label="Last Updated" value={lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"} />
                    <InfoRow label="Next Rotation" value={Number.isFinite(secondsLeft) ? `${secondsLeft}s` : "—"} />
                    <InfoRow label="Expires At" value={expiresAt ? new Date(expiresAt).toLocaleTimeString() : "—"} />
                  </>
                )}
                <p style={styles.infoText}>
                  {qrEnabled ? "QR rotates automatically. Use “Manual Mark” only for exceptions." : "QR is disabled for this session."}
                </p>
              </div>

              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Live Attendance</h2>
                <div style={styles.kpiGrid}>
                  <KPI label="Present" value={present} />
                  <KPI label="Total Students" value={total} />
                  <KPI label="Punch Ratio" value={`${pct}%`} />
                </div>
                <div style={styles.progressOuter}>
                  <div style={{ ...styles.progressInner, width: `${pct}%` }} />
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Live Punches</h2>
                {recentMarks.length === 0 ? (
                  <div style={{ color: "var(--text-secondary)" }}>No punches yet.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={th}>#</th>
                          <th style={th}>When</th>
                          <th style={th}>Roll No</th>
                          <th style={th}>Name</th>
                          <th style={th}>Username</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMarks.map((r, i) => (
                          <tr key={r.id || i}>
                            <td style={td}>{i + 1}</td>
                            <td style={tdMono}>{new Date(r.at).toLocaleTimeString()}</td>
                            <td style={tdMono}>{r.rollNo}</td>
                            <td style={td}>{r.name}</td>
                            <td style={tdMono}>{r.username}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {qrEnabled && (
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>Raw Token (JWT)</h2>
                  <textarea readOnly value={token} style={styles.textarea} placeholder="Waiting for token…" />
                  <div style={{ marginTop: "16px" }}>
                    <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={copyToken} disabled={!token}>
                      <FaCopy/> Copy Token
                    </StyleButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ManualMarkDialog
          open={showManual}
          onClose={() => setShowManual(false)}
          sessionId={id}
          onSuccess={onManualSuccess}
        />
      </div>
    </>
  );
}

/* small table styles */
const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid var(--border-color)",
  fontSize: 12,
  color: "var(--text-secondary)",
};
const td = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border-color)",
  fontSize: 14,
};
const tdMono = { ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" };
