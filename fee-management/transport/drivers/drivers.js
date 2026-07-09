/* ==========================================================
   AcademiaX ERP
   Transport Driver Module
   Version : 2.0
========================================================== */

let drivers = [];
let vehicles = [];
let routes = [];

let editMode = false;
let editingDriverId = null;

/* ==========================================================
ELEMENTS
========================================================== */

const backBtn = document.getElementById("backBtn");
const refreshBtn = document.getElementById("refreshBtn");

const addDriverBtn = document.getElementById("addDriverBtn");
const createFirstDriver = document.getElementById("createFirstDriver");

const modal = document.getElementById("driverModal");
const form = document.getElementById("driverForm");

const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

const driversContainer =
document.getElementById("driversContainer");

const totalDrivers =
document.getElementById("totalDrivers");

const activeDrivers =
document.getElementById("activeDrivers");

const assignedVehicles =
document.getElementById("assignedVehicles");

const licenseExpiry =
document.getElementById("licenseExpiry");

const driverCountLabel =
document.getElementById("driverCountLabel");

const searchDriver =
document.getElementById("searchDriver");

const statusFilter =
document.getElementById("statusFilter");

const vehicleFilter =
document.getElementById("vehicleFilter");

const assignedVehicle =
document.getElementById("assignedVehicle");

const assignedRoute =
document.getElementById("assignedRoute");

/* ==========================================================
PAGE LOAD
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initDriverModule

);

/* ==========================================================
INITIALIZE
========================================================== */

async function initDriverModule(){

    try{

        showLoader();

        await Promise.all([

            loadVehicles(),

            loadRoutes(),

            loadDrivers()

        ]);

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load Driver Module"

        );

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================
LOAD VEHICLES
========================================================== */

async function loadVehicles(){

    const response = await apiFetch(

        "/transport/vehicles",

        {

            auth:true

        }

    );

    vehicles = response.data || [];

    renderVehicleDropdown();

}

/* ==========================================================
LOAD ROUTES
========================================================== */

async function loadRoutes(){

    const response = await apiFetch(

        "/transport",

        {

            auth:true

        }

    );

    routes = response.data || [];

    renderRouteDropdown();

}

/* ==========================================================
LOAD DRIVERS
========================================================== */

async function loadDrivers(){

    const response = await apiFetch(

        "/transport/drivers",

        {

            auth:true

        }

    );

    drivers = response.data || [];

    updateSummaryCards();

    renderDrivers();

}

/* ==========================================================
REFRESH
========================================================== */

refreshBtn.addEventListener(

    "click",

    async()=>{

        await initDriverModule();

        showToast(

            "Driver list refreshed."

        );

    }

);

backBtn.addEventListener(

    "click",

    ()=>history.back()

);
/* ==========================================================
   SUMMARY CARDS
========================================================== */

function updateSummaryCards(){

    totalDrivers.textContent = drivers.length;

    activeDrivers.textContent =
        drivers.filter(d=>d.status==="active").length;

    assignedVehicles.textContent =
        drivers.filter(d=>d.assignedVehicle).length;

    const today = new Date();

    const after30 = new Date();

    after30.setDate(today.getDate()+30);

    licenseExpiry.textContent =
        drivers.filter(driver=>{

            if(!driver.licenseExpiryDate) return false;

            const expiry = new Date(driver.licenseExpiryDate);

            return expiry>=today && expiry<=after30;

        }).length;

    driverCountLabel.textContent =
        `${drivers.length} Drivers`;

}

/* ==========================================================
   VEHICLE DROPDOWN
========================================================== */

function renderVehicleDropdown(){

    vehicleFilter.innerHTML =
    `<option value="">All Vehicles</option>`;

    assignedVehicle.innerHTML =
    `<option value="">Select Vehicle</option>`;

    vehicles.forEach(vehicle=>{

        vehicleFilter.innerHTML += `

<option value="${vehicle._id}">

${vehicle.vehicleNumber}

</option>

`;

        assignedVehicle.innerHTML += `

<option value="${vehicle._id}">

${vehicle.vehicleNumber}

</option>

`;

    });

}

/* ==========================================================
   ROUTE DROPDOWN
========================================================== */

function renderRouteDropdown(){

    assignedRoute.innerHTML =
    `<option value="">Select Route</option>`;

    routes.forEach(route=>{

        assignedRoute.innerHTML += `

<option value="${route._id}">

${route.routeName}

</option>

`;

    });

}

/* ==========================================================
   RENDER DRIVERS
========================================================== */

function renderDrivers(){

    if(!drivers.length){

        renderEmptyState();

        return;

    }

    driversContainer.innerHTML="";

    drivers.forEach(driver=>{

        /* ==========================================
           FIX FOR POPULATED & NON POPULATED DATA
        ========================================== */

        let vehicleName="--";
        let routeName="--";

        if(driver.assignedVehicle){

            if(typeof driver.assignedVehicle==="object"){

                vehicleName =
                driver.assignedVehicle.vehicleNumber || "--";

            }

            else{

                const vehicle = vehicles.find(

                    v=>v._id===driver.assignedVehicle

                );

                if(vehicle){

                    vehicleName=vehicle.vehicleNumber;

                }

            }

        }

        if(driver.assignedRoute){

            if(typeof driver.assignedRoute==="object"){

                routeName =
                driver.assignedRoute.routeName || "--";

            }

            else{

                const route = routes.find(

                    r=>r._id===driver.assignedRoute

                );

                if(route){

                    routeName=route.routeName;

                }

            }

        }

        /* ==========================================
           LICENSE STATUS
        ========================================== */

        let licenseClass="license-valid";

        let licenseText="Valid";

        if(driver.licenseExpiryDate){

            const expiry = new Date(driver.licenseExpiryDate);

            const diff =
            Math.ceil(

                (expiry-new Date())/

                (1000*60*60*24)

            );

            if(diff<=30){

                licenseClass="license-expiring";

                licenseText="Expiring Soon";

            }

        }

        driversContainer.innerHTML += `

<div class="driver-card">

<div class="driver-header">

<div class="driver-profile">

<div class="driver-avatar">

${driver.driverName.charAt(0).toUpperCase()}

</div>

<div>

<div class="driver-name">

${driver.driverName}

</div>

<div class="driver-mobile">

📞 ${driver.mobileNumber}

</div>

</div>

</div>

<div class="status-badge ${driver.status}">

${capitalize(driver.status)}

</div>

</div>

<div class="driver-info">

<div class="info-item">

<label>License</label>

<span>

${driver.licenseNumber}

</span>

</div>

<div class="info-item">

<label>Experience</label>

<span>

${driver.experience || 0} Years

</span>

</div>

<div class="info-item">

<label>Vehicle</label>

<span class="vehicle-badge">

${vehicleName}

</span>

</div>

<div class="info-item">

<label>Route</label>

<span>

${routeName}

</span>

</div>

<div class="info-item">

<label>License Status</label>

<span class="${licenseClass}">

${licenseText}

</span>

</div>

<div class="info-item">

<label>Expiry Date</label>

<span>

${driver.licenseExpiryDate ?

new Date(driver.licenseExpiryDate)

.toLocaleDateString()

:

"--"}

</span>

</div>

</div>

<div class="driver-actions">

<button

class="edit-btn"

onclick="editDriver('${driver._id}')">

✏ Edit

</button>

<button

class="delete-btn"

onclick="deleteDriver('${driver._id}')">

🗑 Delete

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

    editMode = false;

    editingDriverId = null;

    form.reset();

    form.querySelector(".primary-btn").innerHTML =
    "💾 Save Driver";

    modal.classList.add("active");

}

function closeDriverModal() {

    modal.classList.remove("active");

    form.reset();

    editMode = false;

    editingDriverId = null;

}

addDriverBtn.addEventListener("click", openModal);

if (createFirstDriver) {

    createFirstDriver.addEventListener("click", openModal);

}

closeModalBtn.addEventListener("click", closeDriverModal);

cancelBtn.addEventListener("click", closeDriverModal);

window.addEventListener("click", (e) => {

    if (e.target === modal) {

        closeDriverModal();

    }

});

/* ==========================================================
   SAVE / UPDATE DRIVER
========================================================== */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        showLoader();

        const payload = {

            driverName:
            document.getElementById("driverName").value.trim(),

            mobileNumber:
            document.getElementById("mobileNumber").value.trim(),

            licenseNumber:
            document.getElementById("licenseNumber").value.trim(),

            licenseExpiryDate:
            document.getElementById("licenseExpiryDate").value,

            assignedVehicle:
            assignedVehicle.value || null,

            assignedRoute:
            assignedRoute.value || null,

            experience:
            Number(
                document.getElementById("experience").value || 0
            ),

            status:
            document.getElementById("driverStatus").value

        };

        if (editMode) {

            await apiFetch(

                "/transport/drivers/" + editingDriverId,

                {

                    method: "PUT",

                    auth: true,

                    body: payload

                }

            );

            showToast("Driver Updated Successfully");

        }

        else {

            await apiFetch(

                "/transport/drivers",

                {

                    method: "POST",

                    auth: true,

                    body: payload

                }

            );

            showToast("Driver Added Successfully");

        }

        closeDriverModal();

        await initDriverModule();

    }

    catch (err) {

        console.error(err);

        showToast(

            err.message ||

            "Unable to save driver."

        );

    }

    finally {

        hideLoader();

    }

});

/* ==========================================================
   EDIT DRIVER
========================================================== */

function editDriver(id) {

    const driver = drivers.find(

        d => d._id === id

    );

    if (!driver) {

        showToast("Driver not found.");

        return;

    }

    editMode = true;

    editingDriverId = id;

    document.getElementById("driverName").value =
    driver.driverName;

    document.getElementById("mobileNumber").value =
    driver.mobileNumber;

    document.getElementById("licenseNumber").value =
    driver.licenseNumber;

    document.getElementById("licenseExpiryDate").value =
    driver.licenseExpiryDate
        ? driver.licenseExpiryDate.substring(0,10)
        : "";

    assignedVehicle.value =
    typeof driver.assignedVehicle === "object"
        ? driver.assignedVehicle?._id || ""
        : driver.assignedVehicle || "";

    assignedRoute.value =
    typeof driver.assignedRoute === "object"
        ? driver.assignedRoute?._id || ""
        : driver.assignedRoute || "";

    document.getElementById("experience").value =
    driver.experience || "";

    document.getElementById("driverStatus").value =
    driver.status;

    form.querySelector(".primary-btn").innerHTML =
    "✏ Update Driver";

    modal.classList.add("active");

}

/* ==========================================================
   DELETE DRIVER
========================================================== */

async function deleteDriver(id){

    if(!confirm("Delete this driver?")) return;

    try{

        showLoader();

        await apiFetch(

            "/transport/drivers/" + id,

            {

                method:"DELETE",

                auth:true

            }

        );

        showToast("Driver Deleted");

        await initDriverModule();

    }

    catch(error){

        console.error(error);

        showToast("Unable to delete driver.");

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================
SEARCH
========================================================== */

searchDriver.addEventListener("keyup",()=>{

    const keyword =
    searchDriver.value.toLowerCase();

    document

    .querySelectorAll(".driver-card")

    .forEach(card=>{

        card.style.display =

        card.innerText

        .toLowerCase()

        .includes(keyword)

        ? ""

        : "none";

    });

});

/* ==========================================================
FILTER
========================================================== */

statusFilter.addEventListener("change",renderDrivers);

vehicleFilter.addEventListener("change",renderDrivers);

/* ==========================================================
EMPTY STATE
========================================================== */

function renderEmptyState(){

    driversContainer.innerHTML =

`<div class="empty-state">

<div class="empty-icon">

👨‍✈️

</div>

<h2>

No Drivers Found

</h2>

<p>

No transport driver has been added yet.

</p>

<button

class="primary-btn"

onclick="openModal()">

+ Add Driver

</button>

</div>`;

}

/* ==========================================================
LOADER
========================================================== */

function showLoader(){

    loader.classList.add("show");

}

function hideLoader(){

    loader.classList.remove("show");

}

/* ==========================================================
TOAST
========================================================== */

function showToast(message){

    toast.querySelector("span").innerText = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}

/* ==========================================================
HELPER
========================================================== */

function capitalize(text){

    if(!text) return "";

    return text.charAt(0).toUpperCase()

    +

    text.slice(1);

}

document.addEventListener(

    "keydown",

    (e)=>{

        if(

            e.key==="Escape"

            &&

            modal.classList.contains("active")

        ){

            closeDriverModal();

        }

    }

);

/* ==========================================================
READY
========================================================== */

console.log("================================");

console.log("AcademiaX ERP");

console.log("Driver Module Version 2.0 Ready");

console.log("================================");