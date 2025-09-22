import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentUser, setStudentPass } from "../utils/studentAuth";
import StudentPasswordBar from "./StudentPasswordBar";
import { getPublicIp } from "../api/publicIp";
import { getStudentSessionMeta } from "../api/studentSessionApi";
import { checkWifiApi, checkGeoApi, checkFaceApi, checkQrApi } from "../api/checksApi";
import { markAttendanceApi } from "../api/attendanceApi";

// --- Icon Imports ---
import { 
  FaArrowLeft, FaSignOutAlt, FaExclamationTriangle, FaCheckCircle, FaSpinner, 
  FaWifi, FaMapMarkerAlt, FaUserCircle, FaQrcode, FaSyncAlt, FaMapPin, FaCamera, FaRetweet,
  FaIdCard, FaGlobe, FaSmile, FaCheckDouble
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
    '--text-placeholder': '#6c7693', '--radius': '16px',
    '--transition': 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  page: { fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', boxSizing: 'border-box', padding: '40px 24px', position: 'relative', overflow: 'hidden' },
  backgroundBlob: { position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-50%)', zIndex: 0, background: 'radial-gradient(circle, var(--primary-color) 0%, var(--secondary-color) 100%)', opacity: 0.1, filter: 'blur(150px)', animation: 'backgroundPan 20s ease-in-out infinite' },
  container: { width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' },
  title: { margin: 0, fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em' },
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  card: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '32px', boxShadow: '0 8px 32px 0 var(--shadow-color), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)', marginTop: '24px' },
  sectionTitle: { fontWeight: 600, fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' },
  infoText: { fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' },
  field: { marginBottom: '24px' },
  fieldLabel: { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' },
  input: { width: '100%', height: '48px', backgroundColor: '#101014', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', padding: '0 16px', fontSize: '15px', transition: 'var(--transition)', boxSizing: 'border-box', outline: 'none' },
  inputFocus: { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 4px var(--primary-glow)' },
  inputReadonly: { cursor: 'not-allowed', color: 'var(--text-secondary)', background: '#2a2a33' },
  inputGroup: { display: 'flex', gap: '12px', alignItems: 'center' },
  btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', border: 'none', background: 'transparent' },
  btnPrimary: { background: 'var(--primary-color)', color: '#ffffff', boxShadow: '0 4px 14px 0 var(--primary-glow)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 600, fontSize: '15px' },
  btnPrimaryHover: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px 0 var(--primary-glow)' },
  btnSecondary: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 24px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnSecondaryHover: { borderColor: 'var(--text-secondary)', color: 'var(--text-primary)' },
  btnDanger: { background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 20px', height: '48px', borderRadius: '12px', fontWeight: 500 },
  btnDangerHover: { borderColor: 'var(--danger-color)', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger-color)' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' },
  buttonGroup: { marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  messageBox: { padding: '16px', borderRadius: '12px', marginTop: '24px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderWidth: '1px', borderStyle: 'solid' },
  errorBox: { background: 'rgba(244, 63, 94, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' },
  successBox: { background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success-color)', color: 'var(--success-color)' },
  flowChips: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 },
  gridContainer: { display: 'grid', gap: '24px' },
  videoPlayer: { width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 'var(--radius)', background: '#000', marginBottom: '12px', border: '1px solid var(--border-color)' },
  selfiePreview: { width: '100%', maxWidth: '240px', height: 'auto', borderRadius: 'var(--radius)', marginTop: '16px', border: '1px solid var(--border-color)' },
  selfieInfo: { marginTop: '20px', display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' },
  checksCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '12px', label: { width: '70px', fontWeight: 500, color: 'var(--text-primary)' }, dot: { width: '10px', height: '10px', borderRadius: '50%' }, detail: { color: 'var(--text-secondary)', fontSize: '14px' }},
};
Object.assign(styles.page, styles.theme);
styles.errorBox = { ...styles.messageBox, ...styles.errorBox };
styles.successBox = { ...styles.messageBox, ...styles.successBox };

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
  const readOnlyStyle = props.readOnly ? styles.inputReadonly : {};
  const combinedStyle = focus ? { ...styles.input, ...styles.inputFocus, ...readOnlyStyle } : { ...styles.input, ...readOnlyStyle };
  return <input style={combinedStyle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />;
}
function ChecksBreakdown({ checks }) {
  const Row = ({ label, ok, detail }) => (
    <div style={styles.checkRow}>
      <span style={styles.checkRow.label}>{label}</span>
      <span style={{ ...styles.checkRow.dot, backgroundColor: ok ? 'var(--success-color)' : 'var(--danger-color)' }} />
      <span style={styles.checkRow.detail}>{detail}</span>
    </div>
  );
  const { FACE, GEO, WIFI, QR } = checks || {};
  if (!FACE && !GEO && !WIFI && !QR) return null;
  return (
    <div style={{...styles.card, ...styles.checksCard}}>
      {WIFI && <Row label="Wi-Fi" ok={!!WIFI.ok} detail={WIFI.ok ? "Verified" : (WIFI.reason || "Mismatch")} />}
      {GEO && <Row label="Geo" ok={!!GEO.ok} detail={ GEO.ok ? "Verified" : (GEO.reason || (typeof GEO.distanceMeters === "number" ? `Outside geofence (${Math.round(GEO.distanceMeters)}m)`: "Outside geofence"))}/>}
      {FACE && <Row label="Face" ok={!!FACE.ok} detail={FACE.ok ? "Verified" : (FACE.reason || "Not match")} />}
      {QR && <Row label="QR" ok={!!QR.ok} detail={QR.ok ? "Verified" : (QR.reason || "Invalid/expired")} />}
    </div>
  );
}

// --- Stepper Component for Visual Progress ---
const STEP = { PICK_SESSION: 0, WIFI_GEO: 1, FACE: 2, QR: 3, DONE: 4 };
const stepLabels = [
    { id: STEP.PICK_SESSION, icon: <FaIdCard />, label: "Session" },
    { id: STEP.WIFI_GEO, icon: <FaGlobe />, label: "Environment" },
    { id: STEP.FACE, icon: <FaSmile />, label: "Face Scan" },
    { id: STEP.QR, icon: <FaQrcode />, label: "QR Code" },
    { id: STEP.DONE, icon: <FaCheckDouble />, label: "Complete" },
];
function collapseFlowToSteps(flow) {
  const steps = [];
  if (flow.includes("WIFI") || flow.includes("GEO")) steps.push(STEP.WIFI_GEO);
  if (flow.includes("FACE")) steps.push(STEP.FACE);
  if (flow.includes("QR")) steps.push(STEP.QR);
  return steps;
}
function Stepper({ currentStep, flow }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const visibleSteps = useMemo(() => {
        const orderedSteps = collapseFlowToSteps(flow);
        const stepSet = new Set([STEP.PICK_SESSION, STEP.DONE, ...orderedSteps]);
        return stepLabels.filter(s => stepSet.has(s.id));
    }, [flow]);

    const activeIndex = visibleSteps.findIndex(s => s.id === currentStep);

    const stepperStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', position: 'relative' };
    const progressLineStyle = { position: 'absolute', top: '50%', left: '0', height: '2px', background: 'var(--border-color)', width: '100%', zIndex: 0 };
    const progressLineActiveStyle = { ...progressLineStyle, background: 'var(--primary-color)', width: `${(activeIndex / (visibleSteps.length - 1)) * 100}%`, transition: 'width 0.5s ease-in-out' };
    
    return (
        <div style={stepperStyle}>
            <div style={progressLineStyle}></div>
            <div style={progressLineActiveStyle}></div>
            {visibleSteps.map((step, index) => {
                const isActive = index <= activeIndex;
                const stepStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'var(--transition)' };
                const iconContainerStyle = { width: '40px', height: '40px', borderRadius: '50%', background: isActive ? 'var(--primary-color)' : 'var(--surface-color)', border: `2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', color: isActive ? '#fff' : 'var(--text-secondary)' };
                return (
                    <div key={step.id} style={stepStyle}>
                        <div style={iconContainerStyle}>{step.icon}</div>
                        {!isMobile && <span style={{ fontSize: '13px', fontWeight: 500 }}>{step.label}</span>}
                    </div>
                );
            })}
        </div>
    );
}

// ===== Utility Hooks and Functions =====
function usePublicIpAuto() {
  const [ip, setIp] = useState("");
  useEffect(() => { getPublicIp().then(setIp).catch(()=>{}); }, []);
  const refresh = async () => { try { setIp(await getPublicIp()); } catch {} };
  return { ip, refresh };
}

function useCurrentLocation() {
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [msg, setMsg] = useState("");
  const run = useCallback(() => {
    if (!navigator.geolocation) { setMsg("Geolocation not supported"); return; }
    setMsg("Fetching location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMsg(`Location set (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => setMsg(`Location error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);
  return { ...coords, msg, run };
}

function nextStepFrom(current, orderedSteps) {
  const i = orderedSteps.indexOf(current);
  if (i === -1) return orderedSteps[0] ?? STEP.DONE;
  return orderedSteps[i + 1] ?? STEP.DONE;
}
// =================================================

/* ---------- Main Page Component ---------- */
export default function MarkAttendancePage() {
  const nav = useNavigate();
  const user = getStudentUser();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => { if (!user) nav("/login", { replace: true }); }, [user, nav]);

  const [step, setStep] = useState(STEP.PICK_SESSION);
  const [sessionId, setSessionId] = useState("");
  const [flow, setFlow] = useState([]);
  const orderedSteps = useMemo(() => collapseFlowToSteps(flow), [flow]);
  const { ip, refresh: refreshIp } = usePublicIpAuto();
  const { lat, lng, msg: geoMsg, run: getLoc } = useCurrentLocation();
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [camOn, setCamOn] = useState(false);
  const [camMsg, setCamMsg] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [qrToken, setQrToken] = useState("");
  const [scanErr, setScanErr] = useState("");
  const [scanning, setScanning] = useState(false);
  const qrVideoRef = useRef(null);
  const qrStreamRef = useRef(null);
  const rafRef = useRef(null);
  const [checks, setChecks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(""); 
  const [err, setErr] = useState(""); 
  
  // State for camera facing mode
  const [facingMode, setFacingMode] = useState("environment");

  useEffect(() => { getLoc(); }, [getLoc]);

  const needsWifi = flow.includes("WIFI");
  const needsGeo  = flow.includes("GEO");
  const needsFace = flow.includes("FACE");
  const needsQr   = flow.includes("QR");

  const canContinueWifi = useMemo(() => (
    Boolean(sessionId && (!needsWifi || ip) && (!needsGeo || (lat !== "" && lng !== "")))
  ), [sessionId, ip, lat, lng, needsWifi, needsGeo]);

  useEffect(() => {
    setOk("");
    setErr("");
  }, [step]);
  
  const loadMeta = async () => {
    if (!sessionId) { setErr("Please enter a session ID."); return; }
    try {
      setLoading(true);
      const meta = await getStudentSessionMeta(Number(sessionId));
      const f = Array.isArray(meta?.flow) ? meta.flow : [];
      if (!f.length) { setErr("This session has no validation flow configured."); return; }
      setFlow(f);
      setStep(collapseFlowToSteps(f)[0] ?? STEP.DONE);
      setOk("Session loaded successfully!");
    } catch (e) {
      if (e.code === "SESSION_NOT_FOUND") setErr("Session not found.");
      else if (e.code === "SESSION_EXPIRED") setErr("This session has already ended.");
      else setErr(e?.message || "Could not load session.");
    } finally { setLoading(false); }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamOn(false); setCamMsg("");
  }, []);

  const stopQr = useCallback(() => {
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach(t => t.stop());
      qrStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopCamera(); stopQr(); }, [stopCamera, stopQr]);

  const startCamera = async () => {
    setScanErr(""); setCamMsg(""); stopQr();
    if (camOn) return;
    try {
      setCamOn(true);
      await new Promise(requestAnimationFrame);
      const video = videoRef.current;
      if (!video) { setErr("Camera view unavailable."); setCamOn(false); return; }
      video.setAttribute("playsinline", ""); video.setAttribute("autoplay", ""); video.muted = true;
      setCamMsg("Requesting camera…");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream; video.srcObject = stream;
      await new Promise(res => video.readyState >= 3 ? res() : video.addEventListener("canplay", res, { once: true }));
      try { await video.play(); } catch {}
      const track = stream.getVideoTracks()?.[0];
      setCamMsg(`Camera ready • ${track?.label || "camera"}`);
    } catch (e) {
      setErr("Could not access camera: " + (e?.message || e));
      stopCamera();
    }
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.9));
    const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
    setSelfieFile(file);
    const url = URL.createObjectURL(blob);
    setSelfiePreview((old) => { if (old) URL.revokeObjectURL(old); return url; });
    stopCamera();
  };

  // UPDATED QR SCANNER LOGIC
  const startQrScan = useCallback(async () => {
    setScanErr("");
    stopCamera();
    if (!("BarcodeDetector" in window)) {
      setScanErr("Scanner not supported. Please paste token manually.");
      return;
    }
    try {
      const det = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      qrStreamRef.current = stream;
      const v = qrVideoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      setScanning(true); // Moved after stream is ready
      const tick = async () => {
        if (!qrVideoRef.current || qrVideoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await det.detect(qrVideoRef.current);
          if (codes?.length) {
            setQrToken(codes[0].rawValue || "");
            stopQr();
            return;
          }
        } catch (e) { console.error("Barcode detection failed:", e); }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setScanErr("Camera permission was denied.");
      } else if (err.name === "NotFoundError") {
        setScanErr("No suitable camera found for this mode.");
      } else {
        setScanErr("Could not start camera for scanning.");
      }
      stopQr();
    }
  }, [facingMode, stopCamera, stopQr]);

  const handleSwitchCamera = () => {
      stopQr();
      setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };
  
  useEffect(() => {
      if (scanning && !qrStreamRef.current) {
          startQrScan();
      }
  }, [facingMode, scanning, startQrScan]);

  const commit = async () => {
    const payload = { sessionId: Number(sessionId), publicIp: ip || "", studentLat: lat === "" ? null : Number(lat), studentLng: lng === "" ? null : Number(lng), qrToken: qrToken || null };
    try {
      setLoading(true);
      const r = await markAttendanceApi(payload, needsFace ? (selfieFile || null) : null);
      setOk("Attendance marked successfully!");
      setChecks(r?.data?.checks || null); setStep(STEP.DONE);
    } catch (e) {
      const { status, data } = e?.response || {};
      if (status === 409 && data) {
        setErr(data.message || "A check failed. Please review.");
        setChecks(data.checks || null);
      } else {
        setErr(e.message || "Submit failed");
      }
    } finally { setLoading(false); }
  };

  const advanceOrCommit = (passedStep) => {
    const next = nextStepFrom(passedStep, orderedSteps);
    if (next === STEP.DONE) commit();
    else setStep(next);
  };
  
  const runWifiGeoChecks = async () => {
    setChecks(null);
    const newChecks = {}; let wifiOk = true, geoOk = true;
    try {
      setLoading(true);
      if (needsWifi) {
        const w = await checkWifiApi({ sessionId: Number(sessionId), studentPublicIp: ip || "" });
        if (w.ok) newChecks.WIFI = { ok: true, ...w.data }; else { newChecks.WIFI = { ok: false, ...w.error }; wifiOk = false; }
      }
      if (needsGeo) {
        const g = await checkGeoApi({ sessionId: Number(sessionId), studentLat: Number(lat), studentLng: Number(lng) });
        if (g.ok) newChecks.GEO = { ok: true, ...g.data }; else { newChecks.GEO = { ok: false, ...g.error }; geoOk = false; }
      }
      setChecks(newChecks);
      if ((needsWifi ? wifiOk : true) && (needsGeo ? geoOk : true)) {
        setOk("Wi-Fi & Geolocation verified.");
        advanceOrCommit(STEP.WIFI_GEO);
      } else {
        setErr("One or more checks failed. Please review.");
      }
    } catch (e) {
      setErr(e.message || "Check failed");
    } finally { setLoading(false); }
  };
  
  const runFaceCheck = async () => {
    setChecks(null);
    try {
      setLoading(true);
      const r = await checkFaceApi(Number(sessionId), selfieFile);
      if (r.ok) {
        setChecks({ FACE: { ok: true, ...r.data } });
        setOk("Face verified successfully.");
        advanceOrCommit(STEP.FACE);
      } else {
        setChecks({ FACE: { ok: false, ...r.error } });
        setErr("Face did not match. Please try again.");
      }
    } catch (e) {
      setErr(e.message || "Face check failed");
    } finally { setLoading(false); }
  };

  const runQrCheckThenCommit = async () => {
    setChecks(null);
    try {
      setLoading(true);
      const r = await checkQrApi({ sessionId: Number(sessionId), qrToken: qrToken || "" });
      if (r.ok) {
        setChecks({ QR: { ok: true, ...r.data } });
        setOk("QR code verified.");
        await commit();
      } else {
        setChecks({ QR: { ok: false, ...r.error } });
        setErr("QR code is invalid or has expired.");
      }
    } catch (e) {
      setErr(e.message || "QR check failed");
    } finally { setLoading(false); }
  };

  const dynamicStyles = {
    header: { ...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0' },
    gridContainer: { ...styles.gridContainer, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' },
    gridContainer2: { ...styles.gridContainer, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' },
  };

  const onLogout = () => {
    localStorage.removeItem("attendance:studentUser");
    localStorage.removeItem("attendance:studentPass");
    nav("/login", { replace: true });
  }

  return (
    <>
      <GlobalStyles />
      <div style={styles.page}>
        <div style={styles.backgroundBlob}></div>
        <div style={styles.container}>
          <header style={dynamicStyles.header}>
            <h1 style={styles.title}>Mark Attendance</h1>
            <div style={styles.headerActions}>
              <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => nav("/student")}><FaArrowLeft /> Dashboard</StyleButton>
              <StyleButton baseStyle={styles.btnDanger} hoverStyle={styles.btnDangerHover} onClick={onLogout}><FaSignOutAlt /> Logout</StyleButton>
            </div>
          </header>

          <StudentPasswordBar />
          
          <Stepper currentStep={step} flow={flow} />

          {checks && <ChecksBreakdown checks={checks} />}
          
          {err && <p style={styles.errorBox}><FaExclamationTriangle/> {err}</p>}
          {ok && <p style={styles.successBox}><FaCheckCircle/> {ok}</p>}

          {step === STEP.PICK_SESSION && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Enter Session ID</h2>
              <p style={styles.infoText}>Please enter the numeric Session ID provided by your instructor to begin.</p>
              <Field label="Session ID">
                <StyledInput type="text" inputMode="numeric" placeholder="e.g., 123456" value={sessionId} onChange={(e) => setSessionId(e.target.value.replace(/\D/g,""))} />
              </Field>
              <div style={styles.buttonGroup}>
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={loadMeta} disabled={!sessionId || loading}>{loading ? <FaSpinner className="spinner" /> : 'Load Session'}</StyleButton>
              </div>
            </div>
          )}

          {step === STEP.WIFI_GEO && (
             <div style={styles.card}>
             <h2 style={styles.sectionTitle}>Environment Verification</h2>
             <p style={styles.infoText}>Your public IP address and geolocation are being collected for verification.</p>
             <div style={dynamicStyles.gridContainer}>
               <Field label="Public IP Address"><div style={styles.inputGroup}><StyledInput value={ip} readOnly /><StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={refreshIp}><FaSyncAlt /></StyleButton></div></Field>
               <Field label="Latitude"><StyledInput value={lat} readOnly /></Field>
               <Field label="Longitude"><div style={styles.inputGroup}><StyledInput value={lng} readOnly /><StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={getLoc}><FaMapPin /></StyleButton></div></Field>
             </div>
             <div style={{...styles.infoText, marginTop: '16px', fontSize: '13px' }}>{geoMsg}</div>
             <div style={styles.buttonGroup}>
               <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={()=>setStep(STEP.PICK_SESSION)}>Back</StyleButton>
               <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={runWifiGeoChecks} disabled={!canContinueWifi || loading}>{loading ? <FaSpinner className='spinner'/> : 'Verify Environment'}</StyleButton>
             </div>
           </div>
          )}

          {step === STEP.FACE && (
             <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Face Verification</h2>
              <p style={styles.infoText}>Please capture a clear, forward-facing selfie for verification.</p>

              {!camOn && !selfieFile && (<StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={startCamera}><FaCamera /> Start Camera</StyleButton>)}
              {camMsg && <div style={{...styles.infoText, minHeight: '18px', margin: '16px 0 8px 0'}}>{camMsg}</div>}
              <video ref={videoRef} autoPlay muted playsInline style={{...styles.videoPlayer, display: camOn ? "block" : "none" }}/>

              {camOn && (<div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}><StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={captureSelfie}><FaCamera /> Capture</StyleButton><StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={stopCamera}>Stop</StyleButton></div>)}
              {selfieFile && (<div style={styles.selfieInfo}><FaCheckCircle style={{ color: 'var(--success-color)' }} /><span>Selfie captured successfully.</span><StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={() => {setSelfieFile(null); if (selfiePreview) URL.revokeObjectURL(selfiePreview); setSelfiePreview("");}}><FaRetweet /> Retake</StyleButton></div>)}
              {selfiePreview && <img src={selfiePreview} alt="selfie preview" style={styles.selfiePreview} />}

              <div style={styles.buttonGroup}>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={()=>setStep(orderedSteps[orderedSteps.indexOf(STEP.FACE) - 1] ?? STEP.PICK_SESSION)}>Back</StyleButton>
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={runFaceCheck} disabled={!selfieFile || loading}>{loading ? <FaSpinner className='spinner'/> : 'Verify Face'}</StyleButton>
              </div>
           </div>
          )}
          
          {step === STEP.QR && (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>QR Code Scan</h2>
              <p style={styles.infoText}>Scan the QR code from the presenter's screen, or paste the token manually.</p>
              <div style={dynamicStyles.gridContainer2}>
                <Field label="QR Token"><StyledInput placeholder="Paste token here if needed" value={qrToken} onChange={(e)=>setQrToken(e.target.value)}/></Field>
                <Field label="Scanner">
                    <div style={{...styles.inputGroup, marginTop: isMobile ? '0' : '26px'}}>
                        <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={() => { setScanErr(''); setScanning(true); }} disabled={scanning}>
                            <FaQrcode/> Scan Now
                        </StyleButton>
                        {scanning && (
                            <>
                                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={handleSwitchCamera}>
                                    <FaRetweet /> Switch
                                </StyleButton>
                                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={stopQr}>
                                    Stop
                                </StyleButton>
                            </>
                        )}
                    </div>
                </Field>
              </div>
              
              {scanErr && <p style={{...styles.errorBox, marginTop: '24px'}}><FaExclamationTriangle/> {scanErr}</p>}
              {scanning && <video ref={qrVideoRef} autoPlay muted playsInline style={{...styles.videoPlayer, marginTop: '16px'}} />}

              <div style={styles.buttonGroup}>
                <StyleButton baseStyle={styles.btnSecondary} hoverStyle={styles.btnSecondaryHover} onClick={()=>setStep(orderedSteps[orderedSteps.indexOf(STEP.QR) - 1] ?? STEP.PICK_SESSION)}>Back</StyleButton>
                <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={runQrCheckThenCommit} disabled={loading || !qrToken}>{loading ? <FaSpinner className='spinner' /> : 'Verify & Submit'}</StyleButton>
              </div>
            </div>
          )}

          {step === STEP.DONE && (
            <div style={styles.card}>
                <div style={{textAlign: 'center', padding: '32px 0'}}>
                    <FaCheckDouble size={48} style={{ color: 'var(--success-color)', marginBottom: '24px'}} />
                    <h2 style={styles.sectionTitle}>Attendance Marked</h2>
                    <p style={styles.infoText}>Your attendance has been successfully recorded. You can now safely close this page or return to the dashboard.</p>
                    <div style={{...styles.buttonGroup, justifyContent: 'center'}}>
                        <StyleButton baseStyle={styles.btnPrimary} hoverStyle={styles.btnPrimaryHover} onClick={() => nav('/student')}>Return to Dashboard</StyleButton>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}