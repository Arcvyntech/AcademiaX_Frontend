/* ==========================================================
   AcademiaX ERP
   Transport Student Mapping
   Version 3.0
========================================================== */

"use strict";

/* ==========================================================
GLOBAL DATA
========================================================== */

let students = [];
let mappings = [];
let routes = [];
let stops = [];
let vehicles = [];
let drivers = [];

let editMode = false;
let editingId = null;

/* ==========================================================
DOM
========================================================== */

const backBtn = document.getElementById("backBtn");
const refreshBtn = document.getElementById("refreshBtn");

const assignStudentBtn =
document.getElementById("assignStudentBtn");

const createFirstStudent =
document.getElementById("createFirstStudent");

const modal =
document.getElementById("studentModal");

const closeModal =
document.getElementById("closeModal");

const cancelBtn =
document.getElementById("cancelBtn");

const form =
document.getElementById("studentForm");

const loader =
document.getElementById("loader");

const toast =
document.getElementById("toast");

const studentsContainer =
document.getElementById("studentsContainer");

const totalStudents =
document.getElementById("totalStudents");

const transportStudents =
document.getElementById("transportStudents");

const activeRoutes =
document.getElementById("activeRoutes");

const monthlyCollection =
document.getElementById("monthlyCollection");

const studentCountLabel =
document.getElementById("studentCountLabel");

const searchStudent =
document.getElementById("searchStudent");

const classFilter =
document.getElementById("classFilter");

const routeFilter =
document.getElementById("routeFilter");

const statusFilter =
document.getElementById("statusFilter");

const studentSelect =
document.getElementById("studentId");

const assignedRoute =
document.getElementById("assignedRoute");

const assignedStop =
document.getElementById("assignedStop");

const assignedVehicle =
document.getElementById("assignedVehicle");

const assignedDriver =
document.getElementById("assignedDriver");

const monthlyFee =
document.getElementById("monthlyFee");

const mappingStatus =
document.getElementById("mappingStatus");

/* ==========================================================
LOADER
========================================================== */

function showLoader(){

    if(loader){

        loader.classList.add("show");

    }

}

function hideLoader(){

    if(loader){

        loader.classList.remove("show");

    }

}

/* ==========================================================
TOAST
========================================================== */

function showToast(message){

    if(!toast) return;

    const span = toast.querySelector("span");

    if(span){

        span.textContent = message;

    }

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}

/* ==========================================================
INITIALIZE
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    init

);

async function init(){

    try{

        showLoader();

        bindEvents();

        await loadAll();

    }

    catch(error){

        console.error(error);

        showToast("Unable to load module.");

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================
EVENTS
========================================================== */

function bindEvents(){

    if(backBtn){

        backBtn.onclick = ()=>{

            history.back();

        };

    }

    if(refreshBtn){

        refreshBtn.onclick = loadAll;

    }

    if(assignStudentBtn){

        assignStudentBtn.onclick = openModal;

    }

    if(createFirstStudent){

        createFirstStudent.onclick = openModal;

    }

    if(closeModal){

        closeModal.onclick = closeModalBox;

    }

    if(cancelBtn){

        cancelBtn.onclick = closeModalBox;

    }

    window.onclick=(e)=>{

        if(e.target===modal){

            closeModalBox();

        }

    };

}
/* ==========================================================
LOAD ALL
========================================================== */

async function loadAll(){

    showLoader();

    try{

        await Promise.all([

            loadStudents(),

            loadRoutes(),

            loadStops(),

            loadVehicles(),

            loadDrivers(),

            loadMappings()

        ]);

        updateSummary();

        renderStudentDropdown();

        renderRouteDropdown();

        renderVehicleDropdown();

        renderDriverDropdown();

        renderStopDropdown();
        renderMappings();

    }

    catch(error){

        console.error(error);

        showToast("Unable to load data.");

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================
API CALLS
========================================================== */

async function loadStudents(){

    const res = await apiFetch(

        "/admin/students",

        {

            auth:true

        }

    );

    students = res.data || [];

}

async function loadRoutes(){

    const res = await apiFetch(

        "/transport",

        {

            auth:true

        }

    );

    routes = res.data || [];

}

async function loadStops(){

    const res = await apiFetch(

        "/transport/stops",

        {

            auth:true

        }

    );

    stops = res.data || [];

}

async function loadVehicles(){

    const res = await apiFetch(

        "/transport/vehicles",

        {

            auth:true

        }

    );

    vehicles = res.data || [];

}

async function loadDrivers(){

    const res = await apiFetch(

        "/transport/drivers",

        {

            auth:true

        }

    );

    drivers = res.data || [];

}

async function loadMappings(){

    const res = await apiFetch(

        "/transport/students",

        {

            auth:true

        }

    );

    mappings = res.data || [];

}

/* ==========================================================
SUMMARY
========================================================== */

function updateSummary(){

    if(totalStudents)

        totalStudents.textContent = students.length;

    if(transportStudents)

        transportStudents.textContent = mappings.length;

    const routeIds = new Set();

    let fee = 0;

    mappings.forEach(mapping=>{

        if(mapping.assignedRoute){

            const id =

            typeof mapping.assignedRoute==="object"

            ?

            mapping.assignedRoute._id

            :

            mapping.assignedRoute;

            routeIds.add(id);

        }

        fee += Number(mapping.monthlyFee||0);

    });

    if(activeRoutes)

        activeRoutes.textContent = routeIds.size;

    if(monthlyCollection)

        monthlyCollection.textContent =

        "₹ " +

        fee.toLocaleString();

    if(studentCountLabel)

        studentCountLabel.textContent =

        mappings.length +

        " Students";

}

/* ==========================================================
STUDENT DROPDOWN
========================================================== */

function renderStudentDropdown(){

    if(!studentSelect) return;

    studentSelect.innerHTML =

    `<option value="">Select Student</option>`;

    const assigned =

    mappings.map(m=>

    typeof m.studentId==="object"

    ?

    m.studentId._id

    :

    m.studentId

    );

    students.forEach(student=>{

        if(

            !editMode &&

            assigned.includes(student._id)

        ){

            return;

        }

        studentSelect.innerHTML += `

<option value="${student._id}">

${student.studentName || student.name}

(${student.admissionNumber || student.admissionNo || "-"})

</option>

`;

    });

}

/* ==========================================================
ROUTE
========================================================== */

function renderRouteDropdown(){

    if(!assignedRoute) return;

    assignedRoute.innerHTML=

    `<option value="">Select Route</option>`;

    if(routeFilter){

        routeFilter.innerHTML=

        `<option value="">All Routes</option>`;

    }

    routes.forEach(route=>{

        assignedRoute.innerHTML += `

<option value="${route._id}">

${route.routeName}

</option>

`;

        if(routeFilter){

            routeFilter.innerHTML += `

<option value="${route._id}">

${route.routeName}

</option>

`;

        }

    });

}

/* ==========================================================
STOP
========================================================== */

function renderStopDropdown(routeId=""){

    if(!assignedStop) return;

    assignedStop.innerHTML=

    `<option value="">Select Stop</option>`;

    const filtered=

    routeId

    ?

    stops.filter(stop=>{

        const id=

        typeof stop.routeId==="object"

        ?

        stop.routeId._id

        :

        stop.routeId;

        return id===routeId;

    })

    :

    stops;

    filtered.forEach(stop=>{

        assignedStop.innerHTML += `

<option value="${stop._id}">

${stop.stopName}

</option>

`;

    });

}

/* ==========================================================
VEHICLE
========================================================== */

function renderVehicleDropdown(){

    if(!assignedVehicle) return;

    assignedVehicle.innerHTML=

    `<option value="">Select Vehicle</option>`;

    vehicles.forEach(vehicle=>{

        assignedVehicle.innerHTML += `

<option value="${vehicle._id}">

${vehicle.vehicleNumber}

</option>

`;

    });

}

/* ==========================================================
DRIVER
========================================================== */

function renderDriverDropdown(){

    if(!assignedDriver) return;

    assignedDriver.innerHTML=

    `<option value="">Select Driver</option>`;

    drivers.forEach(driver=>{

        assignedDriver.innerHTML += `

<option value="${driver._id}">

${driver.driverName}

</option>

`;

    });

}

/* ==========================================================
ROUTE CHANGE
========================================================== */

if(assignedRoute){

    assignedRoute.addEventListener(

        "change",

        ()=>{

            renderStopDropdown(

                assignedRoute.value

            );

        }

    );

}
/* ==========================================================
   RENDER STUDENT MAPPINGS
========================================================== */

function renderMappings(filteredData = mappings){

    if(!studentsContainer) return;

    studentsContainer.innerHTML="";

    if(!filteredData.length){

        renderEmptyState();

        return;

    }

    filteredData.forEach(mapping=>{

        const student =
        typeof mapping.studentId==="object"
        ?
        mapping.studentId
        :
        students.find(s=>s._id===mapping.studentId);

        const route =
        typeof mapping.assignedRoute==="object"
        ?
        mapping.assignedRoute
        :
        routes.find(r=>r._id===mapping.assignedRoute);

        const stop =
        typeof mapping.assignedStop==="object"
        ?
        mapping.assignedStop
        :
        stops.find(s=>s._id===mapping.assignedStop);

        const vehicle =
        typeof mapping.assignedVehicle==="object"
        ?
        mapping.assignedVehicle
        :
        vehicles.find(v=>v._id===mapping.assignedVehicle);

        const driver =
        typeof mapping.assignedDriver==="object"
        ?
        mapping.assignedDriver
        :
        drivers.find(d=>d._id===mapping.assignedDriver);

        studentsContainer.innerHTML += `

<div class="student-card">

<div class="student-header">

<div class="student-profile">

<div class="student-avatar">

${student ? (student.studentName || student.name || "S").charAt(0).toUpperCase() : "S"}

</div>

<div>

<div class="student-name">

${student ? (student.studentName || student.name) : "--"}

</div>

<div class="student-admission">

${student ? (student.admissionNumber || student.admissionNo || "--") : "--"}

</div>

</div>

</div>

<div class="status-badge ${mapping.status}">

${capitalize(mapping.status)}

</div>

</div>

<div class="student-info">

<div class="info-item">

<label>Route</label>

<span class="route-badge">

${route ? route.routeName : "--"}

</span>

</div>

<div class="info-item">

<label>Stop</label>

<span class="stop-badge">

${stop ? stop.stopName : "--"}

</span>

</div>

<div class="info-item">

<label>Vehicle</label>

<span class="vehicle-badge">

${vehicle ? vehicle.vehicleNumber : "--"}

</span>

</div>

<div class="info-item">

<label>Driver</label>

<span class="driver-badge">

${driver ? driver.driverName : "--"}

</span>

</div>

<div class="info-item">

<label>Monthly Fee</label>

<span class="fee-badge">

₹ ${Number(mapping.monthlyFee || 0).toLocaleString()}

</span>

</div>

</div>

<div class="student-actions">

<button
class="edit-btn"
onclick="editMapping('${mapping._id}')">

✏ Edit

</button>

<button
class="delete-btn"
onclick="deleteMapping('${mapping._id}')">

🗑 Delete

</button>

</div>

</div>

`;

    });

}

/* ==========================================================
EMPTY STATE
========================================================== */

function renderEmptyState(){

    studentsContainer.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

🎓

</div>

<h2>

No Transport Student Found

</h2>

<p>

Assign transport to your first student.

</p>

<button

class="primary-btn"

onclick="openModal()">

+ Assign Student

</button>

</div>

`;

}

/* ==========================================================
SEARCH
========================================================== */

if(searchStudent){

searchStudent.addEventListener(

"keyup",

applyFilters

);

}

/* ==========================================================
FILTERS
========================================================== */

if(routeFilter){

routeFilter.addEventListener(

"change",

applyFilters

);

}

if(statusFilter){

statusFilter.addEventListener(

"change",

applyFilters

);

}

if(classFilter){

classFilter.addEventListener(

"change",

applyFilters

);

}

function applyFilters(){

let data=[...mappings];

const keyword=

searchStudent.value

.toLowerCase()

.trim();

const route=

routeFilter.value;

const status=

statusFilter.value;

const className=

classFilter.value;

if(keyword){

data=data.filter(mapping=>{

const student=

typeof mapping.studentId==="object"

?

mapping.studentId

:

students.find(

s=>s._id===mapping.studentId

);

if(!student)

return false;

return(

(student.studentName||

student.name||

"")

.toLowerCase()

.includes(keyword)

||

(student.admissionNumber||

student.admissionNo||

"")

.toLowerCase()

.includes(keyword)

);

});

}

if(route){

data=data.filter(mapping=>{

const id=

typeof mapping.assignedRoute==="object"

?

mapping.assignedRoute._id

:

mapping.assignedRoute;

return id===route;

});

}

if(status){

data=data.filter(mapping=>

mapping.status===status

);

}

if(className){

data=data.filter(mapping=>{

const student=

typeof mapping.studentId==="object"

?

mapping.studentId

:

students.find(

s=>s._id===mapping.studentId

);

const cls=

student?.className||

student?.class||

"";

return cls===className;

});

}

renderMappings(data);

}

/* ==========================================================
HELPER
========================================================== */

function capitalize(text){

if(!text)

return "";

return text.charAt(0).toUpperCase()+text.slice(1);

}
/* ==========================================================
   MODAL
========================================================== */

function openModal() {

    editMode = false;

    editingId = null;

    form.reset();

    renderStudentDropdown();

    renderStopDropdown();

    modal.classList.add("active");

}

function closeModalBox() {

    modal.classList.remove("active");

    form.reset();

    editMode = false;

    editingId = null;

}

/* ==========================================================
SAVE / UPDATE
========================================================== */

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    try {

        showLoader();

        const payload = {

            studentId: studentSelect.value,

            assignedRoute: assignedRoute.value,

            assignedStop: assignedStop.value,

            assignedVehicle: assignedVehicle.value,

            assignedDriver: assignedDriver.value,

            monthlyFee: Number(monthlyFee.value || 0),

            status: mappingStatus.value

        };

        if (editMode) {

            await apiFetch(

                "/transport/students/" + editingId,

                {

                    method: "PUT",

                    auth: true,

                    body: payload

                }

            );

            showToast("Student mapping updated.");

        }

        else {

            await apiFetch(

                "/transport/students",

                {

                    method: "POST",

                    auth: true,

                    body: payload

                }

            );

            showToast("Student assigned successfully.");

        }

        closeModalBox();

        await loadAll();

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message ||

            "Unable to save mapping."

        );

    }

    finally {

        hideLoader();

    }

});

/* ==========================================================
EDIT
========================================================== */

function editMapping(id) {

    const mapping = mappings.find(

        m => m._id === id

    );

    if (!mapping) return;

    editMode = true;

    editingId = id;

    renderStudentDropdown();

    studentSelect.value =

        typeof mapping.studentId === "object"

            ? mapping.studentId._id

            : mapping.studentId;

    assignedRoute.value =

        typeof mapping.assignedRoute === "object"

            ? mapping.assignedRoute._id

            : mapping.assignedRoute;

    renderStopDropdown(

        assignedRoute.value

    );

    assignedStop.value =

        typeof mapping.assignedStop === "object"

            ? mapping.assignedStop._id

            : mapping.assignedStop;

    assignedVehicle.value =

        typeof mapping.assignedVehicle === "object"

            ? mapping.assignedVehicle._id

            : mapping.assignedVehicle;

    assignedDriver.value =

        typeof mapping.assignedDriver === "object"

            ? mapping.assignedDriver._id

            : mapping.assignedDriver;

    monthlyFee.value =

        mapping.monthlyFee || 0;

    mappingStatus.value =

        mapping.status;

    modal.classList.add("active");

}

/* ==========================================================
DELETE
========================================================== */

async function deleteMapping(id) {

    if (

        !confirm(

            "Delete this transport assignment?"

        )

    ) return;

    try {

        showLoader();

        await apiFetch(

            "/transport/students/" + id,

            {

                method: "DELETE",

                auth: true

            }

        );

        showToast(

            "Assignment deleted."

        );

        await loadAll();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Unable to delete assignment."

        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================================
READY
========================================================== */

console.log("====================================");

console.log("AcademiaX ERP");

console.log("Student Mapping Module");

console.log("Version : 3.0");

console.log("Ready");

console.log("====================================");