// ─── credentials.js ──────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok, A, showAlert)

let editingCredId = null;
let credSort = { key: null, dir: 1 };
let credFilterText = "";

const CRED_TONES = ["", "tone-green", "tone-blue"];

async function loadCredentials() {
  try {
    cache.staff = (await api("/staff")).data;
    cache.staffOptions = cache.staff.filter((s) => !s.hasCredentials);
    renderStaffDropdown([]); // stay empty until the user searches

    const { data } = await api("/credentials");
    cache.credentials = data;
    editingCredId = null;
    renderCredTable();
  } catch (e) { fail(e); }
}

// ---------- staff dropdown + search ----------
function renderStaffDropdown(list) {
  $("cr-staff").innerHTML = list.length
    ? list.map((s) => `<option value="${s._id}">${esc(s.name)} (${esc(s.mobileNo)})</option>`).join("")
    : `<option value="">Type in the search box to find staff</option>`;
}

window.filterStaffDropdown = () => {
  const q = $("cr-staff-search").value.trim().toLowerCase();
  if (!q) { renderStaffDropdown([]); return; }
  const filtered = cache.staffOptions.filter(
    (s) => s.name.toLowerCase().includes(q) || s.mobileNo.includes(q)
  );
  renderStaffDropdown(filtered);
};

// ---------- password helpers ----------
window.togglePass = (inputId, btn) => {
  const el = $(inputId);
  const hidden = el.type === "password";
  el.type = hidden ? "text" : "password";
  const icon = btn.querySelector("i");
  if (icon) icon.className = hidden ? "ti ti-eye-off" : "ti ti-eye";
};

window.generatePassword = (inputId) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  const pass = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  const el = $(inputId);
  el.value = pass;
  el.type = "text"; // show it right after generating so they can see/copy it
};

// ---------- table: filter + sort + render ----------
window.renderCredTable = () => {
  let rows = [...(cache.credentials || [])];

  if (credFilterText) {
    const q = credFilterText.toLowerCase();
    rows = rows.filter(
      (c) => c.loginId.toLowerCase().includes(q) || c.staffName.toLowerCase().includes(q)
    );
  }

  if (credSort.key) {
    rows.sort((a, b) => {
      let va = a[credSort.key], vb = b[credSort.key];
      if (typeof va === "boolean") { va = va ? 1 : 0; vb = vb ? 1 : 0; }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
      if (va < vb) return -1 * credSort.dir;
      if (va > vb) return 1 * credSort.dir;
      return 0;
    });
  }

  // Count chip next to the "Staff login credentials" heading
  // (reflects whatever the filter box currently shows)
  const countEl = $("cr-count");
  if (countEl) countEl.textContent = rows.length ? `${rows.length} ${rows.length === 1 ? "login" : "logins"}` : "";

  $("cr-body").innerHTML = rows.length
    ? rows.map((c, i) => (editingCredId === c.id ? renderEditRow(c) : renderRow(c, i))).join("")
    : `<tr><td colspan="4" class="empty">No credentials yet.</td></tr>`;

  ["loginId", "staffName", "isActive"].forEach((k) => {
    const el = $(`sort-${k}`);
    if (el) el.textContent = credSort.key === k ? (credSort.dir === 1 ? "▲" : "▼") : "";
  });
};

window.sortCred = (key) => {
  credSort.dir = credSort.key === key ? credSort.dir * -1 : 1;
  credSort.key = key;
  renderCredTable();
};

$("cr-filter").oninput = () => {
  credFilterText = $("cr-filter").value.trim();
  renderCredTable();
};

// ---------- row renderers ----------
function renderRow(c, i) {
  const tone = CRED_TONES[i % CRED_TONES.length];
  const statusPill = c.isActive
    ? '<span class="status-pill active">Active</span>'
    : '<span class="status-pill disabled">Disabled</span>';

  return `<tr id="cr-row-${c.id}">
    <td><span class="count-inline mono"><i class="ti ti-key"></i>${esc(c.loginId)}</span></td>
    <td>
      <div class="name-cell">
        <div class="ic-box ${tone}"><i class="ti ti-user"></i></div>
        <span class="name-text">${esc(c.staffName)}</span>
      </div>
    </td>
    <td>${statusPill}</td>
    <td>
      <button class="btn-sm" onclick="editCred('${c.id}')"><i class="ti ti-edit"></i>Edit</button>
      <button class="btn-sm ${c.isActive ? "warning" : "success"}" onclick="toggleActive('${c.id}')">
        <i class="ti ti-${c.isActive ? "lock" : "lock-open"}"></i>${c.isActive ? "Disable" : "Enable"}
      </button>
      <button class="btn-sm danger" onclick="delCred('${c.id}')"><i class="ti ti-trash"></i>Delete</button>
    </td>
  </tr>`;
}

function renderEditRow(c) {
  const statusPill = c.isActive
    ? '<span class="status-pill active">Active</span>'
    : '<span class="status-pill disabled">Disabled</span>';

  return `<tr id="cr-row-${c.id}">
    <td><span class="count-inline mono"><i class="ti ti-key"></i>${esc(c.loginId)}</span></td>
    <td>${esc(c.staffName)}</td>
    <td>${statusPill}</td>
    <td>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <input type="password" id="cr-edit-pass-${c.id}" placeholder="new password (optional)" style="width:150px" />
        <button type="button" class="btn-sm icon-only" onclick="togglePass('cr-edit-pass-${c.id}', this)" aria-label="Show password"><i class="ti ti-eye"></i></button>
        <button type="button" class="btn-sm icon-only" onclick="generatePassword('cr-edit-pass-${c.id}')" aria-label="Generate password"><i class="ti ti-refresh"></i></button>
        <button class="btn-sm primary" onclick="saveCred('${c.id}')"><i class="ti ti-check"></i>Save</button>
        <button class="btn-sm" onclick="cancelEditCred()"><i class="ti ti-x"></i>Cancel</button>
      </div>
    </td>
  </tr>`;
}

// ---------- actions ----------
window.editCred = (id) => {
  editingCredId = id;
  renderCredTable();
};

window.cancelEditCred = () => {
  editingCredId = null;
  renderCredTable();
};

window.saveCred = async (id) => {
  const passEl = $(`cr-edit-pass-${id}`);
  const password = passEl.value.trim();

  const payload = {};
  if (password) payload.password = password;

  try {
    await api("/credentials/" + id, "PUT", payload);
    ok("Credentials updated");
    editingCredId = null;
    loadCredentials();
  } catch (e) { fail(e); }
};

window.toggleActive = async (id) => {
  const c = cache.credentials.find((x) => x.id === id);
  if (!c) return;
  try {
    await api("/credentials/" + id, "PUT", { isActive: !c.isActive });
    ok(c.isActive ? "Login disabled" : "Login enabled");
    loadCredentials();
  } catch (e) { fail(e); }
};

window.delCred = async (id) => {
  try { await api("/credentials/" + id, "DELETE"); loadCredentials(); } catch (e) { fail(e); }
};

// ---------- create new credential ----------
$("cr-add").onclick = async () => {
  const staffId  = $("cr-staff").value;
  const password = $("cr-pass").value.trim();
  if (!staffId || !password) return showAlert(A, "Pick a staff and set a password");
  try {
    await api("/credentials", "POST", { staffId, password });
    $("cr-pass").value        = "";
    $("cr-pass").type         = "password";
    $("cr-staff-search").value = "";
    ok("Credentials created");
    loadCredentials();
  } catch (e) { fail(e); }
};