/* ==========================================================
   AcademiaX ERP
   Transport Routes
   Version : 2.0
========================================================== */

let routes = [];

const backBtn = document.getElementById("backBtn");
const addRouteBtn = document.getElementById("addRouteBtn");
const createFirstRoute = document.getElementById("createFirstRoute");

const modal = document.getElementById("routeModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const form = document.getElementById("routeForm");

const routesContainer = document.getElementById("routesContainer");

const totalRoutes = document.getElementById("totalRoutes");
const activeRoutes = document.getElementById("activeRoutes");

const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

const searchInput = document.getElementById("searchRoute");
const filterStatus = document.getElementById("filterStatus");

/* ==========================================================
                    PAGE LOAD
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadRoutes();

});

/* ==========================================================
                    LOAD ROUTES
========================================================== */

async function loadRoutes() {

    try {

        loader.classList.add("show");

        const response = await apiFetch(

            "/transport",

            {

                auth: true

            }

        );

        routes = response.data || [];

        renderRoutes();

    }

    catch (err) {

        console.error(err);

        showToast(err.message);

    }

    finally {

        loader.classList.remove("show");

    }

}

/* ==========================================================
                    BACK
========================================================== */

backBtn.onclick = () => {

    history.back();

};

/* ==========================================================
                    MODAL
========================================================== */

function openModal() {

    modal.classList.add("active");

}

function closeRouteModal() {

    modal.classList.remove("active");

    form.reset();

}

addRouteBtn.onclick = openModal;

if (createFirstRoute) {

    createFirstRoute.onclick = openModal;

}

closeModal.onclick = closeRouteModal;

cancelBtn.onclick = closeRouteModal;

window.onclick = function (e) {

    if (e.target === modal) {

        closeRouteModal();

    }

};

/* ==========================================================
                    RENDER ROUTES
========================================================== */

function renderRoutes() {

    totalRoutes.textContent = routes.length;

    activeRoutes.textContent =

        routes.filter(route => route.status === "active").length;

    if (routes.length === 0) {

        routesContainer.innerHTML = `

<div class="empty-state">

<div class="empty-icon">

🛣️

</div>

<h2>

No Routes Found

</h2>

<p>

Click "Add Route" to create your first transport route.

</p>

<button
class="primary-btn"
id="createAgain">

+ Create Route

</button>

</div>

`;

        document.getElementById("createAgain").onclick = openModal;

        return;

    }

    routesContainer.innerHTML = "";

    routes.forEach(route => {

        routesContainer.innerHTML += `

<div class="route-card">

<div class="route-header">

<div class="route-title">

${route.routeName}

</div>

<div class="route-status ${route.status}">

${capitalize(route.status)}

</div>

</div>

<div class="route-info">

<div class="info-box">

<label>

Vehicle

</label>

<span>

${route.vehicleNumber}

</span>

</div>

<div class="info-box">

<label>

Driver

</label>

<span>

${route.driverName}

</span>

</div>

<div class="info-box">

<label>

Stops

</label>

<span>

${route.totalStops}

</span>

</div>

<div class="info-box">

<label>

Monthly Fee

</label>

<span>

₹ ${route.monthlyFee}

</span>

</div>

</div>

<div class="route-actions">

<button
class="view-btn"
onclick="viewRoute('${route._id}')">

👁 View Details

</button>

<button
class="edit-btn"
onclick="editRoute('${route._id}')">

✏ Edit

</button>

<button
class="delete-btn"
onclick="deleteRoute('${route._id}')">

🗑 Delete

</button>

</div>

</div>

`;

    });

}
/* ==========================================================
                    SAVE ROUTE
========================================================== */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        loader.classList.add("show");

        await apiFetch(

            "/transport",

            {

                method: "POST",

                auth: true,

                body: {

                    routeName: document.getElementById("routeName").value.trim(),

                    vehicleNumber: document.getElementById("vehicleNumber").value.trim(),

                    driverName: document.getElementById("driverName").value.trim(),

                    monthlyFee: Number(

                        document.getElementById("monthlyFee").value

                    ),

                    status: document.getElementById("routeStatus").value

                }

            }

        );

        closeRouteModal();

        showToast("Route Created Successfully");

        await loadRoutes();

    }

    catch (err) {

        console.error(err);

        showToast(err.message);

    }

    finally {

        loader.classList.remove("show");

    }

});


/* ==========================================================
                    DELETE ROUTE
========================================================== */

async function deleteRoute(id) {

    const confirmDelete = confirm(

        "Are you sure you want to delete this route?"

    );

    if (!confirmDelete) return;

    try {

        loader.classList.add("show");

        await apiFetch(

            "/transport/" + id,

            {

                method: "DELETE",

                auth: true

            }

        );

        showToast("Route Deleted Successfully");

        await loadRoutes();

    }

    catch (err) {

        console.error(err);

        showToast(err.message);

    }

    finally {

        loader.classList.remove("show");

    }

}


/* ==========================================================
                    EDIT ROUTE
========================================================== */

function editRoute(id){

    showToast("Edit Route feature coming soon.");

}


/* ==========================================================
                    VIEW DETAILS
========================================================== */

function viewRoute(id){

    window.location.href =

        "../stops/index.html?route=" + id;

}
/* ==========================================================
                    SEARCH
========================================================== */

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value.toLowerCase();

    const cards = document.querySelectorAll(".route-card");

    cards.forEach(card => {

        card.style.display = card.innerText
            .toLowerCase()
            .includes(keyword)
                ? ""
                : "none";

    });

});

/* ==========================================================
                    STATUS FILTER
========================================================== */

filterStatus.addEventListener("change", applyFilter);

function applyFilter() {

    const status = filterStatus.value
        .toLowerCase();

    const cards = document.querySelectorAll(".route-card");

    cards.forEach(card => {

        if (!status) {

            card.style.display = "";

            return;

        }

        const badge = card.querySelector(".route-status");

        const value = badge.innerText
            .toLowerCase()
            .trim();

        card.style.display =

            value === status

                ? ""

                : "none";

    });

}

/* ==========================================================
                    TOAST
========================================================== */

function showToast(message) {

    if (!toast) return;

    toast.querySelector("span").textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

/* ==========================================================
                    HELPER
========================================================== */

function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() +

        text.slice(1);

}

/* ==========================================================
                    DASHBOARD REFRESH
========================================================== */

function refreshSummary() {

    totalRoutes.textContent = routes.length;

    activeRoutes.textContent =

        routes.filter(route =>

            route.status === "active"

        ).length;

}

/* ==========================================================
                    READY
========================================================== */

console.log("====================================");

console.log("AcademiaX Routes Module Loaded");

console.log("Frontend : Connected");

console.log("Backend  : Connected");

console.log("MongoDB  : Ready");

console.log("====================================");