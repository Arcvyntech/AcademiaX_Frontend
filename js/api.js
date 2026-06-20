// Tiny fetch wrapper used by every page.
async function apiFetch(path, opts = {}) {
  const { method = "GET", body, auth = false } = opts;
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("ax_token");
    if (token) headers["Authorization"] = "Bearer " + token;
  }
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = "alert show alert-" + type;
}
function hideAlert(el) {
  if (!el) return;
  el.className = "alert";
}
