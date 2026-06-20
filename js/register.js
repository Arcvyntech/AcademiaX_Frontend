const A = document.getElementById("alert");
let regCode = "";

function val(id) { return document.getElementById(id).value.trim(); }

function setStep(n) {
  [1, 2, 3].forEach((i) => {
    document.getElementById("step" + i).classList.toggle("active", i === n);
    document.getElementById("step" + i).classList.toggle("done", i < n);
    document.getElementById("pane" + i).classList.toggle("active", i === n);
  });
}

function wireOtp(scope) {
  const inputs = Array.from(scope.querySelectorAll(".otp input"));
  inputs.forEach((inp, idx) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
      if (inp.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && idx > 0) inputs[idx - 1].focus();
    });
  });
}
function otpValue(scope) {
  return Array.from(scope.querySelectorAll(".otp input")).map((i) => i.value).join("");
}

document.getElementById("form1").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    const body = {
      name: val("f_name"), type: val("f_type"), email: val("f_email"), mobile: val("f_mobile"),
      mobile2: val("f_mobile2"), state: val("f_state"), district: val("f_district"),
      city: val("f_city"), address: val("f_address"),
    };
    const data = await apiFetch("/auth/register", { method: "POST", body });
    regCode = data.institutionCode;
    document.getElementById("codeOut").textContent = regCode;
    document.getElementById("emailOut").textContent = body.email;
    setStep(2);
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});

document.getElementById("form2").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    const otp = otpValue(document.getElementById("pane2"));
    if (otp.length !== 6) throw new Error("Enter the 6-digit code from your email.");
    await apiFetch("/auth/verify-otp", { method: "POST", body: { institutionCode: regCode, otp } });
    setStep(3);
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});

document.getElementById("form3").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  const btn = e.submitter; btn.disabled = true;
  try {
    const password = val("f_pass");
    const confirmPassword = val("f_pass2");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    await apiFetch("/auth/set-password", { method: "POST", body: { institutionCode: regCode, password, confirmPassword } });
    showAlert(A, "Account ready! Taking you to sign in…", "success");
    setTimeout(() => (location.href = "login.html"), 1200);
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});

wireOtp(document.getElementById("pane2"));
