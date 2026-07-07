// ─── staff.js ────────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

let editingStaffId = null; // kaunsi row abhi edit mode mein hai

const STAFF_TONES = ["", "tone-green", "tone-blue"];

async function loadStaff() {
  try {
    cache.designations = (await api("/designations")).data;
    cache.classes      = (await api("/classes")).data;

    $("st-desig").innerHTML =
      `<option value="">— none —</option>` +
      cache.designations.map((d) => `<option value="${d._id}">${esc(d.name)}</option>`).join("");

    const { data } = await api("/staff");
    cache.staff = data;

    // Count chip next to the "Staff" heading
    const countEl = $("st-count");
    if (countEl) countEl.textContent = data.length ? `${data.length} staff` : "";

    $("st-body").innerHTML = data.length
      ? data
          .map((s, i) => {
            const tone = STAFF_TONES[i % STAFF_TONES.length];
            const assigned = (s.assignedClassIds || []).map((c) => c._id);

            // Classes render as clickable chips, same pattern as the
            // subjects picker — works fine with any number of classes.
            // Includes the nickname (e.g. "5 · 5B") since class names
            // like plain numbers can repeat and need disambiguation.
            const classOpts =
              cache.classes
                .map((c) => {
                  const label = c.nickname ? `${esc(c.name)} · ${esc(c.nickname)}` : esc(c.name);
                  return `
              <label class="subject-chip">
                <input type="checkbox" value="${c._id}" ${assigned.includes(c._id) ? "checked" : ""}/>
                <i class="ti ti-check chip-check"></i>${label}
              </label>`;
                })
                .join("") || `<span class="empty">Add classes first</span>`;

            const desigOpts =
              `<option value="">— none —</option>` +
              cache.designations
                .map(
                  (d) =>
                    `<option value="${d._id}" ${
                      s.designationId && s.designationId._id === d._id ? "selected" : ""
                    }>${esc(d.name)}</option>`
                )
                .join("");

            const isEditing = editingStaffId === s._id;

            const nameCell = isEditing
              ? `<input type="text" id="edit-sname-${s._id}" value="${esc(s.name)}" style="width:110px"/>`
              : `<div class="name-cell">
                   <div class="ic-box ${tone}"><i class="ti ti-user"></i></div>
                   <span class="name-text">${esc(s.name)}</span>
                 </div>`;

            const mobileCell = isEditing
              ? `<input type="text" id="edit-smobile-${s._id}" value="${esc(s.mobileNo)}" style="width:110px"/>`
              : `<span class="count-inline"><i class="ti ti-phone"></i>${esc(s.mobileNo)}</span>`;

            const editActions = isEditing
              ? `<button class="btn-sm" onclick="saveStaffInfo('${s._id}')"><i class="ti ti-check"></i>Save</button>
                 <button class="btn-sm" onclick="cancelStaffEdit()"><i class="ti ti-x"></i>Cancel</button>`
              : `<button class="btn-sm" onclick="editStaff('${s._id}')"><i class="ti ti-edit"></i>Edit</button>
                 <button class="btn-sm danger" onclick="delStaff('${s._id}')"><i class="ti ti-trash"></i>Delete</button>`;

            const loginPill = s.hasCredentials
              ? '<span class="status-pill yes">Yes</span>'
              : '<span class="status-pill no">No</span>';

            return `<tr>
              <td>${nameCell}</td>
              <td>${mobileCell}</td>
              <td><select id="sd-${s._id}">${desigOpts}</select></td>
              <td>
                <div class="subject-chips compact" id="sc-${s._id}">${classOpts}</div>
                <button class="btn-sm primary" onclick="saveStaffClasses('${s._id}')">
                  <i class="ti ti-device-floppy"></i>Save
                </button>
              </td>
              <td>${loginPill}</td>
              <td>${editActions}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="6" class="empty">No staff yet.</td></tr>`;
  } catch (e) { fail(e); }
}

$("st-add").onclick = async () => {
  const name     = $("st-name").value.trim();
  const mobileNo = $("st-mobile").value.trim();
  if (!name || !mobileNo) return showAlert(A, "Name and mobile are required");
  try {
    await api("/staff", "POST", { name, mobileNo, designationId: $("st-desig").value || null });
    $("st-name").value   = "";
    $("st-mobile").value = "";
    ok("Added");
    loadStaff();
  } catch (e) { fail(e); }
};

window.delStaff = async (id) => {
  try { await api("/staff/" + id, "DELETE"); loadStaff(); } catch (e) { fail(e); }
};

window.saveStaffClasses = async (id) => {
  const classIds      = Array.from(document.querySelectorAll(`#sc-${id} input:checked`)).map((i) => i.value);
  const designationId = $("sd-" + id).value || null;
  try {
    await api("/staff/" + id + "/classes", "PUT", { classIds, designationId });
    ok("Saved");
    loadStaff();
  } catch (e) { fail(e); }
};

window.editStaff = (id) => {
  editingStaffId = id;
  loadStaff();
};

window.cancelStaffEdit = () => {
  editingStaffId = null;
  loadStaff();
};

window.saveStaffInfo = async (id) => {
  const name     = $("edit-sname-" + id).value.trim();
  const mobileNo = $("edit-smobile-" + id).value.trim();
  if (!name || !mobileNo) return fail({ message: "Name aur mobile dono zaroori hain" });
  try {
    await api("/staff/" + id, "PUT", { name, mobileNo });
    editingStaffId = null;
    ok("Updated");
    loadStaff();
  } catch (e) { fail(e); }
};