// ─── classes.js ──────────────────────────────────────────────────────────────
// Depends on: admin.js  (api, cache, $, esc, fail, ok)

async function loadClasses() {
  try {
    if (!cache.subjects.length) cache.subjects = (await api("/subjects")).data;
    const { data } = await api("/classes");
    cache.classes = data;
    $("c-body").innerHTML = data.length
      ? data
          .map((c) => {
            const assigned = (c.subjectIds || []).map((s) => s._id);
            const opts =
              cache.subjects
                .map(
                  (s) =>
                    `<label><input type="checkbox" value="${s._id}" ${
                      assigned.includes(s._id) ? "checked" : ""
                    }/> ${esc(s.name)}</label>`
                )
                .join("") || `<span class="empty">Add subjects first</span>`;
            return `<tr>
              <td>${esc(c.name)}${c.nickname ? ` <span class="chip">${esc(c.nickname)}</span>` : ""}</td>
              <td>${c.studentCount}</td>
              <td>
                <div class="multi" id="cs-${c._id}">${opts}</div>
                <button class="btn-sm primary" style="margin-top:6px"
                        onclick="saveClassSubjects('${c._id}')">Save subjects</button>
              </td>
              <td><button class="btn-sm danger" onclick="delClass('${c._id}')">Delete</button></td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="4" class="empty">No classes yet.</td></tr>`;
  } catch (e) { fail(e); }
}

$("c-add").onclick = async () => {
  const name = $("c-name").value.trim();
  if (!name) return;
  try {
    await api("/classes", "POST", { name, nickname: $("c-nick").value.trim() });
    $("c-name").value = "";
    $("c-nick").value = "";
    ok("Added");
    loadClasses();
  } catch (e) { fail(e); }
};

window.delClass = async (id) => {
  try { await api("/classes/" + id, "DELETE"); loadClasses(); } catch (e) { fail(e); }
};

window.saveClassSubjects = async (id) => {
  const ids = Array.from(document.querySelectorAll(`#cs-${id} input:checked`)).map((i) => i.value);
  try {
    await api("/classes/" + id + "/subjects", "PUT", { subjectIds: ids });
    ok("Subjects saved");
    loadClasses();
  } catch (e) { fail(e); }
};