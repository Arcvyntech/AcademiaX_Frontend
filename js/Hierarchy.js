// ─── hierarchy.js ────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, $, fail, ok)

async function loadHierarchy() {
  try {
    const { data } = await api("/hierarchy");
    $("h-levels").value = data.levels;
  } catch (e) { fail(e); }
}

$("h-save").onclick = async () => {
  try {
    await api("/hierarchy", "PUT", { levels: Number($("h-levels").value) });
    ok("Saved");
  } catch (e) { fail(e); }
};