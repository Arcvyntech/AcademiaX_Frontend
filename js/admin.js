// ─── admin.js  (shared core — load this FIRST on every admin page) ───────────

const A = document.getElementById("alert");
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

const api = (path, method = "GET", body) =>
  apiFetch("/admin" + path, { method, body, auth: true });

// caches used across tabs
let cache = { designations: [], subjects: [], classes: [], staff: [] };

function fail(e) { showAlert(A, e.message || "Something went wrong"); }
function ok(msg) { showAlert(A, msg, "success"); setTimeout(() => hideAlert(A), 1500); }

/* ---------- auth guard + boot ---------- */
(async () => {
  if (!localStorage.getItem("ax_token")) { location.href = "login.html"; return; }
  try {
    const p = await apiFetch("/institution/profile", { auth: true });
    $("instCode").textContent = "Code: " + p.institution.code;
  } catch {
    localStorage.removeItem("ax_token");
    location.href = "login.html";
    return;
  }
  loadDesignations();
})();

/* ---------- tabs ---------- */
document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("p-" + b.dataset.tab).classList.add("active");
    ({
      designations: loadDesignations,
      subjects:     loadSubjects,
      classes:      loadClasses,
      staff:        loadStaff,
      students:     loadStudents,
      hierarchy:    loadHierarchy,
      credentials:  loadCredentials,
    }[b.dataset.tab] || (() => {}))();
  });
});
// URL hash se tab auto-open karo
(function openTabFromHash() {
  const hash = location.hash.replace("#", ""); // e.g. "classes"
  if (!hash) return;

  const btn = document.querySelector(`.tabs button[data-tab="${hash}"]`);
  if (!btn) return;

  // sabhi tabs band karo
  document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));

  // selected tab kholo
  btn.classList.add("active");
  document.getElementById("p-" + hash).classList.add("active");

  // us tab ka data load karo
  ({
    designations: loadDesignations,
    subjects:     loadSubjects,
    classes:      loadClasses,
    staff:        loadStaff,
    students:     loadStudents,
    hierarchy:    loadHierarchy,
    credentials:  loadCredentials,
  }[hash] || (() => {}))();
})();