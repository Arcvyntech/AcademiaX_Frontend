// ─── designations.js ────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

async function loadDesignations() {
  try {
    const { data } = await api("/designations");
    cache.designations = data;
    $("d-body").innerHTML = data.length
      ? data
          .map(
            (d) => `
      <tr><td>${esc(d.name)}</td><td>${d.staffCount}</td>
      <td><input type="number" min="1" max="10" value="${d.level ?? ""}" style="width:60px"
           onchange="setLevel('${d._id}', this.value)"/></td>
      <td><button class="btn-sm danger" onclick="delDesig('${d._id}')">Delete</button></td></tr>`
          )
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