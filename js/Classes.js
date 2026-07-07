// ─── classes.js ──────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

let editingClassId = null; // kaunsi row abhi edit mode mein hai

const CLASS_TONES = ["", "tone-green", "tone-blue"];

async function loadClasses() {
  try {
    if (!cache.subjects.length) cache.subjects = (await api("/subjects")).data;
    const { data } = await api("/classes");
    cache.classes = data;

    // Count chip next to the "Classes" heading
    const countEl = $("c-count");
    if (countEl) countEl.textContent = data.length ? `${data.length} ${data.length === 1 ? "class" : "classes"}` : "";

    $("c-body").innerHTML = data.length
      ? data
          .map((c, i) => {
            const tone = CLASS_TONES[i % CLASS_TONES.length];
            const assigned = (c.subjectIds || []).map((s) => s._id);

            // Each subject renders as a clickable chip; the checkbox itself
            // stays functional (hidden), only its look changes.
            const opts =
              cache.subjects
                .map(
                  (s) => `
              <label class="subject-chip">
                <input type="checkbox" value="${s._id}" ${assigned.includes(s._id) ? "checked" : ""}/>
                <i class="ti ti-check chip-check"></i>${esc(s.name)}
              </label>`
                )
                .join("") || `<span class="empty">Add subjects first</span>`;

            const isEditing = editingClassId === c._id;

            const nameCell = isEditing
              ? `<input type="text" id="edit-cname-${c._id}" value="${esc(c.name)}" style="width:120px"/><br/>
                 <input type="text" id="edit-cnick-${c._id}" value="${esc(c.nickname || "")}" placeholder="Nickname" style="width:120px"/>`
              : `<div class="name-cell">
                   <div class="ic-box ${tone}"><i class="ti ti-school"></i></div>
                   <span class="name-text">${esc(c.name)}${c.nickname ? ` <span class="chip">${esc(c.nickname)}</span>` : ""}</span>
                 </div>`;

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveClass('${c._id}')"><i class="ti ti-check"></i>Save</button>
                 <button class="btn-sm" onclick="cancelClassEdit()"><i class="ti ti-x"></i>Cancel</button>`
              : `<button class="btn-sm" onclick="editClass('${c._id}')"><i class="ti ti-edit"></i>Edit</button>
                 <button class="btn-sm danger" onclick="delClass('${c._id}')"><i class="ti ti-trash"></i>Delete</button>`;

            return `<tr>
              <td>${nameCell}</td>
              <td><span class="count-inline"><i class="ti ti-users"></i>${c.studentCount}</span></td>
              <td>
                <div class="subject-chips" id="cs-${c._id}">${opts}</div>
                <button class="btn-sm primary" onclick="saveClassSubjects('${c._id}')">
                  <i class="ti ti-device-floppy"></i>Save subjects
                </button>
              </td>
              <td>${actionsCell}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="4" class="empty">No classes yet.</td></tr>`;
  } catch (e) { fail(e); }
}

$("c-add").onclick = async () => {
  const name = $("c-name").value.trim();
  if (!name) return;
  try {
    await api("/classes", "POST", { name, nickname: $("c-nick").value.trim() });
    $("c-name").value = "";
    $("c-nick").value = "";
    ok("Added");
    loadClasses();
  } catch (e) { fail(e); }
};

window.delClass = async (id) => {
  try { await api("/classes/" + id, "DELETE"); loadClasses(); } catch (e) { fail(e); }
};

window.saveClassSubjects = async (id) => {
  const ids = Array.from(document.querySelectorAll(`#cs-${id} input:checked`)).map((i) => i.value);
  try {
    await api("/classes/" + id + "/subjects", "PUT", { subjectIds: ids });
    ok("Subjects saved");
    loadClasses();
  } catch (e) { fail(e); }
};

window.editClass = (id) => {
  editingClassId = id;
  loadClasses();
};

window.cancelClassEdit = () => {
  editingClassId = null;
  loadClasses();
};

window.saveClass = async (id) => {
  const name = $("edit-cname-" + id).value.trim();
  const nickname = $("edit-cnick-" + id).value.trim();
  if (!name) return fail({ message: "Class name khali nahi ho sakta" });
  try {
    await api("/classes/" + id, "PUT", { name, nickname });
    editingClassId = null;
    ok("Updated");
    loadClasses();
  } catch (e) { fail(e); }
};