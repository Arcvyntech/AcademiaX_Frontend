// AcademiaX admin console (functional, plain — restyle freely).
const A = document.getElementById("alert");
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const api = (path, method = "GET", body) => apiFetch("/admin" + path, { method, body, auth: true });

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
  } catch { localStorage.removeItem("ax_token"); location.href = "login.html"; return; }
  loadDesignations();
})();

/* ---------- tabs ---------- */
document.querySelectorAll(".tabs button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $("p-" + b.dataset.tab).classList.add("active");
    ({ designations: loadDesignations, subjects: loadSubjects, classes: loadClasses, staff: loadStaff, students: loadStudents, hierarchy: loadHierarchy, credentials: loadCredentials }[b.dataset.tab] || (() => {}))();
  });
});

/* ---------- Designations ---------- */
async function loadDesignations() {
  try {
    const { data } = await api("/designations");
    cache.designations = data;
    $("d-body").innerHTML = data.length ? data.map((d) => `
      <tr><td>${esc(d.name)}</td><td>${d.staffCount}</td>
      <td><input type="number" min="1" max="10" value="${d.level ?? ""}" style="width:60px" onchange="setLevel('${d._id}', this.value)"/></td>
      <td><button class="btn-sm danger" onclick="delDesig('${d._id}')">Delete</button></td></tr>`).join("") : `<tr><td colspan="4" class="empty">No designations yet.</td></tr>`;
  } catch (e) { fail(e); }
}
$("d-add").onclick = async () => {
  const name = $("d-name").value.trim(); if (!name) return;
  try { await api("/designations", "POST", { name }); $("d-name").value = ""; ok("Added"); loadDesignations(); } catch (e) { fail(e); }
};
window.delDesig = async (id) => { try { await api("/designations/" + id, "DELETE"); loadDesignations(); } catch (e) { fail(e); } };
window.setLevel = async (id, level) => { try { await api("/designations/" + id + "/level", "PUT", { level: Number(level) || null }); ok("Level saved"); } catch (e) { fail(e); } };

/* ---------- Subjects ---------- */
async function loadSubjects() {
  try {
    const { data } = await api("/subjects");
    cache.subjects = data;
    $("s-body").innerHTML = data.length ? data.map((s) => `<tr><td>${esc(s.name)}</td><td><button class="btn-sm danger" onclick="delSub('${s._id}')">Delete</button></td></tr>`).join("") : `<tr><td colspan="2" class="empty">No subjects yet.</td></tr>`;
  } catch (e) { fail(e); }
}
$("s-add").onclick = async () => { const name = $("s-name").value.trim(); if (!name) return; try { await api("/subjects", "POST", { name }); $("s-name").value = ""; ok("Added"); loadSubjects(); } catch (e) { fail(e); } };
window.delSub = async (id) => { try { await api("/subjects/" + id, "DELETE"); loadSubjects(); } catch (e) { fail(e); } };

/* ---------- Classes (+ subject mapping) ---------- */
async function loadClasses() {
  try {
    if (!cache.subjects.length) cache.subjects = (await api("/subjects")).data;
    const { data } = await api("/classes");
    cache.classes = data;
    $("c-body").innerHTML = data.length ? data.map((c) => {
      const assigned = (c.subjectIds || []).map((s) => s._id);
      const opts = cache.subjects.map((s) => `<label><input type="checkbox" value="${s._id}" ${assigned.includes(s._id) ? "checked" : ""}/> ${esc(s.name)}</label>`).join("") || `<span class="empty">Add subjects first</span>`;
      return `<tr><td>${esc(c.name)}${c.nickname ? ` <span class="chip">${esc(c.nickname)}</span>` : ""}</td>
        <td>${c.studentCount}</td>
        <td><div class="multi" id="cs-${c._id}">${opts}</div><button class="btn-sm primary" style="margin-top:6px" onclick="saveClassSubjects('${c._id}')">Save subjects</button></td>
        <td><button class="btn-sm danger" onclick="delClass('${c._id}')">Delete</button></td></tr>`;
    }).join("") : `<tr><td colspan="4" class="empty">No classes yet.</td></tr>`;
  } catch (e) { fail(e); }
}
$("c-add").onclick = async () => { const name = $("c-name").value.trim(); if (!name) return; try { await api("/classes", "POST", { name, nickname: $("c-nick").value.trim() }); $("c-name").value = ""; $("c-nick").value = ""; ok("Added"); loadClasses(); } catch (e) { fail(e); } };
window.delClass = async (id) => { try { await api("/classes/" + id, "DELETE"); loadClasses(); } catch (e) { fail(e); } };
window.saveClassSubjects = async (id) => {
  const ids = Array.from(document.querySelectorAll(`#cs-${id} input:checked`)).map((i) => i.value);
  try { await api("/classes/" + id + "/subjects", "PUT", { subjectIds: ids }); ok("Subjects saved"); loadClasses(); } catch (e) { fail(e); }
};

/* ---------- Staff (+ class mapping) ---------- */
async function loadStaff() {
  try {
    cache.designations = (await api("/designations")).data;
    cache.classes = (await api("/classes")).data;
    $("st-desig").innerHTML = `<option value="">— none —</option>` + cache.designations.map((d) => `<option value="${d._id}">${esc(d.name)}</option>`).join("");
    const { data } = await api("/staff");
    cache.staff = data;
    $("st-body").innerHTML = data.length ? data.map((s) => {
      const assigned = (s.assignedClassIds || []).map((c) => c._id);
      const classOpts = cache.classes.map((c) => `<label><input type="checkbox" value="${c._id}" ${assigned.includes(c._id) ? "checked" : ""}/> ${esc(c.name)}</label>`).join("") || `<span class="empty">Add classes first</span>`;
      const desigOpts = `<option value="">— none —</option>` + cache.designations.map((d) => `<option value="${d._id}" ${s.designationId && s.designationId._id === d._id ? "selected" : ""}>${esc(d.name)}</option>`).join("");
      return `<tr><td>${esc(s.name)}</td><td>${esc(s.mobileNo)}</td>
        <td><select id="sd-${s._id}">${desigOpts}</select></td>
        <td><div class="multi" id="sc-${s._id}">${classOpts}</div><button class="btn-sm primary" style="margin-top:6px" onclick="saveStaffClasses('${s._id}')">Save</button></td>
        <td>${s.hasCredentials ? '<span class="chip">yes</span>' : '<span class="empty">no</span>'}</td>
        <td><button class="btn-sm danger" onclick="delStaff('${s._id}')">Delete</button></td></tr>`;
    }).join("") : `<tr><td colspan="6" class="empty">No staff yet.</td></tr>`;
  } catch (e) { fail(e); }
}
$("st-add").onclick = async () => {
  const name = $("st-name").value.trim(), mobileNo = $("st-mobile").value.trim();
  if (!name || !mobileNo) return showAlert(A, "Name and mobile are required");
  try { await api("/staff", "POST", { name, mobileNo, designationId: $("st-desig").value || null }); $("st-name").value = ""; $("st-mobile").value = ""; ok("Added"); loadStaff(); } catch (e) { fail(e); }
};
window.delStaff = async (id) => { try { await api("/staff/" + id, "DELETE"); loadStaff(); } catch (e) { fail(e); } };
window.saveStaffClasses = async (id) => {
  const classIds = Array.from(document.querySelectorAll(`#sc-${id} input:checked`)).map((i) => i.value);
  const designationId = $("sd-" + id).value || null;
  try { await api("/staff/" + id + "/classes", "PUT", { classIds, designationId }); ok("Saved"); loadStaff(); } catch (e) { fail(e); }
};

/* ---------- Students ---------- */
async function loadStudents() {
  try {
    cache.classes = (await api("/classes")).data;
    $("stu-class").innerHTML = `<option value="">All classes</option>` + cache.classes.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join("");
    renderStudents();
  } catch (e) { fail(e); }
}
async function renderStudents() {
  try {
    const classId = $("stu-class").value, search = $("stu-search").value.trim();
    const q = new URLSearchParams(); if (classId) q.set("classId", classId); if (search) q.set("search", search);
    const { data } = await api("/students?" + q.toString());
    $("stu-body").innerHTML = data.length ? data.map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.fatherName)}</td><td>${s.classId ? esc(s.classId.name) : "—"}</td><td>${esc(s.mobileNo)}</td><td><button class="btn-sm danger" onclick="delStudent('${s._id}')">Delete</button></td></tr>`).join("") : `<tr><td colspan="5" class="empty">No students.</td></tr>`;
  } catch (e) { fail(e); }
}
$("stu-find").onclick = renderStudents;
$("stu-add").onclick = async () => {
  const name = $("stu-name").value.trim(), mobileNo = $("stu-mobile").value.trim();
  if (!name || !mobileNo) return showAlert(A, "Name and mobile are required");
  try { await api("/students", "POST", { name, fatherName: $("stu-father").value.trim(), mobileNo, classId: $("stu-class").value || null }); $("stu-name").value = ""; $("stu-father").value = ""; $("stu-mobile").value = ""; ok("Added"); renderStudents(); } catch (e) { fail(e); }
};
$("stu-bulk-add").onclick = async () => {
  const raw = $("stu-bulk").value.trim(); if (!raw) return;
  const students = raw.split("\n").map((line) => { const [name, fatherName, mobileNo] = line.split(",").map((x) => (x || "").trim()); return { name, fatherName, mobileNo }; });
  try { const r = await api("/students/bulk", "POST", { classId: $("stu-class").value || null, students }); $("stu-bulk").value = ""; ok(r.message); renderStudents(); } catch (e) { fail(e); }
};
window.delStudent = async (id) => { try { await api("/students/" + id, "DELETE"); renderStudents(); } catch (e) { fail(e); } };

/* ---------- Hierarchy ---------- */
async function loadHierarchy() { try { const { data } = await api("/hierarchy"); $("h-levels").value = data.levels; } catch (e) { fail(e); } }
$("h-save").onclick = async () => { try { await api("/hierarchy", "PUT", { levels: Number($("h-levels").value) }); ok("Saved"); } catch (e) { fail(e); } };

/* ---------- Credentials ---------- */
async function loadCredentials() {
  try {
    cache.staff = (await api("/staff")).data;
    const withoutCreds = cache.staff.filter((s) => !s.hasCredentials);
    $("cr-staff").innerHTML = withoutCreds.length ? withoutCreds.map((s) => `<option value="${s._id}">${esc(s.name)} (${esc(s.mobileNo)})</option>`).join("") : `<option value="">All staff have logins</option>`;
    const { data } = await api("/credentials");
    $("cr-body").innerHTML = data.length ? data.map((c) => `<tr><td class="mono">${esc(c.loginId)}</td><td>${esc(c.staffName)}</td><td>${c.feeAccess ? "yes" : "no"}</td><td>${c.isActive ? "active" : "disabled"}</td><td><button class="btn-sm danger" onclick="delCred('${c.id}')">Delete</button></td></tr>`).join("") : `<tr><td colspan="5" class="empty">No credentials yet.</td></tr>`;
  } catch (e) { fail(e); }
}
$("cr-add").onclick = async () => {
  const staffId = $("cr-staff").value, password = $("cr-pass").value.trim();
  if (!staffId || !password) return showAlert(A, "Pick a staff and set a password");
  try { await api("/credentials", "POST", { staffId, password, feeAccess: $("cr-fee").checked }); $("cr-pass").value = ""; $("cr-fee").checked = false; ok("Credentials created"); loadCredentials(); } catch (e) { fail(e); }
};
window.delCred = async (id) => { try { await api("/credentials/" + id, "DELETE"); loadCredentials(); } catch (e) { fail(e); } };
