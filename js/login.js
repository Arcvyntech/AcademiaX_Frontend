const A = document.getElementById("alert");

// Show / hide password
const pw = document.getElementById("password");
const tp = document.getElementById("togglePass");
tp.addEventListener("click", () => {
  const show = pw.type === "password";
  pw.type = show ? "text" : "password";
  tp.textContent = show ? "HIDE" : "SHOW";
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter;
  btn.disabled = true;
  try {
    const body = {
      institutionCode: document.getElementById("code").value.trim(),
      password: pw.value,
    };
    if (!body.institutionCode || !body.password)
      throw new Error("Enter your institution code and password.");

    const data = await apiFetch("/auth/login", { method: "POST", body });
    localStorage.setItem("ax_token", data.token);
    localStorage.setItem("ax_institution", JSON.stringify(data.institution || {}));
    showAlert(A, "Signed in! Taking you to your dashboard…", "success");
    setTimeout(() => (location.href = "dashboard.html"), 700);
  } catch (err) {
    showAlert(A, err.message);
  } finally {
    btn.disabled = false;
  }
});