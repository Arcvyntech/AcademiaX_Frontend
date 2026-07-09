/* ==========================================================
   AcademiaX ERP
   Transport Vehicles
   Version : 1.0
========================================================== */

let vehicles = [];
let routes = [];

let editMode = false;
let editingVehicleId = null;

/* ==========================================================
ELEMENTS
========================================================== */

const backBtn = document.getElementById("backBtn");

const refreshBtn = document.getElementById("refreshBtn");

const addVehicleBtn = document.getElementById("addVehicleBtn");

const addVehicleToolbar = document.getElementById("addVehicleToolbar");

const vehicleTableBody = document.getElementById("vehiclesTableBody");

const vehicleCountLabel = document.getElementById("vehicleCountLabel");

const totalVehicles = document.getElementById("totalVehicles");

const activeVehicles = document.getElementById("activeVehicles");

const assignedStudents = document.getElementById("assignedStudents");

const totalCapacity = document.getElementById("totalCapacity");

const modal = document.getElementById("vehicleModal");

const form = document.getElementById("vehicleForm");

const loader = document.getElementById("loader");

const toast = document.getElementById("toast");

const searchInput = document.getElementById("searchVehicle");

const filterStatus = document.getElementById("filterStatus");

const filterType = document.getElementById("filterType");

const closeModal = document.getElementById("closeModal");

const cancelBtn = document.getElementById("cancelBtn");

const routeSelect = document.getElementById("routeId");

/* ==========================================================
PAGE LOAD
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        await loadRoutes();

        await loadVehicles();

    }

);

/* ==========================================================
LOAD ROUTES
========================================================== */

async function loadRoutes(){

    try{

        const response = await apiFetch(

            "/transport",

            {

                auth:true

            }

        );

        routes = response.data || [];

        renderRouteDropdown();

    }

    catch(err){

        console.error(err);

        showToast(

            err.message ||

            "Unable to load routes."

        );

    }

}

/* ==========================================================
ROUTE DROPDOWN
========================================================== */

function renderRouteDropdown(){

    routeSelect.innerHTML =

    `<option value="">

    Select Route

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
LOAD VEHICLES
========================================================== */

async function loadVehicles(){

    try{

        loader.classList.add("show");

        const response = await apiFetch(

            "/transport/vehicles",

            {

                auth:true

            }

        );

        vehicles = response.data || [];

        updateSummary();

        renderVehicles();

    }

    catch(err){

        console.error(err);

        showToast(

            err.message ||

            "Unable to load vehicles."

        );

    }

    finally{

        loader.classList.remove("show");

    }

}

/* ==========================================================
SUMMARY
========================================================== */

function updateSummary(){

    totalVehicles.textContent =

        vehicles.length;

    activeVehicles.textContent =

        vehicles.filter(

            v=>v.status==="active"

        ).length;

    assignedStudents.textContent =

        vehicles.reduce(

            (sum,v)=>sum+(v.assignedStudents||0),

            0

        );

    totalCapacity.textContent =

        vehicles.reduce(

            (sum,v)=>sum+(v.capacity||0),

            0

        );

    vehicleCountLabel.textContent =

        `${vehicles.length} Vehicles`;

}

/* ==========================================================
RENDER VEHICLES
========================================================== */

function renderVehicles(){

    if(!vehicles.length){

        vehicleTableBody.innerHTML=

        `

<tr>

<td colspan="8">

<div class="empty-table">

No Vehicles Found

</div>

</td>

</tr>

`;

        return;

    }

    vehicleTableBody.innerHTML="";

    vehicles.forEach(vehicle=>{

        vehicleTableBody.innerHTML += `

<tr>

<td>

<strong>

${vehicle.vehicleNumber}

</strong>

</td>

<td>

${vehicle.vehicleName || "--"}

</td>

<td>

${vehicle.vehicleType}

</td>

<td>

${vehicle.routeId?.routeName || "--"}

</td>

<td>

${vehicle.capacity}

</td>

<td>

${vehicle.assignedStudents || 0}

</td>

<td>

<span class="status-badge ${vehicle.status}">

${capitalize(vehicle.status)}

</span>

</td>

<td>

<div class="table-actions">

<button

class="edit-btn"

onclick="editVehicle('${vehicle._id}')">

Edit

</button>

<button

class="delete-btn"

onclick="deleteVehicle('${vehicle._id}')">

Delete

</button>

</div>

</td>

</tr>

`;

    });

}
/* ==========================================================
   MODAL
========================================================== */

function openModal() {

    modal.classList.add("active");

}

function closeVehicleModal() {

    modal.classList.remove("active");

    form.reset();

    editMode = false;

    editingVehicleId = null;

    form.querySelector(".primary-btn").innerHTML =

        "💾 Save Vehicle";

}

addVehicleBtn.onclick = openModal;

addVehicleToolbar.onclick = openModal;

closeModal.onclick = closeVehicleModal;

cancelBtn.onclick = closeVehicleModal;

window.onclick = (e) => {

    if (e.target === modal) {

        closeVehicleModal();

    }

};

/* ==========================================================
   EDIT VEHICLE
========================================================== */

function editVehicle(id) {

    const vehicle = vehicles.find(

        v => v._id === id

    );

    if (!vehicle) {

        showToast("Vehicle not found.");

        return;

    }

    editMode = true;

    editingVehicleId = id;

    document.getElementById("vehicleNumber").value =
        vehicle.vehicleNumber || "";

    document.getElementById("vehicleName").value =
        vehicle.vehicleName || "";

    document.getElementById("registrationNumber").value =
        vehicle.registrationNumber || "";

    document.getElementById("vehicleType").value =
        vehicle.vehicleType || "Bus";

    document.getElementById("capacity").value =
        vehicle.capacity || "";

    document.getElementById("routeId").value =
        vehicle.routeId?._id || "";

    document.getElementById("manufacturer").value =
        vehicle.manufacturer || "";

    document.getElementById("model").value =
        vehicle.model || "";

    document.getElementById("insuranceExpiry").value =
        vehicle.insuranceExpiry
            ? vehicle.insuranceExpiry.substring(0,10)
            : "";

    document.getElementById("fitnessExpiry").value =
        vehicle.fitnessExpiry
            ? vehicle.fitnessExpiry.substring(0,10)
            : "";

    document.getElementById("pollutionExpiry").value =
        vehicle.pollutionExpiry
            ? vehicle.pollutionExpiry.substring(0,10)
            : "";

    document.getElementById("vehicleStatus").value =
        vehicle.status;

    document.getElementById("notes").value =
        vehicle.notes || "";

    form.querySelector(".primary-btn").innerHTML =

        "✏ Update Vehicle";

    modal.classList.add("active");

}

/* ==========================================================
   SAVE / UPDATE VEHICLE
========================================================== */

form.addEventListener(

    "submit",

    async (e) => {

        e.preventDefault();

        try {

            loader.classList.add("show");

            const payload = {

                vehicleNumber:

                    document.getElementById("vehicleNumber")
                    .value
                    .trim(),

                vehicleName:

                    document.getElementById("vehicleName")
                    .value
                    .trim(),

                registrationNumber:

                    document.getElementById("registrationNumber")
                    .value
                    .trim(),

                vehicleType:

                    document.getElementById("vehicleType")
                    .value,

                capacity:

                    Number(

                        document.getElementById("capacity")
                        .value

                    ),

                routeId:

                    document.getElementById("routeId")
                    .value || null,

                manufacturer:

                    document.getElementById("manufacturer")
                    .value
                    .trim(),

                model:

                    document.getElementById("model")
                    .value
                    .trim(),

                insuranceExpiry:

                    document.getElementById("insuranceExpiry")
                    .value || null,

                fitnessExpiry:

                    document.getElementById("fitnessExpiry")
                    .value || null,

                pollutionExpiry:

                    document.getElementById("pollutionExpiry")
                    .value || null,

                status:

                    document.getElementById("vehicleStatus")
                    .value,

                notes:

                    document.getElementById("notes")
                    .value
                    .trim()

            };

            if (editMode) {

                await apiFetch(

                    "/transport/vehicles/" + editingVehicleId,

                    {

                        method: "PUT",

                        auth: true,

                        body: payload

                    }

                );

                showToast(

                    "Vehicle Updated Successfully"

                );

            }

            else {

                await apiFetch(

                    "/transport/vehicles",

                    {

                        method: "POST",

                        auth: true,

                        body: payload

                    }

                );

                showToast(

                    "Vehicle Added Successfully"

                );

            }

            closeVehicleModal();

            await loadVehicles();

        }

        catch (err) {

            console.error(err);

            showToast(

                err.message ||

                "Unable to save vehicle."

            );

        }

        finally {

            loader.classList.remove("show");

        }

    }

);
/* ==========================================================
   DELETE VEHICLE
========================================================== */

async function deleteVehicle(id) {

    if (!confirm("Delete this vehicle?")) return;

    try {

        loader.classList.add("show");

        await apiFetch(

            "/transport/vehicles/" + id,

            {
                method: "DELETE",
                auth: true
            }

        );

        showToast("Vehicle Deleted Successfully");

        await loadVehicles();

    }

    catch (err) {

        console.error(err);

        showToast(

            err.message ||

            "Unable to delete vehicle."

        );

    }

    finally {

        loader.classList.remove("show");

    }

}

/* ==========================================================
   SEARCH VEHICLE
========================================================== */

searchInput.addEventListener(

    "keyup",

    () => {

        const keyword =

            searchInput.value

            .toLowerCase()

            .trim();

        document

            .querySelectorAll("tbody tr")

            .forEach(row => {

                const text =

                    row.innerText.toLowerCase();

                row.style.display =

                    text.includes(keyword)

                        ? ""

                        : "none";

            });

    }

);

/* ==========================================================
   STATUS FILTER
========================================================== */

filterStatus.addEventListener(

    "change",

    applyFilters

);

/* ==========================================================
   TYPE FILTER
========================================================== */

filterType.addEventListener(

    "change",

    applyFilters

);

function applyFilters() {

    const status =

        filterStatus.value.toLowerCase();

    const type =

        filterType.value.toLowerCase();

    document

        .querySelectorAll("tbody tr")

        .forEach(row => {

            let visible = true;

            if (status) {

                const badge = row.querySelector(".status-badge");

                if (

                    !badge ||

                    !badge.innerText

                        .toLowerCase()

                        .includes(status)

                ) {

                    visible = false;

                }

            }

            if (type) {

                const cells = row.querySelectorAll("td");

                if (

                    cells.length > 2 &&

                    !cells[2]

                        .innerText

                        .toLowerCase()

                        .includes(type)

                ) {

                    visible = false;

                }

            }

            row.style.display = visible ? "" : "none";

        });

}

/* ==========================================================
   REFRESH
========================================================== */

refreshBtn.onclick = async () => {

    await loadVehicles();

    showToast(

        "Vehicles Refreshed"

    );

};

/* ==========================================================
   BACK
========================================================== */

backBtn.onclick = () => history.back();

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
   HELPERS
========================================================== */

function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase()

        + text.slice(1);

}

/* ==========================================================
   KEYBOARD SHORTCUT
========================================================== */

document.addEventListener(

    "keydown",

    e => {

        if (

            e.key === "Escape" &&

            modal.classList.contains("active")

        ) {

            closeVehicleModal();

        }

    }

);

/* ==========================================================
   READY
========================================================== */

console.log("====================================");

console.log("AcademiaX ERP");

console.log("Transport Vehicles Module");

console.log("Version : 1.0");

console.log("Frontend : Ready");

console.log("Backend : Connected");

console.log("Website : Ready");

console.log("Staff App : Ready");

console.log("Parent App : Ready");

console.log("====================================");