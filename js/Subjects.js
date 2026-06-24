// ─── subjects.js ─────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

async function loadSubjects() {
  try {
    const { data } = await api("/subjects");
    cache.subjects = data;
    $("s-body").innerHTML = data.length
      ? data
          .map(
            (s) =>
              `<tr><td>${esc(s.name)}</td>
               <td><button class="btn-sm danger" onclick="delSub('${s._id}')">Delete</button></td></tr>`
          )
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