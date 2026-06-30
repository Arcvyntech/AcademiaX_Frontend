// ─── designations.js ────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

let editingId = null; // kaunsi row abhi edit mode mein hai

async function loadDesignations() {
  try {
    const { data } = await api("/designations");
    cache.designations = data;
    $("d-body").innerHTML = data.length
      ? data
          .map((d) => {
            const isEditing = editingId === d._id;
            const nameCell = isEditing
              ? `<input type="text" id="edit-name-${d._id}" value="${esc(d.name)}" style="width:140px"/>`
              : esc(d.name);

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveDesig('${d._id}')">Save</button>
                 <button class="btn-sm" onclick="cancelEdit()">Cancel</button>`
              : `<button class="btn-sm" onclick="editDesig('${d._id}')">Edit</button>
                 <button class="btn-sm danger" onclick="delDesig('${d._id}')">Delete</button>`;

            return `
      <tr><td>${nameCell}</td><td>${d.staffCount}</td>
      <td><input type="number" min="1" max="10" value="${d.level ?? ""}" style="width:60px"
           onchange="setLevel('${d._id}', this.value)"/></td>
      <td>${actionsCell}</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="4" class="empty">No designations yet.</td></tr>`;
  } catch (e) { fail(e); }
}

$("d-add").onclick = async () => {
  const name = $("d-name").value.trim();
  if (!name) return;
  try {
    await api("/designations", "POST", { name });
    $("d-name").value = "";
    ok("Added");
    loadDesignations();
  } catch (e) { fail(e); }
};

window.delDesig = async (id) => {
  try { await api("/designations/" + id, "DELETE"); loadDesignations(); } catch (e) { fail(e); }
};

window.setLevel = async (id, level) => {
  try {
    await api("/designations/" + id + "/level", "PUT", { level: Number(level) || null });
    ok("Level saved");
  } catch (e) { fail(e); }
};

window.editDesig = (id) => {
  editingId = id;
  loadDesignations();
};

window.cancelEdit = () => {
  editingId = null;
  loadDesignations();
};

window.saveDesig = async (id) => {
  const input = $("edit-name-" + id);
  const newName = input.value.trim();
  if (!newName) return fail({ message: "Name khali nahi ho sakta" });
  try {
    await api("/designations/" + id, "PUT", { name: newName });
    editingId = null;
    ok("Updated");
    loadDesignations();
  } catch (e) { fail(e); }
};