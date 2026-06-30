// ─── credentials.js ──────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

async function loadCredentials() {
  try {
    cache.staff = (await api("/staff")).data;
    const withoutCreds = cache.staff.filter((s) => !s.hasCredentials);
    $("cr-staff").innerHTML = withoutCreds.length
      ? withoutCreds
          .map((s) => `<option value="${s._id}">${esc(s.name)} (${esc(s.mobileNo)})</option>`)
          .join("")
      : `<option value="">All staff have logins</option>`;

    const { data } = await api("/credentials");
    cache.credentials = data; // keep reference for edit mode
    $("cr-body").innerHTML = data.length
      ? data.map((c) => renderRow(c)).join("")
      : `<tr><td colspan="5" class="empty">No credentials yet.</td></tr>`;
  } catch (e) { fail(e); }
}

// normal (view) row
function renderRow(c) {
  return `<tr id="cr-row-${c.id}">
    <td class="mono">${esc(c.loginId)}</td>
    <td>${esc(c.staffName)}</td>
    <td>${c.feeAccess ? "yes" : "no"}</td>
    <td>${c.isActive ? "active" : "disabled"}</td>
    <td>
      <button class="btn-sm" onclick="editCred('${c.id}')">Edit</button>
      <button class="btn-sm danger" onclick="delCred('${c.id}')">Delete</button>
    </td>
  </tr>`;
}

// edit-mode row
function renderEditRow(c) {
  return `<tr id="cr-row-${c.id}">
    <td class="mono">${esc(c.loginId)}</td>
    <td>${esc(c.staffName)}</td>
    <td>
      <label class="inline-check">
        <input type="checkbox" id="cr-edit-fee-${c.id}" ${c.feeAccess ? "checked" : ""}/>
      </label>
    </td>
    <td>${c.isActive ? "active" : "disabled"}</td>
    <td>
      <input type="password" id="cr-edit-pass-${c.id}" class="input-sm" placeholder="new password (optional)" />
      <button class="btn-sm primary" onclick="saveCred('${c.id}')">Save</button>
      <button class="btn-sm" onclick="loadCredentials()">Cancel</button>
    </td>
  </tr>`;
}

window.editCred = (id) => {
  const c = cache.credentials.find((x) => x.id === id);
  if (!c) return;
  const row = document.getElementById(`cr-row-${id}`);
  if (row) row.outerHTML = renderEditRow(c);
};

window.saveCred = async (id) => {
  const passEl = $(`cr-edit-pass-${id}`);
  const feeEl  = $(`cr-edit-fee-${id}`);
  const password = passEl.value.trim();
  const feeAccess = feeEl.checked;

  const payload = { feeAccess };
  if (password) payload.password = password;

  try {
    await api("/credentials/" + id, "PUT", payload);
    ok("Credentials updated");
    loadCredentials();
  } catch (e) { fail(e); }
};

$("cr-add").onclick = async () => {
  const staffId  = $("cr-staff").value;
  const password = $("cr-pass").value.trim();
  if (!staffId || !password) return showAlert(A, "Pick a staff and set a password");
  try {
    await api("/credentials", "POST", { staffId, password, feeAccess: $("cr-fee").checked });
    $("cr-pass").value   = "";
    $("cr-fee").checked  = false;
    ok("Credentials created");
    loadCredentials();
  } catch (e) { fail(e); }
};

window.delCred = async (id) => {
  try { await api("/credentials/" + id, "DELETE"); loadCredentials(); } catch (e) { fail(e); }
};