// ===============================
// Tiny Fetch Wrapper
// ===============================

async function apiFetch(path, opts = {}) {

    const {
        method = "GET",
        body,
        auth = false,
        tokenKey = "ax_token"
    } = opts;

    const headers = {
        "Content-Type": "application/json"
    };

    // Authorization Header
    if (auth) {

        const token = localStorage.getItem(tokenKey);

        if (token) {

            headers["Authorization"] = "Bearer " + token;

        }

    }

    // API Call
    const res = await fetch(API_BASE + path, {

        method,

        headers,

        body: body ? JSON.stringify(body) : undefined

    });

    // Debug Logs
    console.log("====================================");
    console.log("API URL :", API_BASE + path);
    console.log("STATUS  :", res.status);
    console.log("TOKEN   :", tokenKey);
    console.log("====================================");

    let data = {};

    try {

        data = await res.json();

        console.log("API RESPONSE :", data);

    }

    catch (err) {

        console.log("JSON Parse Error :", err);

    }

    if (!res.ok || data.success === false) {

        throw new Error(
            data.message || "Something went wrong. Please try again."
        );

    }

    return data;

}


// ===============================
// Alerts
// ===============================

function showAlert(el, message, type = "error") {

    if (!el) return;

    el.textContent = message;

    el.className = "alert show alert-" + type;

}

function hideAlert(el) {

    if (!el) return;

    el.className = "alert";

}