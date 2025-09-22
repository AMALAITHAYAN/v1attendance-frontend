import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentUser, setStudentPass } from "../utils/studentAuth";
import StudentPasswordBar from "./StudentPasswordBar";
import { getMySummary, getMyLogs } from "../api/reportsApi";

/* date helpers */
const now = () => new Date();
const minusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
/* For <input type="datetime-local"> we want yyyy-MM-ddTHH:mm (no timezone) */
function toLocalInput(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  const pad = (x) => String(x).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function StudentReportsPage() {
  const nav = useNavigate();
  const user = getStudentUser();
  useEffect(() => {
    if (!user) nav("/login", { replace: true });
  }, [user, nav]);

  // default: last 30 days
  const [from, setFrom] = useState(toLocalInput(minusDays(30)));
  const [to, setTo] = useState(toLocalInput(now()));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);

  const pct = useMemo(() => summary?.percentage ?? 0, [summary]);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        getMySummary({ from, to }),
        getMyLogs({ from, to }),
      ]);
      setSummary(s);
      setLogs(l);
    } catch (e) {
      setErr(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []); // auto-load first time

  const logout = () => {
    localStorage.removeItem("attendance:studentUser");
    setStudentPass(null);
    nav("/login", { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.head}>
          <h1 style={styles.title}>My Reports</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.btnGhost} onClick={() => nav("/student")}>
              ← Dashboard
            </button>
            <button style={styles.btnDanger} onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <StudentPasswordBar />

        {/* Filters */}
        <div style={styles.card}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto auto auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <Field label="From">
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={styles.input}
              />
            </Field>
            <Field label="To">
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={styles.input}
              />
            </Field>
            <button
              style={styles.btnGhost}
              onClick={() => {
                setFrom(toLocalInput(minusDays(1)));
                setTo(toLocalInput(now()));
              }}
            >
              1d
            </button>
            <button
              style={styles.btnGhost}
              onClick={() => {
                setFrom(toLocalInput(minusDays(7)));
                setTo(toLocalInput(now()));
              }}
            >
              7d
            </button>
            <button
              style={styles.btnPrimary}
              onClick={load}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load"}
            </button>
          </div>
        </div>

        {err && <p style={styles.errorBox}>{err}</p>}

        {/* Summary */}
        <div style={styles.card}>
          <div style={styles.lbl}>Summary</div>
          {summary ? (
            <>
              <div style={styles.kpis}>
                <KPI label="Present" value={summary.present} />
                <KPI label="Total Sessions" value={summary.total} />
                <KPI label="Percentage" value={`${pct}%`} />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={styles.lbl}>By Subject</div>
                {summary.bySubject?.length ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Present</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.bySubject.map((r) => (
                        <tr key={r.subject}>
                          <td style={styles.td}>{r.subject}</td>
                          <td style={styles.tdNum}>{r.present}</td>
                          <td style={styles.tdNum}>{r.total}</td>
                          <td style={styles.tdNum}>{r.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "#a0a0b0", margin: 0 }}>
                    No subjects in this range.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: "#a0a0b0", margin: 0 }}>No data yet.</p>
          )}
        </div>

        {/* Logs */}
        <div style={styles.card}>
          <div style={styles.lbl}>Logs</div>
          {logs.length ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>When</th>
                  <th style={styles.th}>Session</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>WIFI</th>
                  <th style={styles.th}>GEO</th>
                  <th style={styles.th}>FACE</th>
                  <th style={styles.th}>QR</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((x) => (
                  <tr key={x.attendanceId}>
                    <td style={styles.td}>
                      {new Date(x.markedAt).toLocaleString()}
                    </td>
                    <td style={styles.tdNum}>{x.sessionId}</td>
                    <td style={styles.td}>{x.subject}</td>
                    <td style={styles.td}>{x.success ? "✅" : "❌"}</td>
                    <td style={styles.td}>{boolDot(x.wifiOk)}</td>
                    <td style={styles.td}>{boolDot(x.geoOk)}</td>
                    <td style={styles.td}>{boolDot(x.faceOk)}</td>
                    <td style={styles.td}>{boolDot(x.qrOk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#a0a0b0", margin: 0 }}>
              No logs in this range.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* small components */
function Field({ label, children }) {
  return (
    <div>
      <div style={styles.lbl}>{label}</div>
      {children}
    </div>
  );
}
function KPI({ label, value }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ fontSize: 12, color: "#a0a0b0" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
const boolDot = (v) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: 999,
      background: v ? "#22c55e" : "#ef4444",
    }}
  />
);

/* Celestial Slate Design System */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#101014",
    color: "#f0f0f0",
    padding: 24,
    fontFamily: "Inter, sans-serif",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: "-0.025em",
  },
  card: {
    background: "#1a1a21",
    border: "1px solid #2d3748",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 22px rgba(0,0,0,.35)",
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
  },
  input: {
    width: "100%",
    height: 40,
    background: "#101014",
    border: "1px solid #2d3748",
    color: "#f0f0f0",
    borderRadius: 10,
    padding: "0 10px",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#6366f1",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #2d3748",
    background: "transparent",
    color: "#a0a0b0",
    cursor: "pointer",
  },
  btnDanger: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #7f1d1d",
    background: "#450a0a",
    color: "#fecaca",
    cursor: "pointer",
  },
  lbl: {
    display: "block",
    fontSize: 13,
    color: "#a0a0b0",
    marginBottom: 6,
  },
  errorBox: {
    background: "#7f1d1d",
    color: "#fecaca",
    padding: "8px 10px",
    borderRadius: 10,
    marginBottom: 8,
    fontSize: 13,
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 6,
  },
  kpiCard: {
    background: "#101014",
    border: "1px solid #2d3748",
    borderRadius: 12,
    padding: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #2d3748",
    padding: "8px 6px",
    color: "#a0a0b0",
    fontWeight: 600,
  },
  td: {
    padding: "8px 6px",
    borderBottom: "1px solid #2d3748",
  },
  tdNum: {
    padding: "8px 6px",
    borderBottom: "1px solid #2d3748",
    textAlign: "right",
  },
};