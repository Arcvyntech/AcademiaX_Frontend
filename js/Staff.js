// ─── staff.js ────────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

async function loadStaff() {
  try {
    cache.designations = (await api("/designations")).data;
    cache.classes      = (await api("/classes")).data;

    $("st-desig").innerHTML =
      `<option value="">— none —</option>` +
      cache.designations.map((d) => `<option value="${d._id}">${esc(d.name)}</option>`).join("");

    const { data } = await api("/staff");
    cache.staff = data;

    $("st-body").innerHTML = data.length
      ? data
          .map((s) => {
            const assigned = (s.assignedClassIds || []).map((c) => c._id);
            const classOpts =
              cache.classes
                .map(
                  (c) =>
                    `<label><input type="checkbox" value="${c._id}" ${
                      assigned.includes(c._id) ? "checked" : ""
                    }/> ${esc(c.name)}</label>`
                )
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
            return `<tr>
              <td>${esc(s.name)}</td>
              <td>${esc(s.mobileNo)}</td>
              <td><select id="sd-${s._id}">${desigOpts}</select></td>
              <td>
                <div class="multi" id="sc-${s._id}">${classOpts}</div>
                <button class="btn-sm primary" style="margin-top:6px"
                        onclick="saveStaffClasses('${s._id}')">Save</button>
              </td>
              <td>${s.hasCredentials ? '<span class="chip">yes</span>' : '<span class="empty">no</span>'}</td>
              <td><button class="btn-sm danger" onclick="delStaff('${s._id}')">Delete</button></td>
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