(async () => {
  const token = localStorage.getItem("ax_token");
  if (!token) { location.href = "login.html"; return; }
  try {
    const data = await apiFetch("/institution/profile", { auth: true });
    document.getElementById("instName").textContent = data.institution.name;
    document.getElementById("instCode").textContent = data.institution.code;
    document.getElementById("welcomeName").textContent = data.institution.name;
  } catch (err) {
    localStorage.removeItem("ax_token");
    location.href = "login.html";
    return;
  }
  try {
    const { data } = await apiFetch("/admin/stats", { auth: true });
    document.getElementById("stStaff").textContent = data.staff;
    document.getElementById("stClasses").textContent = data.classes;
    document.getElementById("stSubjects").textContent = data.subjects;
    document.getElementById("stStudents").textContent = data.students;
  } catch (_) {}
})();

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("ax_token");
  localStorage.removeItem("ax_institution");
  location.href = "login.html";
});
