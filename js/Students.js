// ─── students.js ─────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

let editingStuId = null; // kaunsi row abhi edit mode mein hai

const STUDENT_TONES = ["", "tone-green", "tone-blue"];

async function loadStudents() {
  try {
    cache.classes = (await api("/classes")).data;

    // unique class names, in the order they first appear
    const seen = new Set();
    cache.classNames = [];
    cache.classes.forEach((c) => {
      if (!seen.has(c.name)) { seen.add(c.name); cache.classNames.push(c.name); }
    });

    $("stu-class").innerHTML =
      `<option value="">All classes</option>` +
      cache.classNames.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join("");

    renderSectionDropdown();
    renderStudents();
  } catch (e) { fail(e); }
}

// fills the Section dropdown based on whichever Class name is currently picked
function renderSectionDropdown() {
  const className = $("stu-class").value;

  if (!className) {
    $("stu-section").innerHTML = `<option value="">All sections</option>`;
    $("stu-section").disabled = true;
    return;
  }

  const sections = cache.classes.filter((c) => c.name === className);
  $("stu-section").disabled = false;
  $("stu-section").innerHTML =
    `<option value="">All sections</option>` +
    sections.map((c) => `<option value="${c._id}">${esc(c.nickname || c.name)}</option>`).join("");
}

$("stu-class").onchange = () => {
  renderSectionDropdown();
  renderStudents();
};

$("stu-section").onchange = renderStudents;

async function renderStudents() {
  try {
    const className = $("stu-class").value;
    const sectionId = $("stu-section").value;
    const search    = $("stu-search").value.trim();

    const q = new URLSearchParams();
    if (sectionId) q.set("classId", sectionId);
    if (search)    q.set("search", search);

    let { data } = await api("/students?" + q.toString());

    // class name chosen but "All sections" -> merge every section of that class, client-side
    if (className && !sectionId) {
      const idsForClass = new Set(
        cache.classes.filter((c) => c.name === className).map((c) => c._id)
      );
      data = data.filter((s) => s.classId && idsForClass.has(s.classId._id));
    }

    cache.studentsList = data; // edit ke time class options ke liye kaam aayega

    // Count chip next to the "Students" heading (reflects the current filter)
    const countEl = $("stu-count");
    if (countEl) countEl.textContent = data.length ? `${data.length} ${data.length === 1 ? "student" : "students"}` : "";

    $("stu-body").innerHTML = data.length
      ? data
          .map((s, i) => {
            const tone = STUDENT_TONES[i % STUDENT_TONES.length];
            const isEditing = editingStuId === s._id;

            const nameCell = isEditing
              ? `<input type="text" id="edit-stuname-${s._id}" value="${esc(s.name)}" style="width:100px"/>`
              : `<div class="name-cell">
                   <div class="ic-box ${tone}"><i class="ti ti-user"></i></div>
                   <span class="name-text">${esc(s.name)}</span>
                 </div>`;

            const fatherCell = isEditing
              ? `<input type="text" id="edit-stufather-${s._id}" value="${esc(s.fatherName || "")}" style="width:100px"/>`
              : esc(s.fatherName);

            const classCell = isEditing
              ? `<select id="edit-stuclass-${s._id}">` +
                cache.classes
                  .map(
                    (c) =>
                      `<option value="${c._id}" ${
                        s.classId && s.classId._id === c._id ? "selected" : ""
                      }>${esc(c.name)}${c.nickname ? " - " + esc(c.nickname) : ""}</option>`
                  )
                  .join("") +
                `</select>`
              : s.classId
                ? `<span class="chip">${esc(s.classId.name)}${s.classId.nickname ? " · " + esc(s.classId.nickname) : ""}</span>`
                : `<span class="empty">—</span>`;

            const mobileCell = isEditing
              ? `<input type="text" id="edit-stumobile-${s._id}" value="${esc(s.mobileNo)}" style="width:110px"/>`
              : `<span class="count-inline"><i class="ti ti-phone"></i>${esc(s.mobileNo)}</span>`;

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveStudent('${s._id}')"><i class="ti ti-check"></i>Save</button>
                 <button class="btn-sm" onclick="cancelStuEdit()"><i class="ti ti-x"></i>Cancel</button>`
              : `<button class="btn-sm" onclick="editStudent('${s._id}')"><i class="ti ti-edit"></i>Edit</button>
                 <button class="btn-sm danger" onclick="delStudent('${s._id}')"><i class="ti ti-trash"></i>Delete</button>`;

            return `<tr>
                <td>${nameCell}</td>
                <td>${fatherCell}</td>
                <td>${classCell}</td>
                <td>${mobileCell}</td>
                <td>${actionsCell}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="5" class="empty">No students.</td></tr>`;
  } catch (e) { fail(e); }
}

$("stu-find").onclick = renderStudents;

$("stu-add").onclick = async () => {
  const name     = $("stu-name").value.trim();
  const mobileNo = $("stu-mobile").value.trim();
  if (!name || !mobileNo) return showAlert(A, "Name and mobile are required");

  const className = $("stu-class").value;
  const sectionId = $("stu-section").value;
  if (className && !sectionId) return showAlert(A, "Pick a specific section before adding a student");

  try {
    await api("/students", "POST", {
      name,
      fatherName: $("stu-father").value.trim(),
      mobileNo,
      classId: sectionId || null,
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

  const className = $("stu-class").value;
  const sectionId = $("stu-section").value;
  if (className && !sectionId) return showAlert(A, "Pick a specific section before bulk adding");

  const students = raw.split("\n").map((line) => {
    const [name, fatherName, mobileNo] = line.split(",").map((x) => (x || "").trim());
    return { name, fatherName, mobileNo };
  });
  try {
    const r = await api("/students/bulk", "POST", {
      classId: sectionId || null,
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

window.editStudent = (id) => {
  editingStuId = id;
  renderStudents();
};

window.cancelStuEdit = () => {
  editingStuId = null;
  renderStudents();
};

window.saveStudent = async (id) => {
  const name       = $("edit-stuname-" + id).value.trim();
  const fatherName = $("edit-stufather-" + id).value.trim();
  const mobileNo   = $("edit-stumobile-" + id).value.trim();
  const classId    = $("edit-stuclass-" + id).value || null;
  if (!name || !mobileNo) return fail({ message: "Name aur mobile dono zaroori hain" });
  try {
    await api("/students/" + id, "PUT", { name, fatherName, mobileNo, classId });
    editingStuId = null;
    ok("Updated");
    renderStudents();
  } catch (e) { fail(e); }
};