// ─── subjects.js ─────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

let editingSubId = null; // kaunsi row abhi edit mode mein hai

const SUBJECT_TONES = ["", "tone-green", "tone-blue"];

async function loadSubjects() {
  try {
    const { data } = await api("/subjects");
    cache.subjects = data;

    // Count chip next to the "Subjects" heading
    const countEl = $("s-count");
    if (countEl) countEl.textContent = data.length ? `${data.length} ${data.length === 1 ? "subject" : "subjects"}` : "";

    $("s-body").innerHTML = data.length
      ? data
          .map((s, i) => {
            const tone = SUBJECT_TONES[i % SUBJECT_TONES.length];
            const isEditing = editingSubId === s._id;

            const nameCell = isEditing
              ? `<input type="text" id="edit-sub-${s._id}" value="${esc(s.name)}" style="width:160px"/>`
              : `<div class="name-cell">
                   <div class="ic-box ${tone}"><i class="ti ti-book"></i></div>
                   <span class="name-text">${esc(s.name)}</span>
                 </div>`;

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveSub('${s._id}')"><i class="ti ti-check"></i>Save</button>
                 <button class="btn-sm" onclick="cancelSubEdit()"><i class="ti ti-x"></i>Cancel</button>`
              : `<button class="btn-sm" onclick="editSub('${s._id}')"><i class="ti ti-edit"></i>Edit</button>
                 <button class="btn-sm danger" onclick="delSub('${s._id}')"><i class="ti ti-trash"></i>Delete</button>`;

            return `<tr><td>${nameCell}</td>
               <td>${actionsCell}</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="2" class="empty">No subjects yet.</td></tr>`;
  } catch (e) { fail(e); }
}

$("s-add").onclick = async () => {
  const name = $("s-name").value.trim();
  if (!name) return;
  try {
    await api("/subjects", "POST", { name });
    $("s-name").value = "";
    ok("Added");
    loadSubjects();
  } catch (e) { fail(e); }
};

window.delSub = async (id) => {
  try { await api("/subjects/" + id, "DELETE"); loadSubjects(); } catch (e) { fail(e); }
};

window.editSub = (id) => {
  editingSubId = id;
  loadSubjects();
};

window.cancelSubEdit = () => {
  editingSubId = null;
  loadSubjects();
};

window.saveSub = async (id) => {
  const input = $("edit-sub-" + id);
  const newName = input.value.trim();
  if (!newName) return fail({ message: "Name khali nahi ho sakta" });
  try {
    await api("/subjects/" + id, "PUT", { name: newName });
    editingSubId = null;
    ok("Updated");
    loadSubjects();
  } catch (e) { fail(e); }
};