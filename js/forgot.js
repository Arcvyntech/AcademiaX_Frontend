const A = document.getElementById("alert");
let fCode = "";

document.getElementById("form1").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    fCode = document.getElementById("code").value.trim();
    await apiFetch("/auth/forgot-password", { method: "POST", body: { institutionCode: fCode } });
    showAlert(A, "If that institution exists, a reset code was sent to its email.", "success");
    document.getElementById("pane1").classList.remove("active");
    document.getElementById("pane2").classList.add("active");
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});

document.getElementById("form2").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    const otp = document.getElementById("otp").value.trim();
    const newPassword = document.getElementById("newpass").value;
    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
    await apiFetch("/auth/reset-password", { method: "POST", body: { institutionCode: fCode, otp, newPassword } });
    showAlert(A, "Password reset! Taking you to sign in…", "success");
    setTimeout(() => (location.href = "login.html"), 1200);
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});
