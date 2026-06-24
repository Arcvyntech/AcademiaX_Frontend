// ─── students.js ─────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

async function loadStudents() {
  try {
    cache.classes = (await api("/classes")).data;
    $("stu-class").innerHTML =
      `<option value="">All classes</option>` +
      cache.classes.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join("");
    renderStudents();
  } catch (e) { fail(e); }
}

async function renderStudents() {
  try {
    const classId = $("stu-class").value;
    const search  = $("stu-search").value.trim();
    const q = new URLSearchParams();
    if (classId) q.set("classId", classId);
    if (search)  q.set("search", search);
    const { data } = await api("/students?" + q.toString());
    $("stu-body").innerHTML = data.length
      ? data
          .map(
            (s) =>
              `<tr>
                <td>${esc(s.name)}</td>
                <td>${esc(s.fatherName)}</td>
                <td>${s.classId ? esc(s.classId.name) : "—"}</td>
                <td>${esc(s.mobileNo)}</td>
                <td><button class="btn-sm danger" onclick="delStudent('${s._id}')">Delete</button></td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty">No students.</td></tr>`;
  } catch (e) { fail(e); }
}

$("stu-find").onclick = renderStudents;

$("stu-add").onclick = async () => {
  const name     = $("stu-name").value.trim();
  const mobileNo = $("stu-mobile").value.trim();
  if (!name || !mobileNo) return showAlert(A, "Name and mobile are required");
  try {
    await api("/students", "POST", {
      name,
      fatherName: $("stu-father").value.trim(),
      mobileNo,
      classId: $("stu-class").value || null,
    });
    $("stu-name").value   = "";
    $("stu-father").value = "";
    $("stu-mobile").value = "";
    ok("Added");
    renderStudents();
  } catch (e) { fail(e); }
};

$("stu-bulk-add").onclick = async () => {
  const raw = $("stu-bulk").value.trim();
  if (!raw) return;
  const students = raw.split("\n").map((line) => {
    const [name, fatherName, mobileNo] = line.split(",").map((x) => (x || "").trim());
    return { name, fatherName, mobileNo };
  });
  try {
    const r = await api("/students/bulk", "POST", {
      classId: $("stu-class").value || null,
      students,
    });
    $("stu-bulk").value = "";
    ok(r.message);
    renderStudents();
  } catch (e) { fail(e); }
};

window.delStudent = async (id) => {
  try { await api("/students/" + id, "DELETE"); renderStudents(); } catch (e) { fail(e); }
};