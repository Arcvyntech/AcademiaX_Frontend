// ─── subjects.js ─────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

let editingSubId = null; // kaunsi row abhi edit mode mein hai

async function loadSubjects() {
  try {
    const { data } = await api("/subjects");
    cache.subjects = data;
    $("s-body").innerHTML = data.length
      ? data
          .map((s) => {
            const isEditing = editingSubId === s._id;
            const nameCell = isEditing
              ? `<input type="text" id="edit-sub-${s._id}" value="${esc(s.name)}" style="width:160px"/>`
              : esc(s.name);

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveSub('${s._id}')">Save</button>
                 <button class="btn-sm" onclick="cancelSubEdit()">Cancel</button>`
              : `<button class="btn-sm" onclick="editSub('${s._id}')">Edit</button>
                 <button class="btn-sm danger" onclick="delSub('${s._id}')">Delete</button>`;

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