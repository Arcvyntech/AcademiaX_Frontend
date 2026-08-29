const A = document.getElementById("alert");
let regCode = "";

function val(id) { return document.getElementById(id).value.trim(); }

/* ---------- State -> District cascading dropdowns ---------- */
const stateSel = document.getElementById("f_state");
const districtSel = document.getElementById("f_district");

// Populate states on load (INDIA_STATES + INDIA_GEO come from india-geo.js)
INDIA_STATES.forEach((s) => {
  const o = document.createElement("option");
  o.value = s; o.textContent = s;
  stateSel.appendChild(o);
});

// When a state changes, fill its districts
stateSel.addEventListener("change", () => {
  const districts = INDIA_GEO[stateSel.value] || [];
  districtSel.innerHTML = "";
  if (!districts.length) {
    districtSel.innerHTML = '<option value="">First select a state</option>';
    districtSel.disabled = true;
    return;
  }
  districtSel.disabled = false;
  const first = document.createElement("option");
  first.value = ""; first.textContent = "Select district";
  districtSel.appendChild(first);
  districts.forEach((d) => {
    const o = document.createElement("option");
    o.value = d; o.textContent = d;
    districtSel.appendChild(o);
  });
});

/* ---------- Step navigation ---------- */
function setStep(n) {
  [1, 2, 3].forEach((i) => {
    document.getElementById("step" + i).classList.toggle("active", i === n);
    document.getElementById("step" + i).classList.toggle("done", i < n);
    document.getElementById("pane" + i).classList.toggle("active", i === n);
  });
}

/* ---------- OTP boxes ---------- */
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

/* ---------- Step 1: details ---------- */
document.getElementById("form1").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(A);
  if (!val("f_state")) return showAlert(A, "Please select a state.");
  if (!val("f_district")) return showAlert(A, "Please select a district.");
  const btn = e.submitter; btn.disabled = true;
  try {
    const body = {
      name: val("f_name"), type: val("f_type"), email: val("f_email"), mobile: val("f_mobile"),
      mobile2: val("f_mobile2"), state: val("f_state"), district: val("f_district"),
      city: val("f_city"), address: val("f_address"),
    };
    const data = await apiFetch("/auth/register", { method: "POST", body });
    console.log("Register Response:", data);
    regCode = data.institutionCode;
    document.getElementById("codeOut").textContent = regCode;
    document.getElementById("emailOut").textContent = body.email;
    setStep(2);
  } catch (err) { showAlert(A, err.message); } finally { btn.disabled = false; }
});

/* ---------- Step 2: verify OTP ---------- */
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

/* ---------- Step 3: set password ---------- */
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