const A = document.getElementById("alert");

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

phone: document.getElementById("phone").value.trim(),

password: pw.value

};

const data = await apiFetch("/auth/staff/login", {

method: "POST",

body

});
console.log(data);

localStorage.setItem("staff_token", data.token);

localStorage.setItem("staff", JSON.stringify(data.staff));

showAlert(A,"Login Successful","success");

setTimeout(()=>{

location.href="staff-dashboard.html";

},700);

}

catch(err){
    console.log(err);
    alert(err.message);
    showAlert(A, err.message);
}

finally{

btn.disabled=false;

}

});