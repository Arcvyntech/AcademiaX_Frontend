const A = document.getElementById("alert");

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    const body = {
      institutionCode: document.getElementById("code").value.trim(),
      password: document.getElementById("password").value,
    };
    const data = await apiFetch("/auth/login", { method: "POST", body });
    localStorage.setItem("ax_token", data.token);
    localStorage.setItem("ax_institution", JSON.stringify(data.institution || {}));
    location.href = "dashboard.html";
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});
