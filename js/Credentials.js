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
    $("cr-body").innerHTML = data.length
      ? data
          .map(
            (c) =>
              `<tr>
                <td class="mono">${esc(c.loginId)}</td>
                <td>${esc(c.staffName)}</td>
                <td>${c.feeAccess ? "yes" : "no"}</td>
                <td>${c.isActive ? "active" : "disabled"}</td>
                <td><button class="btn-sm danger" onclick="delCred('${c.id}')">Delete</button></td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="empty">No credentials yet.</td></tr>`;
  } catch (e) { fail(e); }
}

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