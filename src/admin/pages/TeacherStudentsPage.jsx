import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import TeacherPasswordBar from "./TeacherPasswordBar";

import {
  listClasses,
  createClass as createClassApi,
  getClassRoster,
} from "../api/classesApi";
import {
  createStudentInClass,
  bulkUploadStudents,
  downloadTemplate,
} from "../api/studentsApi";


export default function TeacherStudentsPage() {
  const navigate = useNavigate();

  /* ---------- class state ---------- */
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(
    () => classes.find((c) => String(c.id) === String(selectedId)) || null,
    [classes, selectedId]
  );

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({
    year: "",
    department: "",
    section: "",
    block: "",
    name: "",
  });

  /* ---------- roster ---------- */
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  /* ---------- single student ---------- */
  const [single, setSingle] = useState({
    username: "",
    name: "",
    rollNo: "",
    password: "1234",
  });
  const [photo, setPhoto] = useState(null);

  /* ---------- bulk ---------- */
  const [xlsx, setXlsx] = useState(null);

  /* ---------- ui ---------- */
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  /* ---------- helpers ---------- */
  const toErrText = (e) => {
    if (!e) return "Request failed";
    if (typeof e === "string") return e;
    const data = e?.response?.data ?? e?.data;
    if (data) {
      if (typeof data === "string") return data;
      if (data.message) return data.message;
      try { return JSON.stringify(data); } catch {}
    }
    return e.message || "Request failed";
  };

  const onSingleChange = (e) => {
    const { name, value } = e.target;
    setSingle((s) => ({ ...s, [name]: value }));
  };
  const onNewClassChange = (e) => {
    const { name, value } = e.target;
    setNewClass((s) => ({ ...s, [name]: value }));
  };

  /* ---------- effects ---------- */
  const refreshClasses = useCallback(async () => {
    try {
      const list = await listClasses();
      setClasses(list || []);
      if (!selectedId && list?.length) setSelectedId(String(list[0].id));
    } catch (e) {
      setErr(toErrText(e));
    }
  }, [selectedId]);

  useEffect(() => { refreshClasses(); }, [refreshClasses]);

  useEffect(() => {
    if (!selectedId) { setRoster([]); return; }
    (async () => {
      try {
        setLoadingRoster(true);
        const r = await getClassRoster(selectedId);
        setRoster(Array.isArray(r) ? r : []);
      } catch (e) {
        setErr(toErrText(e));
      } finally {
        setLoadingRoster(false);
      }
    })();
  }, [selectedId]);

  /* ---------- actions ---------- */
  const handleCreateClass = async () => {
    setOk(""); setErr("");
    const { year, department, section, block, name } = newClass;
    if (!year || !department || !section || !block || !name) {
      setErr("Fill all class fields (Year, Department, Section, Block, Name).");
      return;
    }
    try {
      setLoading(true);
      const created = await createClassApi({
        year: String(year).trim(),
        department: department.trim(),
        section: section.trim(),
        block: block.trim(),
        name: name.trim(),
      });
      setOk(`Class created: ${created?.name || ""}`);
      setShowCreateClass(false);
      setNewClass({ year: "", department: "", section: "", block: "", name: "" });
      await refreshClasses();
      setSelectedId(String(created.id));
    } catch (e) {
      setErr(toErrText(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    setOk(""); setErr("");
    if (!selectedId) { setErr("Select a class first."); return; }
    const { username, name, rollNo } = single;
    if (!username || !name || !rollNo) {
      setErr("Please fill Username, Name and Roll No.");
      return;
    }
    try {
      setLoading(true);
      await createStudentInClass(
        selectedId,
        {
          username: username.trim(),
          name: name.trim(),
          rollNo: rollNo.trim(),
          password: (single.password || "1234").trim(),
        },
        photo
      );
      const withPhoto = !!(photo && photo.size > 0);
      setOk(withPhoto
        ? "Student created in class. Face registration requested."
        : "Student created in class.");
      setSingle({ username: "", name: "", rollNo: "", password: "1234" });
      setPhoto(null);
      // refresh roster view
      const r = await getClassRoster(selectedId);
      setRoster(Array.isArray(r) ? r : []);
    } catch (e) {
      setErr(toErrText(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async () => {
    setOk(""); setErr("");
    if (!xlsx) { setErr("Please choose a .xlsx file"); return; }
    try {
      setLoading(true);
      const res = await bulkUploadStudents(xlsx);
      setOk(
        `Uploaded. Created: ${res?.createdCount ?? 0}. ${
          res?.skippedCount ? `Skipped: ${res.skippedCount}.` : ""
        }`
      );
      setXlsx(null);
      // Bulk uses legacy columns (year/department/className) inside the sheet.
      // You can re-download roster after upload:
      if (selectedId) {
        const r = await getClassRoster(selectedId);
        setRoster(Array.isArray(r) ? r : []);
      }
    } catch (e) {
      setErr(toErrText(e));
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("attendance:user");
    localStorage.removeItem("attendance:lastRole");
    navigate("/login", { replace: true });
  }, [navigate]);

  /* ---------- render ---------- */
  return (
    <div style={page}>
      {/* Alignment + mobile fixes */}
      <style>{responsiveCss}</style>

      <div style={wrap} className="cs-wrap">
        <div style={head} className="cs-head">
          <h1 style={title} className="cs-title">Students (Roster)</h1>
          <div className="cs-actions">
            <Link to="/admin" style={btnGhost} className="btn" role="button">← Dashboard</Link>
            <button type="button" style={btnDanger} className="btn" onClick={logout}>Logout</button>
          </div>
        </div>

        <TeacherPasswordBar />

        {/* ---------- Class selector / creator ---------- */}
        <div style={card} className="cs-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={badge}>Class</div>
            <div className="cs-row" style={{ gap: 8 }}>
              <button
                type="button"
                style={btnGhost}
                className="btn"
                onClick={() => refreshClasses()}
                title="Refresh class list"
              >
                Refresh
              </button>
              <button
                type="button"
                style={btnPrimary}
                className="btn"
                onClick={() => setShowCreateClass((v) => !v)}
              >
                {showCreateClass ? "Close" : "New Class"}
              </button>
            </div>
          </div>

          {err && <p style={errorBox}>{String(err)}</p>}
          {ok && <p style={okBox}>{ok}</p>}

          <div className="cs-grid2" style={{ marginBottom: 10 }}>
            <Field label="Select a Class">
              <select
                style={{ ...input, height: 42 }}
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
              >
                {!classes.length && <option value="">No classes yet</option>}
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {`Y${c.year} ${c.department} • Sec ${c.section} • Block ${c.block} • ${c.name}`}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Details">
              <div style={{ ...input, height: "auto", padding: "8px 12px" }}>
                {selected
                  ? <>
                      <b>{selected.name}</b> — Year {selected.year}, {selected.department},
                      Section {selected.section}, Block {selected.block}
                    </>
                  : <span style={{ color: cs.textMuted }}>Choose a class to add students</span>
                }
              </div>
            </Field>
          </div>

          {/* Create class inline */}
          {showCreateClass && (
            <div className="cs-grid2" style={{ marginTop: 8 }}>
              <Field label="Year *">
                <input name="year" style={input} value={newClass.year} onChange={onNewClassChange} placeholder="2" />
              </Field>
              <Field label="Department *">
                <input name="department" style={input} value={newClass.department} onChange={onNewClassChange} placeholder="CSE" />
              </Field>
              <Field label="Section *">
                <input name="section" style={input} value={newClass.section} onChange={onNewClassChange} placeholder="A" />
              </Field>
              <Field label="Block *">
                <input name="block" style={input} value={newClass.block} onChange={onNewClassChange} placeholder="B" />
              </Field>
              <Field label="Class Name *">
                <input name="name" style={input} value={newClass.name} onChange={onNewClassChange} placeholder="CS-A" />
              </Field>
              <div />
              <div style={{ marginTop: 6 }} className="cs-row">
                <button
                  type="button"
                  style={loading ? { ...btnPrimary, opacity: 0.6, cursor: "not-allowed" } : btnPrimary}
                  className="btn"
                  onClick={handleCreateClass}
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Create Class"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Single student (in selected class) ---------- */}
        <div style={card} className="cs-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={badge}>Create Student</div>
            <div style={{ fontSize: 12, color: cs.textMuted }}>
              Added to the <b>selected class</b>. If you attach a photo, the backend will also register their face.
            </div>
          </div>

          <div className="cs-grid2">
            <Field label="Username (email) *">
              <input
                name="username"
                style={input}
                className="cs-input"
                value={single.username}
                onChange={onSingleChange}
                placeholder="jane@college.edu"
                autoComplete="off"
              />
            </Field>
            <Field label="Name *">
              <input
                name="name"
                style={input}
                className="cs-input"
                value={single.name}
                onChange={onSingleChange}
                placeholder="Jane Doe"
                autoComplete="off"
              />
            </Field>

            <Field label="Roll No *">
              <input
                name="rollNo"
                style={input}
                className="cs-input"
                value={single.rollNo}
                onChange={onSingleChange}
                placeholder="22CS001"
                autoComplete="off"
              />
            </Field>
            <Field label="Password (temp)">
              <input
                name="password"
                style={input}
                className="cs-input"
                value={single.password}
                onChange={onSingleChange}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Photo (optional)">
              <input
                type="file"
                accept="image/*"
                style={inputFile}
                className="cs-file"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
              {!!photo && (
                <div style={{ marginTop: 6, fontSize: 12, color: cs.textMuted, wordBreak: "break-word" }}>
                  Selected: <b>{photo.name}</b> ({Math.round(photo.size / 1024)} KB)
                </div>
              )}
            </Field>
          </div>

          <div style={{ marginTop: 10 }} className="cs-row">
            <button
              type="button"
              style={loading ? { ...btnPrimary, opacity: 0.6, cursor: "not-allowed", boxShadow: "none" } : btnPrimary}
              className="btn"
              onClick={handleCreateStudent}
              disabled={loading}
            >
              {loading ? "Saving…" : "Create Student in Class"}
            </button>
          </div>
        </div>

        {/* ---------- Roster (read-only) ---------- */}
        <div style={card} className="cs-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={badge}>Roster</div>
            <div style={{ fontSize: 12, color: cs.textMuted }}>
              {selected ? <>Class <b>{selected.name}</b> — {roster.length} student(s)</> : "Select a class"}
            </div>
          </div>

          {loadingRoster ? (
            <div style={{ color: cs.textMuted }}>Loading roster…</div>
          ) : !selected ? (
            <div style={{ color: cs.textMuted }}>No class selected.</div>
          ) : roster.length === 0 ? (
            <div style={{ color: cs.textMuted }}>No students yet. Add one above.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Roll No</th>
                    <th style={th}>Name</th>
                    <th style={th}>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s, i) => (
                    <tr key={s.id || i}>
                      <td style={td}>{i + 1}</td>
                      <td style={tdMono}>{s.rollNo}</td>
                      <td style={td}>{s.name}</td>
                      <td style={tdMono}>{s.user?.username || s.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ---------- Bulk upload (legacy sheet columns) ---------- */}
        <div style={card} className="cs-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={badge}>Bulk</div>
            <div style={{ fontSize: 12, color: cs.textMuted }}>
              Excel (.xlsx) columns: <code>username</code>, <code>name</code>, <code>rollNo</code>,
              <code>className</code>, <code>year</code>, <code>department</code>. Optional:
              <code>password</code>, <code>photoBase64</code>.
            </div>
          </div>

          <div className="cs-row">
            <input
              type="file"
              accept=".xlsx"
              style={inputFile}
              className="cs-file"
              onChange={(e) => setXlsx(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              style={(!xlsx || loading) ? { ...btnGhost, opacity: 0.6, cursor: "not-allowed" } : btnGhost}
              className="btn"
              onClick={handleBulk}
              disabled={loading || !xlsx}
            >
              {loading ? "Uploading…" : "Upload"}
            </button>
            <button type="button" style={btnGhost} className="btn" onClick={downloadTemplate}>
              Download Template (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={lbl}>{label}</div>
      {children}
    </div>
  );
}

/* ——— Celestial Slate tokens ——— */
const cs = {
  pageGradient:
    "radial-gradient(800px 400px at 10% 0%, rgba(56,189,248,.08), transparent 40%), radial-gradient(800px 400px at 90% 10%, rgba(139,92,246,.08), transparent 40%), linear-gradient(180deg, #070b12 0%, #0b1220 35%, #0a1528 100%)",
  text: "#E6EDF7",
  textMuted: "#9FB0C3",
  surface: "#0d1526",
  surfaceElev: "#101b31",
  border: "#21324a",
  borderSoft: "#1a2740",
  primary: "#7dd3fc",
  primaryDeep: "#60a5fa",
  focus: "#38bdf8",
  dangerBg: "#2a1012",
  dangerBorder: "#7f1d1d",
  dangerText: "#fecaca",
  okBg: "#0b3b18",
  okBorder: "#14532d",
  okText: "#bbf7d0",
};

/* —— responsive CSS (kept from your original) —— */
const responsiveCss = `
  .cs-wrap, .cs-card { box-sizing: border-box; }
  .btn, .cs-input, .cs-file { max-width: 100%; box-sizing: border-box; }
  .cs-wrap { padding-left: 16px; padding-right: 16px; }
  @media (max-width: 480px) { .cs-wrap { padding-left: 12px; padding-right: 12px; } }
  .cs-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .cs-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .cs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cs-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .btn { display: inline-block; }
  @media (max-width: 768px) {
    .cs-head { flex-direction: column; align-items: flex-start; }
    .cs-title { font-size: 22px !important; }
    .cs-grid2 { grid-template-columns: 1fr; gap: 10px; }
    .cs-card { padding: 14px !important; }
    .cs-row .btn { flex: 1 1 auto; }
  }
  @media (max-width: 480px) {
    .cs-title { font-size: 20px !important; }
    .cs-input, .cs-file { height: 38px !important; }
    .cs-actions .btn { width: 100%; }
    .cs-row { flex-direction: column; align-items: stretch; }
    .cs-row .btn { width: 100%; }
    .cs-card { padding: 12px !important; }
  }
`;

/* ——— styles ——— */
const page   = {
  minHeight: "100vh",
  background: cs.pageGradient,
  color: cs.text,
  padding: 24,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
};
const wrap   = { maxWidth: 1100, margin: "0 auto" };
const head   = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const title  = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  backgroundImage: "linear-gradient(90deg, #93c5fd, #a78bfa, #67e8f9)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  letterSpacing: 0.2,
};
const card   = {
  background: `linear-gradient(180deg, ${cs.surface} 0%, ${cs.surfaceElev} 100%)`,
  border: `1px solid ${cs.border}`,
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 30px rgba(4,10,20,.5), inset 0 1px 0 rgba(255,255,255,.03)",
  marginBottom: 14,
  backdropFilter: "blur(6px)",
};
const badge  = {
  display: "inline-block",
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 999,
  background: "linear-gradient(180deg, #0f1b2d, #0b1424)",
  border: `1px solid ${cs.border}`,
  color: cs.textMuted,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};
const lbl    = { display: "block", fontSize: 12, color: cs.textMuted, marginBottom: 6, letterSpacing: 0.2 };

const input  = {
  width: "100%",
  height: 40,
  background: "linear-gradient(180deg, #09111f, #0a1322)",
  border: `1px solid ${cs.border}`,
  color: cs.text,
  borderRadius: 12,
  padding: "0 12px",
  outline: "none",
  boxShadow: "inset 0 2px 12px rgba(0,0,0,.35)",
};
const inputFile = { ...input, paddingTop: 8 };

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: `1px solid ${cs.borderSoft}`,
  fontSize: 12,
  color: cs.textMuted,
};
const td = {
  padding: "8px 10px",
  borderBottom: `1px solid ${cs.borderSoft}`,
  fontSize: 14,
};
const tdMono = { ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" };

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${cs.border}`,
  background: `linear-gradient(180deg, ${cs.primary} 0%, ${cs.primaryDeep} 100%)`,
  color: "#06111f",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 0 0 1px rgba(125,211,252,.25), 0 8px 24px rgba(56,189,248,.35), inset 0 -2px 8px rgba(255,255,255,.25)",
};

const btnGhost   = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${cs.border}`,
  background: `linear-gradient(180deg, #0b1424, #0a1220)`,
  color: cs.text,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04), 0 4px 14px rgba(0,0,0,.35)",
};

const btnDanger  = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${cs.dangerBorder}`,
  background: "linear-gradient(180deg, #3d0f14, #2a0b0f)",
  color: cs.dangerText,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(127,29,29,.35)",
};

const errorBox = {
  background: cs.dangerBg,
  color: cs.dangerText,
  padding: "8px 10px",
  borderRadius: 12,
  marginBottom: 8,
  fontSize: 13,
  border: `1px solid ${cs.dangerBorder}`,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};
const okBox    = {
  background: cs.okBg,
  border: `1px solid ${cs.okBorder}`,
  color: cs.okText,
  padding: "8px 10px",
  borderRadius: 12,
  marginBottom: 8,
  fontSize: 13,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};
