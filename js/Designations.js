// ─── designations.js ────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

let editingId = null; // kaunsi row abhi edit mode mein hai

// Simple icon + color picker so common role names get a fitting look.
// Falls back to a generic briefcase icon + rotating color for anything else.
const DESIG_TONES = ["", "tone-green", "tone-blue"];

function designationIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("principal") || n.includes("manager") || n.includes("head")) return "ti-crown";
  if (n.includes("teacher") || n.includes("coordinator") || n.includes("faculty")) return "ti-chalkboard";
  if (n.includes("account") || n.includes("finance")) return "ti-calculator";
  if (n.includes("clerk") || n.includes("admin")) return "ti-file-text";
  return "ti-briefcase";
}

async function loadDesignations() {
  try {
    const { data } = await api("/designations");
    cache.designations = data;

    // Count chip next to the "Designations" heading
    const countEl = $("d-count");
    if (countEl) countEl.textContent = data.length ? `${data.length} role${data.length > 1 ? "s" : ""}` : "";

    $("d-body").innerHTML = data.length
      ? data
          .map((d, i) => {
            const isEditing = editingId === d._id;
            const tone = DESIG_TONES[i % DESIG_TONES.length];
            const icon = designationIcon(d.name);

            const nameCell = isEditing
              ? `<input type="text" id="edit-name-${d._id}" value="${esc(d.name)}" style="width:140px"/>`
              : `<div class="name-cell">
                   <div class="ic-box ${tone}"><i class="ti ${icon}"></i></div>
                   <span class="name-text">${esc(d.name)}</span>
                 </div>`;

            const actionsCell = isEditing
              ? `<button class="btn-sm" onclick="saveDesig('${d._id}')"><i class="ti ti-check"></i>Save</button>
                 <button class="btn-sm" onclick="cancelEdit()"><i class="ti ti-x"></i>Cancel</button>`
              : `<button class="btn-sm" onclick="editDesig('${d._id}')"><i class="ti ti-edit"></i>Edit</button>
                 <button class="btn-sm danger" onclick="delDesig('${d._id}')"><i class="ti ti-trash"></i>Delete</button>`;

            return `
      <tr>
        <td>${nameCell}</td>
        <td><span class="count-inline"><i class="ti ti-users"></i>${d.staffCount}</span></td>
        <td><input class="level-input" type="number" min="1" max="10" value="${d.level ?? ""}"
             onchange="setLevel('${d._id}', this.value)"/></td>
        <td>${actionsCell}</td>
      </tr>`;
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