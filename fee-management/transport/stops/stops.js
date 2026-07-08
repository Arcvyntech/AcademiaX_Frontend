/* ==========================================================
   AcademiaX ERP
   Transport Stops
   Version : 4.0
========================================================== */

let routes = [];
let stops = [];

let selectedRouteId = null;

let editMode = false;
let editingStopId = null;

const params = new URLSearchParams(window.location.search);
selectedRouteId = params.get("route");

/* ==========================================================
ELEMENTS
========================================================== */

const backBtn = document.getElementById("backBtn");

const refreshBtn = document.getElementById("refreshBtn");

const addStopBtn = document.getElementById("addStopBtn");

const addStopToolbar = document.getElementById("addStopToolbar");

const createFirstStop = document.getElementById("createFirstStop");

const routeSelect = document.getElementById("routeSelect");

const routeName = document.getElementById("routeName");

const routeDescription = document.getElementById("routeDescription");

const totalStops = document.getElementById("totalStops");

const activeStops = document.getElementById("activeStops");

const totalStudents = document.getElementById("totalStudents");

const routeFee = document.getElementById("routeFee");

const stopCountLabel = document.getElementById("stopCountLabel");

const stopsContainer = document.getElementById("stopsContainer");

const modal = document.getElementById("stopModal");

const closeModal = document.getElementById("closeModal");

const cancelBtn = document.getElementById("cancelBtn");

const form = document.getElementById("stopForm");

const loader = document.getElementById("loader");

const toast = document.getElementById("toast");

const searchInput = document.getElementById("searchStop");

const filterStatus = document.getElementById("filterStatus");

/* ==========================================================
PAGE LOAD
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        await loadRoutes();

    }

);

/* ==========================================================
LOAD ROUTES
========================================================== */

async function loadRoutes(){

    try{

        loader.classList.add("show");

        const response = await apiFetch(

            "/transport",

            {

                auth:true

            }

        );

        routes = response.data || [];

        renderRouteDropdown();

        if(selectedRouteId){

            routeSelect.value = selectedRouteId;

            await loadStops(selectedRouteId);

        }

    }

    catch(err){

        console.error(err);

        showToast(

            err.message ||

            "Unable to load routes."

        );

    }

    finally{

        loader.classList.remove("show");

    }

}

/* ==========================================================
ROUTE DROPDOWN
========================================================== */

function renderRouteDropdown(){

    routeSelect.innerHTML =

    `<option value="">

    Select Transport Route

    </option>`;

    routes.forEach(route=>{

        routeSelect.innerHTML +=

        `

<option value="${route._id}">

${route.routeName}

</option>

`;

    });

}
/* ==========================================================
ROUTE CHANGE
========================================================== */

routeSelect.addEventListener(

    "change",

    async ()=>{

        selectedRouteId = routeSelect.value;

        if(!selectedRouteId){

            clearDashboard();

            return;

        }

        history.replaceState(

            {},

            "",

            "?route=" + selectedRouteId

        );

        await loadStops(selectedRouteId);

    }

);

/* ==========================================================
REFRESH
========================================================== */

refreshBtn.onclick = async ()=>{

    if(!selectedRouteId){

        showToast(

            "Please select a route."

        );

        return;

    }

    await loadStops(selectedRouteId);

    showToast(

        "Transport Stops Refreshed"

    );

};

backBtn.onclick = ()=>history.back();

/* ==========================================================
LOAD STOPS
========================================================== */

async function loadStops(routeId){

    try{

        loader.classList.add("show");

        const route = routes.find(

            r=>r._id===routeId

        );

        if(route){

            routeName.textContent =

            route.routeName;

            routeDescription.textContent =

            `Vehicle : ${route.vehicleNumber} • Driver : ${route.driverName}`;

            routeFee.textContent =

            "₹ " +

            (route.monthlyFee || 0);

        }

        const response = await apiFetch(

            "/transport/stops/" + routeId,

            {

                auth:true

            }

        );

        stops = response.data || [];

        renderStops();

    }

    catch(err){

        console.error(err);

        showToast(

            err.message ||

            "Unable to load transport stops."

        );

    }

    finally{

        loader.classList.remove("show");

    }

}

/* ==========================================================
RENDER STOPS
========================================================== */

function renderStops(){

    totalStops.textContent =

    stops.length;

    activeStops.textContent =

    stops.filter(

        stop=>stop.status==="active"

    ).length;

    totalStudents.textContent =

    stops.reduce(

        (sum,stop)=>

        sum+(stop.studentsCount||0),

        0

    );

    stopCountLabel.textContent =

    `${stops.length} Stops`;

    if(!stops.length){

        renderEmptyState();

        return;

    }

    stopsContainer.innerHTML = "";

    stops.forEach(stop=>{

        stopsContainer.innerHTML += `

<div class="stop-card">

<div class="stop-header">

<div>

<div class="stop-title">

📍 ${stop.stopName}

</div>

</div>

<div class="stop-status ${stop.status}">

${capitalize(stop.status)}

</div>

</div>

<div class="stop-info">

<div class="info-box">

<label>

Order

</label>

<span>

#${stop.stopOrder}

</span>

</div>

<div class="info-box">

<label>

Pickup

</label>

<span>

${stop.pickupTime || "--"}

</span>

</div>

<div class="info-box">

<label>

Distance

</label>

<span>

${stop.distance || 0} KM

</span>

</div>

<div class="info-box">

<label>

Students

</label>

<span>

${stop.studentsCount || 0}

</span>

</div>

</div>

<div class="stop-actions">

<button

class="edit-btn"

onclick="editStop('${stop._id}')">

Edit

</button>

<button

class="delete-btn"

onclick="deleteStop('${stop._id}')">

Delete

</button>

</div>

</div>

`;

    });

}
/* ==========================================================
MODAL
========================================================== */

function openModal() {

    if (!selectedRouteId) {

        showToast("Please select a transport route first.");

        return;

    }

    modal.classList.add("active");

}

function closeStopModal() {

    modal.classList.remove("active");

    form.reset();

    editMode = false;

    editingStopId = null;

    form.querySelector(".primary-btn").innerHTML =

        "💾 Save Stop";

}

addStopBtn.onclick = openModal;

if (addStopToolbar)
    addStopToolbar.onclick = openModal;

if (createFirstStop)
    createFirstStop.onclick = openModal;

closeModal.onclick = closeStopModal;

cancelBtn.onclick = closeStopModal;

window.onclick = (e) => {

    if (e.target === modal)

        closeStopModal();

};

/* ==========================================================
EDIT STOP
========================================================== */

async function editStop(id) {

    const stop = stops.find(

        s => s._id === id

    );

    if (!stop) {

        showToast("Stop not found.");

        return;

    }

    editMode = true;

    editingStopId = id;

    document.getElementById("stopName").value =
        stop.stopName;

    document.getElementById("stopOrder").value =
        stop.stopOrder;

    document.getElementById("pickupTime").value =
        stop.pickupTime || "";

    document.getElementById("distance").value =
        stop.distance || "";

    document.getElementById("monthlyFee").value =
        stop.monthlyFee || "";

    document.getElementById("stopStatus").value =
        stop.status;

    form.querySelector(".primary-btn").innerHTML =

        "✏ Update Stop";

    modal.classList.add("active");

}

/* ==========================================================
SAVE / UPDATE STOP
========================================================== */

form.addEventListener(

    "submit",

    async (e) => {

        e.preventDefault();

        try {

            loader.classList.add("show");

            const payload = {

                routeId: selectedRouteId,

                stopName: document.getElementById("stopName").value.trim(),

                stopOrder: Number(document.getElementById("stopOrder").value),

                pickupTime: document.getElementById("pickupTime").value,

                distance: Number(document.getElementById("distance").value || 0),

                monthlyFee: Number(document.getElementById("monthlyFee").value || 0),

                status: document.getElementById("stopStatus").value

            };

            if (editMode) {

                await apiFetch(

                    "/transport/stops/" + editingStopId,

                    {

                        method: "PUT",

                        auth: true,

                        body: payload

                    }

                );

                showToast("Stop Updated Successfully");

            }

            else {

                await apiFetch(

                    "/transport/stops",

                    {

                        method: "POST",

                        auth: true,

                        body: payload

                    }

                );

                showToast("Stop Added Successfully");

            }

            closeStopModal();

            await loadStops(selectedRouteId);

        }

        catch (err) {

            console.error(err);

            showToast(

                err.message ||

                "Unable to save stop."

            );

        }

        finally {

            loader.classList.remove("show");

        }

    }

);

/* ==========================================================
DELETE STOP
========================================================== */

async function deleteStop(id) {

    if (!confirm("Delete this transport stop?"))

        return;

    try {

        loader.classList.add("show");

        await apiFetch(

            "/transport/stops/" + id,

            {

                method: "DELETE",

                auth: true

            }

        );

        showToast(

            "Stop Deleted Successfully"

        );

        await loadStops(selectedRouteId);

    }

    catch (err) {

        console.error(err);

        showToast(

            err.message ||

            "Unable to delete stop."

        );

    }

    finally {

        loader.classList.remove("show");

    }

}
/* ==========================================================
SEARCH STOP
========================================================== */

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value
        .toLowerCase()
        .trim();

    document.querySelectorAll(".stop-card")
        .forEach(card => {

            const text = card.innerText.toLowerCase();

            card.style.display =
                text.includes(keyword)
                    ? ""
                    : "none";

        });

});

/* ==========================================================
STATUS FILTER
========================================================== */

filterStatus.addEventListener("change", () => {

    const status = filterStatus.value
        .toLowerCase();

    document.querySelectorAll(".stop-card")
        .forEach(card => {

            if (!status) {

                card.style.display = "";

                return;

            }

            const value = card
                .querySelector(".stop-status")
                .innerText
                .toLowerCase()
                .trim();

            card.style.display =
                value === status
                    ? ""
                    : "none";

        });

});

/* ==========================================================
EMPTY STATE
========================================================== */

function renderEmptyState() {

    stopCountLabel.textContent = "0 Stops";

    stopsContainer.innerHTML = `

<div class="empty-state">

<div class="empty-icon">

🚌

</div>

<h2>

No Stops Found

</h2>

<p>

No transport stops are available for this route.

Click the button below to create your first stop.

</p>

<button

class="primary-btn"

onclick="openModal()">

+ Create First Stop

</button>

</div>

`;

}

/* ==========================================================
CLEAR DASHBOARD
========================================================== */

function clearDashboard() {

    routeName.textContent =

        "No Route Selected";

    routeDescription.textContent =

        "Select a route to manage transport stops.";

    totalStops.textContent = 0;

    activeStops.textContent = 0;

    totalStudents.textContent = 0;

    routeFee.textContent = "₹ 0";

    renderEmptyState();

}

/* ==========================================================
TOAST
========================================================== */

function showToast(message) {

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

    return text.charAt(0).toUpperCase()

        + text.slice(1);

}

/* ==========================================================
KEYBOARD SHORTCUTS
========================================================== */

document.addEventListener(

    "keydown",

    (e) => {

        if (

            e.key === "Escape"

            &&

            modal.classList.contains("active")

        ) {

            closeStopModal();

        }

    }

);

/* ==========================================================
READY
========================================================== */

console.log("====================================");

console.log("AcademiaX ERP");

console.log("Transport Stops Module");

console.log("Version : 4.0");

console.log("Frontend : Ready");

console.log("Backend : Connected");

console.log("Website : Ready");

console.log("Staff App : Ready");

console.log("Parent App : Ready");

console.log("====================================");