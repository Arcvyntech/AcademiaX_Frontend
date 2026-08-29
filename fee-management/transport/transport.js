"use strict";

/* ==========================================================
   AcademiaX ERP
   Transport Management System
   Production Version V4
   Single File Architecture
========================================================== */

/* ==========================================================
   DOM HELPERS
========================================================== */

const $ = (id) => document.getElementById(id);

/* ==========================================================
   DOM ELEMENTS
========================================================== */

const routeForm = $("routeForm");
const routeName = $("routeName");
const monthlyFee = $("monthlyFee");

const fromStop = $("fromStop");
const toStop = $("toStop");
const addStopBtn = $("addStopBtn");
const stopsPreview = $("stopsPreview");

const routesContainer = $("routesContainer");

const routeDetailsSection = $("routeDetailsSection");
const selectedRouteName = $("selectedRouteName");
const selectedRouteCode = $("selectedRouteCode");
const selectedRouteId = $("selectedRouteId");

const busForm = $("busForm");
const busNumber = $("busNumber");
const busCapacity = $("busCapacity");
const driverName = $("driverName");
const driverMobile = $("driverMobile");
const vehicleType = $("vehicleType");
const registrationNumber = $("registrationNumber");

const busHistoryContainer = $("busHistoryContainer");

const assignStudentForm = $("assignStudentForm");

const classSelect = $("classSelect");
const sectionSelect = $("sectionSelect");

const studentSearch = $("studentSearch");
const studentList = $("studentList");
const selectAllStudents = $("selectAllStudents");

const assignedStudentTable = $("assignedStudentTable");

const totalRoutes = $("totalRoutes");
const totalBuses = $("totalBuses");
const totalStudents = $("totalStudents");
const monthlyCollection = $("monthlyCollection");

const toast = $("toast");
const loader = $("loader");

/* ==========================================================
   APPLICATION STATE
========================================================== */

const state = {

    routes: [],

    buses: [],

    classes: [],

    students: [],

    assignedStudents: [],

    currentStops: [],

    selectedRoute: null,

    selectedClass: "",

    selectedSection: "",

    searchKeyword: ""

};

/* ==========================================================
   TOKEN
========================================================== */

function getToken() {

    return (

        localStorage.getItem("ax_token") ||

        localStorage.getItem("institutionToken") ||

        localStorage.getItem("token") ||

        ""

    );

}

/* ==========================================================
   HEADERS
========================================================== */

function getHeaders() {

    return {

        "Content-Type": "application/json",

        Authorization: `Bearer ${getToken()}`

    };

}

/* ==========================================================
   API ENDPOINTS
========================================================== */

const API = {

    CREATE_ROUTE:
        `${API_BASE}/transport/create-route`,

    ROUTES:
        `${API_BASE}/transport/routes`,

    ROUTE:
        `${API_BASE}/transport/route`,

    CREATE_BUS:
        `${API_BASE}/transport/create-bus`,

    BUS:
        `${API_BASE}/transport/bus`,

    ROUTE_BUSES:
        `${API_BASE}/transport/route`,

    ASSIGN_STUDENT:
        `${API_BASE}/transport/assign-student`,

    ASSIGNED_STUDENTS:
        `${API_BASE}/transport/assigned-students`,

    STUDENT_ASSIGNMENT:
        `${API_BASE}/transport/student-assignment`,

    CLASSES:
        `${API_BASE}/admin/classes`,

    STUDENTS:
        `${API_BASE}/admin/students`

};

/* ==========================================================
   COMMON API REQUEST
========================================================== */

async function api(url, method = "GET", body = null) {

    const options = {

        method,

        headers: getHeaders()

    };

    if (body) {

        options.body = JSON.stringify(body);

    }

    const response = await fetch(url, options);

    const result = await response.json();

    if (!response.ok || !result.success) {

        throw new Error(

            result.message ||

            "Request Failed"

        );

    }

    return result;

}

/* ==========================================================
   LOADER
========================================================== */

function showLoader() {

    loader?.classList.add("active");

}

function hideLoader() {

    loader?.classList.remove("active");

}

/* ==========================================================
   TOAST
========================================================== */

function showToast(

    message,

    type = "success"

) {

    if (!toast) return;

    toast.className = "toast-message";

    if (type !== "success") {

        toast.classList.add(type);

    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

/* ==========================================================
   HELPERS
========================================================== */

function normalize(value) {

    return String(value || "")

        .trim()

        .toLowerCase();

}

function resetArray(array) {

    array.length = 0;

}

function clearElement(element) {

    if (element) {

        element.innerHTML = "";

    }

}

/* ==========================================================
   STOPS
========================================================== */

function renderStops() {

    if (!stopsPreview) return;

    stopsPreview.innerHTML = "";

    if (!state.currentStops.length) {

        stopsPreview.innerHTML =

            `<div class="empty-state">

                No Stops Added

            </div>`;

        return;

    }

    state.currentStops.forEach(

        (stop, index) => {

            stopsPreview.innerHTML += `

                <div class="stop-chip">

                    <span>

                        ${stop.from}

                        →

                        ${stop.to}

                    </span>

                    <button

                        class="remove-stop"

                        data-index="${index}"

                    >

                        ×

                    </button>

                </div>

            `;

        }

    );

    document

        .querySelectorAll(".remove-stop")

        .forEach(button => {

            button.onclick = () => {

                state.currentStops.splice(

                    Number(button.dataset.index),

                    1

                );

                renderStops();

            };

        });

}

function addStop() {

    const from = fromStop?.value.trim();

    const to = toStop?.value.trim();

    if (!from || !to) {

        showToast(

            "Please enter From and To stop.",

            "warning"

        );

        return;

    }

    state.currentStops.push({

        from,

        to

    });

    fromStop.value = "";

    toStop.value = "";

    renderStops();

}

addStopBtn?.addEventListener(

    "click",

    function (e) {

        e.preventDefault();

        addStop();

    }

);

console.log(
    "✅ Transport V4 Part 1 Loaded"
);
/* ==========================================================
   PART 2
   ROUTE MANAGEMENT
========================================================== */

/* ==========================================
   LOAD ROUTES
========================================== */

async function loadRoutes() {

    try {

        showLoader();

        const result = await api(API.ROUTES);

        state.routes = Array.isArray(result.data)
            ? result.data
            : [];

        renderRoutes();

        updateDashboardSummary();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   RENDER ROUTES
========================================== */

function renderRoutes() {

    clearElement(routesContainer);

    if (!state.routes.length) {

        routesContainer.innerHTML = `

            <div class="empty-state">

                No Routes Found

            </div>

        `;

        return;

    }

    state.routes.forEach(route => {

        const card = document.createElement("div");

        card.className = "route-card";

        card.innerHTML = `

            <h3>${route.routeName}</h3>

            <p>Monthly Fee : ₹${route.monthlyFee}</p>

            <p>Total Stops : ${(route.stops || []).length}</p>

            <div class="route-actions">

                <button
                    class="select-route-btn"
                    data-id="${route._id}">
                    Open
                </button>

                <button
                    class="delete-route-btn"
                    data-id="${route._id}">
                    Delete
                </button>

            </div>

        `;

        routesContainer.appendChild(card);

    });

    bindRouteEvents();

}

/* ==========================================
   ROUTE EVENTS
========================================== */

function bindRouteEvents() {

    document
        .querySelectorAll(".select-route-btn")
        .forEach(button => {

            button.onclick = () => {

                openRoute(button.dataset.id);

            };

        });

    document
        .querySelectorAll(".delete-route-btn")
        .forEach(button => {

            button.onclick = () => {

                deleteRoute(button.dataset.id);

            };

        });

}

/* ==========================================
   CREATE ROUTE
========================================== */

async function createRoute() {

    const payload = {

        routeName: routeName.value.trim(),

        monthlyFee: Number(monthlyFee.value),

        stops: state.currentStops

    };

    if (!payload.routeName) {

        showToast("Route name is required.", "warning");

        return;

    }

    if (!payload.monthlyFee) {

        showToast("Monthly fee is required.", "warning");

        return;

    }

    try {

        showLoader();

        await api(
            API.CREATE_ROUTE,
            "POST",
            payload
        );

        showToast("Route created successfully.");

        routeForm.reset();

        resetArray(state.currentStops);

        renderStops();

        await loadRoutes();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   OPEN ROUTE
========================================== */

async function openRoute(routeId) {

    try {

        showLoader();

        const result = await api(

            `${API.ROUTE}/${routeId}`

        );

        state.selectedRoute = result.data;

        if (selectedRouteName)
            selectedRouteName.textContent =
                result.data.routeName;

        if (selectedRouteCode)
            selectedRouteCode.textContent =
                result.data.institutionCode || "-";

        if (selectedRouteId)
            selectedRouteId.textContent =
                result.data._id;

        routeDetailsSection?.classList.remove("hidden");

        await loadBuses();

        await loadAssignedStudents();

        updateDashboardSummary();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   DELETE ROUTE
========================================== */

async function deleteRoute(routeId) {

    if (!confirm("Delete this route?"))
        return;

    try {

        showLoader();

        await api(

            `${API.ROUTE}/${routeId}`,

            "DELETE"

        );

        showToast("Route deleted successfully.");

        state.selectedRoute = null;

        routeDetailsSection?.classList.add("hidden");

        await loadRoutes();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   ROUTE FORM
========================================== */

routeForm?.addEventListener(

    "submit",

    function (e) {

        e.preventDefault();

        createRoute();

    }

);

console.log("✅ Transport V4 Part 2 Loaded");
/* ==========================================================
   PART 3
   BUS MANAGEMENT
========================================================== */

/* ==========================================
   LOAD BUSES
========================================== */

async function loadBuses() {

    if (!state.selectedRoute) {

        state.buses = [];

        renderBuses();

        return;

    }

    try {

        showLoader();

        const result = await api(

            `${API.ROUTE_BUSES}/${state.selectedRoute._id}/buses`

        );

        state.buses = Array.isArray(result.data)
            ? result.data
            : [];

        renderBuses();

        updateDashboardSummary();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   RENDER BUSES
========================================== */

function renderBuses() {

    clearElement(busHistoryContainer);

    if (!state.buses.length) {

        busHistoryContainer.innerHTML = `

            <div class="empty-state">

                No Bus Available

            </div>

        `;

        return;

    }

    state.buses.forEach(bus => {

        const card = document.createElement("div");

        card.className = "bus-card";

        card.innerHTML = `

            <h3>${bus.busNumber}</h3>

            <p>Driver : ${bus.driverName}</p>

            <p>Mobile : ${bus.driverMobile}</p>

            <p>Seats : ${bus.seatingCapacity}</p>

            <p>Vehicle : ${bus.vehicleType || "-"}</p>

            <p>Registration : ${bus.registrationNumber || "-"}</p>

            <button
                class="delete-bus-btn"
                data-id="${bus._id}">
                Delete
            </button>

        `;

        busHistoryContainer.appendChild(card);

    });

    bindBusEvents();

}

/* ==========================================
   BUS EVENTS
========================================== */

function bindBusEvents() {

    document
        .querySelectorAll(".delete-bus-btn")
        .forEach(button => {

            button.onclick = () => {

                deleteBus(button.dataset.id);

            };

        });

}

/* ==========================================
   CREATE BUS
========================================== */

async function createBus() {

    if (!state.selectedRoute) {

        showToast(
            "Please select a route first.",
            "warning"
        );

        return;

    }

    const payload = {

        routeId: state.selectedRoute._id,

        busNumber: busNumber.value.trim(),

        driverName: driverName.value.trim(),

        driverMobile: driverMobile.value.trim(),

        seatingCapacity: Number(busCapacity.value),

        vehicleType: vehicleType.value.trim(),

        registrationNumber:
            registrationNumber.value.trim()

    };

    if (!payload.busNumber) {

        showToast(
            "Bus Number is required.",
            "warning"
        );

        return;

    }

    try {

        showLoader();

        await api(

            API.CREATE_BUS,

            "POST",

            payload

        );

        showToast(
            "Bus created successfully."
        );

        busForm.reset();

        await loadBuses();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoader();

    }

}

/* ==========================================
   DELETE BUS
========================================== */

async function deleteBus(id) {

    if (!confirm(
        "Delete this bus?"
    )) return;

    try {

        showLoader();

        await api(

            `${API.BUS}/${id}`,

            "DELETE"

        );

        showToast(
            "Bus deleted successfully."
        );

        await loadBuses();

    } catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    } finally {

        hideLoader();

    }

}

/* ==========================================
   BUS FORM
========================================== */

busForm?.addEventListener(

    "submit",

    function (e) {

        e.preventDefault();

        createBus();

    }

);

console.log(
    "✅ Transport V4 Part 3 Loaded"
);
/* ==========================================================
   PART 4
   STUDENT ASSIGNMENT FOUNDATION
========================================================== */

/* ==========================================
   LOAD CLASSES
========================================== */

async function loadClasses() {

    try {

        showLoader();

        const result = await api(API.CLASSES);

        state.classes = Array.isArray(result.data)
            ? result.data
            : [];

        renderClassOptions();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   RENDER CLASS OPTIONS
========================================== */

function renderClassOptions() {

    if (!classSelect) return;

    classSelect.innerHTML = `
        <option value="">
            Select Class
        </option>
    `;

    state.classes.forEach(item => {

        const option = document.createElement("option");

        option.value = item._id;

        option.textContent =
            item.className ||
            item.name ||
            "Unnamed Class";

        classSelect.appendChild(option);

    });

}

/* ==========================================
   RENDER SECTION OPTIONS
========================================== */

function renderSections(classId) {

    sectionSelect.innerHTML = `
        <option value="">
            Select Section
        </option>
    `;

    if (!classId) return;

    const selected = state.classes.find(

        cls => cls._id === classId

    );

    if (!selected) return;

    const sections = Array.isArray(selected.sections)
        ? selected.sections
        : [];

    sections.forEach(section => {

        const option = document.createElement("option");

        option.value = section;

        option.textContent = section;

        sectionSelect.appendChild(option);

    });

}

/* ==========================================
   LOAD STUDENTS
========================================== */

async function loadStudents() {

    if (!classSelect.value) {

        state.students = [];

        renderStudentList();

        return;

    }

    try {

        showLoader();

        const url =

            `${API.STUDENTS}?classId=${classSelect.value}&section=${sectionSelect.value}`;

        const result = await api(url);

        state.students = Array.isArray(result.data)
            ? result.data
            : [];

        renderStudentList();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   RENDER STUDENTS
========================================== */

function renderStudentList() {

    clearElement(studentList);

    if (!state.students.length) {

        studentList.innerHTML = `
            <div class="empty-state">
                No Students Found
            </div>
        `;

        return;

    }

    state.students.forEach(student => {

        const card = document.createElement("label");

        card.className = "student-item";

        card.innerHTML = `

            <input
                type="checkbox"
                class="student-checkbox"
                value="${student._id}"
            >

            <span>

                ${student.studentName || student.name}

            </span>

        `;

        studentList.appendChild(card);

    });

}

/* ==========================================
   EVENTS
========================================== */

classSelect?.addEventListener(

    "change",

    function () {

        renderSections(this.value);

        loadStudents();

    }

);

sectionSelect?.addEventListener(

    "change",

    loadStudents

);

studentSearch?.addEventListener(

    "input",

    function () {

        const keyword = normalize(this.value);

        document

            .querySelectorAll(".student-item")

            .forEach(item => {

                item.style.display =

                    normalize(item.textContent)

                    .includes(keyword)

                    ? ""

                    : "none";

            });

    }

);

selectAllStudents?.addEventListener(

    "change",

    function () {

        document

            .querySelectorAll(

                ".student-checkbox"

            )

            .forEach(box => {

                box.checked = this.checked;

            });

    }

);

console.log(
    "✅ Transport V4 Part 4 Loaded"
);
/* ==========================================================
   PART 5
   STUDENT ASSIGNMENT
========================================================== */

/* ==========================================
   GET SELECTED STUDENTS
========================================== */

function getSelectedStudents() {

    return Array.from(

        document.querySelectorAll(

            ".student-checkbox:checked"

        )

    ).map(box => box.value);

}

/* ==========================================
   ASSIGN STUDENTS
========================================== */

async function assignStudents() {

    if (!state.selectedRoute) {

        showToast(
            "Please select a route first.",
            "warning"
        );

        return;

    }

    const selectedStudents = getSelectedStudents();

    if (!selectedStudents.length) {

        showToast(
            "Please select at least one student.",
            "warning"
        );

        return;

    }

    const selectedBus = $("assignBus")?.value || "";
    if (!selectedBus) {

    showToast(
        "Please select a bus before assigning students.",
        "warning"
    );

    return;

}

    const pickupStop = $("pickupStop")?.value || "";

    const dropStop = $("dropStop")?.value || "";

    const remarks = $("remarks")?.value || "";

    try {

        showLoader();

 const payload = {

    studentIds: selectedStudents,

    routeId: state.selectedRoute._id,

    busId: selectedBus,

    assignedMonths: getSelectedMonths(),

    pickupStop,

    dropStop,

    remarks

};

if (editingAssignmentId) {

    await api(

        `${API.STUDENT_ASSIGNMENT}/${editingAssignmentId}`,

        "PUT",

        {
            studentId: selectedStudents[0],
            routeId: state.selectedRoute._id,
            busId: selectedBus,
            monthlyFee: state.selectedRoute.monthlyFee,
            assignedMonths: getSelectedMonths(),
            pickupStop,
            dropStop,
            remarks
        }

    );

} else {

   console.log("Payload भेजा जा रहा है:", payload);

const result = await api(
    API.ASSIGN_STUDENT,
    "POST",
    payload
);

console.log("API Response:", result);



        }

        showToast(

            "Students assigned successfully."

        );

        assignStudentForm?.reset();

        document

            .querySelectorAll(

                ".student-checkbox"

            )

            .forEach(box => {

                box.checked = false;

            });
            editingAssignmentId = null;

const submitBtn = assignStudentForm.querySelector(
    'button[type="submit"]'
);

if (submitBtn) {

    submitBtn.innerHTML = "Assign Student";

}

        await loadAssignedStudents();

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally {

        hideLoader();

    }

}


/* ==========================================
   LOAD ASSIGNED STUDENTS
========================================== */

async function loadAssignedStudents() {

    try {

        showLoader();

        const result = await api(

            API.ASSIGNED_STUDENTS

        );

        state.assignedStudents =

            Array.isArray(result.data)

            ? result.data

            : [];

        renderAssignedStudents();

        updateDashboardSummary();

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================
   RENDER ASSIGNED STUDENTS
========================================== */

function renderAssignedStudents() {

    clearElement(assignedStudentTable);

    if (!state.assignedStudents.length) {

        assignedStudentTable.innerHTML = `
            <tr>
                <td colspan="6">No Assigned Students</td>
            </tr>
        `;
        return;
    }

    state.assignedStudents.forEach(assignment => {

       let months = 0;

if (Array.isArray(assignment.assignedMonths)) {

    months = assignment.assignedMonths.length;

} else if (typeof assignment.assignedMonths === "number") {

    months = assignment.assignedMonths;

} else if (typeof assignment.assignedMonths === "string") {

    months = assignment.assignedMonths
        .split(",")
        .filter(m => m.trim() !== "").length;

}

        const className =
            assignment.studentId?.classId
                ? `${assignment.studentId.classId.name}${
                    assignment.studentId.classId.nickname
                        ? " - " + assignment.studentId.classId.nickname
                        : ""
                }`
                : "-";

        assignedStudentTable.innerHTML += `
            <tr data-assignment="${assignment._id}">

                <td>${className}</td>

                <td>${assignment.studentId?.name || "-"}</td>

                <td>${assignment.busId?.busNumber || "-"}</td>

                <td>₹${assignment.monthlyFee || 0}</td>

                <td>${months}</td>

               <td class="action-buttons">

    <button
        class="btn btn-primary edit-assignment"
        data-id="${assignment._id}">
        <i class="fas fa-edit"></i> Edit
    </button>

    <button
        class="btn btn-danger remove-assignment"
        data-id="${assignment._id}">
        <i class="fas fa-trash"></i> Remove
    </button>

</td>

            </tr>
        `;
    });

    bindAssignmentEvents();
}


let editingAssignmentId = null;

async function editAssignment(id) {

    const assignment = state.assignedStudents.find(
        item => item._id === id
    );

    if (!assignment) {
        showToast("Assignment not found", "error");
        return;
    }

    editingAssignmentId = id;

    // Bus
    $("assignBus").value = assignment.busId?._id || "";

    // Stops
    $("pickupStop").value = assignment.pickupStop || "";
    $("dropStop").value = assignment.dropStop || "";

    // Remarks
    $("remarks").value = assignment.remarks || "";

    // Button Text
    const submitBtn = assignStudentForm.querySelector(
        'button[type="submit"]'
    );

    if (submitBtn) {

        submitBtn.innerHTML = "Update Assignment";

    }

    showToast("Assignment loaded for editing.");

}
/* ==========================================
   REMOVE ASSIGNMENT
========================================== */

async function removeAssignment(id) {

    if (

        !confirm(

            "Remove transport assignment?"

        )

    ) return;

    try {

        showLoader();

        await api(

            `${API.STUDENT_ASSIGNMENT}/${id}`,

            "DELETE"

        );

        showToast(

            "Assignment removed."

        );

        await loadAssignedStudents();

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================
   EVENTS
========================================== */

function bindAssignmentEvents() {

    document
        .querySelectorAll(".remove-assignment")
        .forEach(button => {

            button.onclick = () => {
                removeAssignment(button.dataset.id);
            };

        });

    document
        .querySelectorAll(".edit-assignment")
        .forEach(button => {

            button.onclick = () => {
                editAssignment(button.dataset.id);
            };

        });

}
/* ==========================================================
   PART 6
   DASHBOARD & INITIALIZATION
========================================================== */

/* ==========================================
   DASHBOARD SUMMARY
========================================== */

function updateDashboardSummary() {

    if (totalRoutes) {

        totalRoutes.textContent = state.routes.length;

    }

    if (totalBuses) {

        totalBuses.textContent = state.buses.length;

    }

    if (totalStudents) {

        totalStudents.textContent =

            state.assignedStudents.length;

    }

    if (monthlyCollection) {

        const total = state.assignedStudents.reduce(

            (sum, item) =>

                sum + Number(item.monthlyFee || 0),

            0

        );

        monthlyCollection.textContent =

            `₹${total.toLocaleString("en-IN")}`;

    }

}

/* ==========================================
   BUS DROPDOWN
========================================== */

function renderBusDropdown() {

    const assignBus = $("assignBus");

    if (!assignBus) return;

    assignBus.innerHTML = `

        <option value="">

            Select Bus

        </option>

    `;

    state.buses.forEach(bus => {

        assignBus.innerHTML += `

            <option value="${bus._id}">

                ${bus.busNumber}

                (${bus.driverName})

            </option>

        `;

    });

}

/* ==========================================
   OVERRIDE LOAD BUSES
========================================== */

const __originalLoadBuses = loadBuses;

loadBuses = async function () {

    await __originalLoadBuses();

    renderBusDropdown();

};

/* ==========================================
   RESET TRANSPORT
========================================== */

function resetTransportState() {

    state.selectedRoute = null;

    state.currentStops = [];

    state.buses = [];

    state.students = [];

    state.assignedStudents = [];

}

/* ==========================================
   PAGE INITIALIZATION
========================================== */

async function initTransport() {

    try {

        showLoader();

        resetTransportState();

        renderStops();

        await loadRoutes();

        await loadClasses();

        await loadAssignedStudents();

        updateDashboardSummary();
        // Route Form
routeForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveRoute();
});

// Bus Form
busForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveBus();
});

// Assign Student Form
assignStudentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await assignStudents();
});

        console.log(

            "✅ Transport Module Initialized"

        );

    }

    catch (error) {

        console.error(error);

        showToast(

            error.message,

            "error"

        );

    }

    finally {

        hideLoader();

    }

}

/* ==========================================
   AUTO START
========================================== */

document.addEventListener(

    "DOMContentLoaded",

    function () {

        initTransport();

    }

);

console.log(
    "✅ Transport V4 Part 6 Loaded"
);
/* ==========================================================
   PART 7
   PRODUCTION POLISH
========================================================== */

/* ==========================================
   EDIT ROUTE
========================================== */

async function editRoute(routeId) {

    try {

        showLoader();

        const result = await api(

            `${API.ROUTE}/${routeId}`

        );

        const route = result.data;

        routeName.value = route.routeName;

        monthlyFee.value = route.monthlyFee;

        state.currentStops = Array.isArray(route.stops)
            ? [...route.stops]
            : [];

        renderStops();

        routeForm.dataset.editId = route._id;

        showToast("Route loaded for editing.");

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   SAVE / UPDATE ROUTE
========================================== */

const __createRoute = createRoute;

createRoute = async function () {

    const editId = routeForm.dataset.editId;

    if (!editId) {

        return __createRoute();

    }

    try {

        showLoader();

        await api(

            `${API.ROUTE}/${editId}`,

            "PUT",

            {

                routeName: routeName.value.trim(),

                monthlyFee: Number(monthlyFee.value),

                stops: state.currentStops,

                isActive: true

            }

        );

        delete routeForm.dataset.editId;

        routeForm.reset();

        state.currentStops = [];

        renderStops();

        showToast("Route updated successfully.");

        await loadRoutes();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

};

/* ==========================================
   EDIT BUS
========================================== */

async function editBus(busId) {

    try {

        showLoader();

        const result = await api(

            `${API.BUS}/${busId}`

        );

        const bus = result.data;

        busNumber.value = bus.busNumber;

        busCapacity.value = bus.seatingCapacity;

        driverName.value = bus.driverName;

        driverMobile.value = bus.driverMobile;

        vehicleType.value = bus.vehicleType || "";

        registrationNumber.value =
            bus.registrationNumber || "";

        busForm.dataset.editId = bus._id;

        showToast("Bus loaded for editing.");

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

}

/* ==========================================
   SAVE / UPDATE BUS
========================================== */

const __createBus = createBus;

createBus = async function () {

    const editId = busForm.dataset.editId;

    if (!editId) {

        return __createBus();

    }

    try {

        showLoader();

        await api(

            `${API.BUS}/${editId}`,

            "PUT",

            {

                busNumber: busNumber.value.trim(),

                driverName: driverName.value.trim(),

                driverMobile: driverMobile.value.trim(),

                seatingCapacity: Number(busCapacity.value),

                vehicleType: vehicleType.value.trim(),

                registrationNumber:
                    registrationNumber.value.trim(),

                isActive: true

            }

        );

        delete busForm.dataset.editId;

        busForm.reset();

        showToast("Bus updated successfully.");

        await loadBuses();

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    } finally {

        hideLoader();

    }

};

/* ==========================================
   REFRESH
========================================== */

async function refreshTransport() {

    await loadRoutes();

    if (state.selectedRoute) {

        await loadBuses();

    }

    await loadAssignedStudents();

    updateDashboardSummary();

}

/* ==========================================
   GLOBAL SEARCH
========================================== */

function filterAssignedStudents(keyword) {

    keyword = normalize(keyword);

    document

        .querySelectorAll(
            "#assignedStudentTable tr"
        )

        .forEach(row => {

            row.style.display =

                normalize(row.textContent)

                .includes(keyword)

                ? ""

                : "none";

        });

}

/* ==========================================
   EXPOSE HELPERS
========================================== */

window.transportModule = {

    refresh: refreshTransport,

    loadRoutes,

    loadBuses,

    loadAssignedStudents,

    updateDashboardSummary

};

console.log(
    "✅ Transport V4 Production Ready"
);
/* ==========================================================
   TRANSPORT V5
   PART 1
   EDIT ASSIGNMENT ENGINE
========================================================== */

const assignmentEditor = {

    isEditing: false,

    assignmentId: null,

    studentId: null

};

function startAssignmentEdit(assignment) {

    if (!assignment) {

        showToast(
            "Assignment not found.",
            "error"
        );

        return;

    }

    assignmentEditor.isEditing = true;

    assignmentEditor.assignmentId = assignment._id;

    assignmentEditor.studentId =
        assignment.studentId?._id || "";

    const bus = $("assignBus");

    if (bus) {

        bus.value =
            assignment.busId?._id || "";

    }

    const submitButton =
        assignStudentForm?.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {

        submitButton.innerHTML =
            "💾 Update Assignment";

    }

    showToast(
        "Edit Mode Enabled"
    );

}
/* ==========================================
   OPEN EDIT
========================================== */

editAssignment = async function (id) {

    const assignment =
        state.assignedStudents.find(

            item => item._id === id

        );

    startAssignmentEdit(assignment);

};
/* ==========================================================
   TRANSPORT V5
   PART 2
   UPDATE ASSIGNMENT ENGINE
========================================================== */

const __assignStudentsV5 = assignStudents;

assignStudents = async function () {

    if (!assignmentEditor.isEditing) {

        return __assignStudentsV5();

    }

    try {

        showLoader();

        const selectedBus =
            $("assignBus")?.value || "";

        const payload = {

            studentId:
                assignmentEditor.studentId,

            routeId:
                state.selectedRoute._id,

            busId:
                selectedBus,

            monthlyFee:
                state.selectedRoute.monthlyFee,

            assignedMonths: [],

            pickupStop: "",

            dropStop: "",

            remarks: ""

        };

        await api(

            `${API.STUDENT_ASSIGNMENT}/${assignmentEditor.assignmentId}`,

            "PUT",

            payload

        );

        assignmentEditor.isEditing = false;

        assignmentEditor.assignmentId = null;

        assignmentEditor.studentId = null;

        assignStudentForm.reset();

        const submitButton =
            assignStudentForm.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {

            submitButton.innerHTML =
                "👨‍🎓 Assign Selected Students";

        }

        showToast(
            "Assignment Updated Successfully"
        );

        await loadAssignedStudents();

    }

    catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

    finally {

        hideLoader();

    }

};
/* ==========================================================
   TRANSPORT V5
   PART 3
   AUTO SELECT STUDENT + MONTHS
========================================================== */

const __startAssignmentEdit = startAssignmentEdit;

startAssignmentEdit = function (assignment) {

    __startAssignmentEdit(assignment);

    /* -------------------------------
       Select Student Automatically
    -------------------------------- */

    document
        .querySelectorAll(".student-checkbox")
        .forEach(box => {

            box.checked =
                box.value === assignment.studentId?._id;

            box.disabled = true;

        });

    /* -------------------------------
       Restore Months
    -------------------------------- */

    const months =
        Array.isArray(assignment.assignedMonths)
            ? assignment.assignedMonths
            : [];

    document
        .querySelectorAll(".month-checkbox")
        .forEach(box => {

            box.checked =
                months.includes(box.value);

        });

};
/* ==========================================
   EXIT EDIT MODE
========================================== */

function cancelAssignmentEdit() {

    assignmentEditor.isEditing = false;

    assignmentEditor.assignmentId = null;

    assignmentEditor.studentId = null;

    assignStudentForm.reset();

    document
        .querySelectorAll(".student-checkbox")
        .forEach(box => {

            box.checked = false;

            box.disabled = false;

        });

    document
        .querySelectorAll(".month-checkbox")
        .forEach(box => {

            box.checked = false;

        });

    const submitButton =
        assignStudentForm.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {

        submitButton.innerHTML =
            "👨‍🎓 Assign Selected Students";

    }

}
/* ==========================================================
   TRANSPORT V5
   PART 4
   FORM DATA COLLECTOR
========================================================== */

function getSelectedMonths() {

    return Array.from(

        document.querySelectorAll(".month-checkbox:checked")

    ).map(box => box.value);

}

function getAssignmentFormData() {

    return {

        busId:
            $("assignBus")?.value || "",

        pickupStop:
            $("pickupStop")?.value?.trim() || "",

        dropStop:
            $("dropStop")?.value?.trim() || "",

        remarks:
            $("remarks")?.value?.trim() || "",

        assignedMonths:
            getSelectedMonths()

    };

}
/* ==========================================
   V5 UPDATE OVERRIDE
========================================== */

const __assignStudentsV5Part4 = assignStudents;

assignStudents = async function () {

    if (!assignmentEditor.isEditing) {

        return __assignStudentsV5Part4();

    }

    try {

        showLoader();

        const formData =
            getAssignmentFormData();

        await api(

            `${API.STUDENT_ASSIGNMENT}/${assignmentEditor.assignmentId}`,

            "PUT",

            {

                studentId:
                    assignmentEditor.studentId,

                routeId:
                    state.selectedRoute._id,

                monthlyFee:
                    state.selectedRoute.monthlyFee,

                ...formData

            }

        );

        cancelAssignmentEdit();

        await loadAssignedStudents();

        showToast(
            "Assignment Updated Successfully"
        );

    }

    catch (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

    }

    finally {

        hideLoader();

    }

};
/* ==========================================================
   TRANSPORT V5
   PART 5
   EDIT MODE UI
========================================================== */

function updateAssignmentEditorUI() {

    const submitBtn =
        assignStudentForm?.querySelector(
            'button[type="submit"]'
        );

    if (!submitBtn) return;

    let cancelBtn =
        $("cancelAssignmentEditBtn");

    if (assignmentEditor.isEditing) {

        submitBtn.innerHTML =
            "💾 Update Assignment";

        if (!cancelBtn) {

            cancelBtn =
                document.createElement("button");

            cancelBtn.type = "button";

            cancelBtn.id =
                "cancelAssignmentEditBtn";

            cancelBtn.className =
                "btn btn-secondary";

            cancelBtn.innerHTML =
                "❌ Cancel Edit";

            submitBtn.insertAdjacentElement(
                "afterend",
                cancelBtn
            );

            cancelBtn.onclick =
                cancelAssignmentEdit;

        }

    } else {

        submitBtn.innerHTML =
            "👨‍🎓 Assign Selected Students";

        cancelBtn?.remove();

    }

}
/* ==========================================
   OVERRIDE START EDIT
========================================== */

const __startAssignmentEditV5 =
    startAssignmentEdit;

startAssignmentEdit = function (assignment) {

    __startAssignmentEditV5(
        assignment
    );

    updateAssignmentEditorUI();

};
/* ==========================================
   OVERRIDE CANCEL EDIT
========================================== */

const __cancelAssignmentEdit =
    cancelAssignmentEdit;

cancelAssignmentEdit = function () {

    __cancelAssignmentEdit();

    updateAssignmentEditorUI();

};
/* ==========================================
   INITIAL UI
========================================== */

document.addEventListener(

    "DOMContentLoaded",

    function () {

        updateAssignmentEditorUI();

    }

);
/* ==========================================================
   TRANSPORT V5
   PART 6
   LIVE BUS CAPACITY ENGINE
========================================================== */

function getBusOccupancy(busId) {

    return state.assignedStudents.filter(item =>

        item.busId &&
        item.busId._id === busId

    ).length;

}

function getAvailableSeats(busId) {

    const bus = state.buses.find(

        b => b._id === busId

    );

    if (!bus) return 0;

    return Math.max(

        0,

        Number(bus.seatingCapacity || 0) -

        getBusOccupancy(busId)

    );

}
/* ==========================================
   CAPACITY VALIDATION
========================================== */

function validateBusCapacity(busId) {

    const available =
        getAvailableSeats(busId);

    if (available <= 0) {

        showToast(
            "This bus is already full.",
            "warning"
        );

        return false;

    }

    return true;

}
/* ==========================================
   OVERRIDE ASSIGN
========================================== */

const __assignStudentsCapacity =
    assignStudents;

assignStudents = async function () {

    if (!assignmentEditor.isEditing) {

        const busId =
            $("assignBus")?.value;

        if (!validateBusCapacity(busId)) {

            return;

        }

    }

    return __assignStudentsCapacity();

};
/* ==========================================
   BUS STATUS REFRESH
========================================== */

const __renderBusDropdown =
    renderBusDropdown;

renderBusDropdown = function () {

    __renderBusDropdown();

    const select =
        $("assignBus");

    if (!select) return;

    Array.from(select.options).forEach(option => {

        if (!option.value) return;

        const available =
            getAvailableSeats(option.value);

        option.textContent +=
            ` | Seats Left : ${available}`;

    });

};
/* ==========================================================
   TRANSPORT V5
   PART 7
   LIVE DASHBOARD ANALYTICS
========================================================== */

function getTransportAnalytics() {

    const analytics = {

        totalCapacity: 0,

        occupiedSeats: 0,

        availableSeats: 0,

        occupancy: 0

    };

    state.buses.forEach(bus => {

        analytics.totalCapacity +=
            Number(bus.seatingCapacity || 0);

        analytics.occupiedSeats +=
            getBusOccupancy(bus._id);

    });

    analytics.availableSeats =
        analytics.totalCapacity -
        analytics.occupiedSeats;

    if (analytics.totalCapacity > 0) {

        analytics.occupancy = Math.round(

            (analytics.occupiedSeats /
                analytics.totalCapacity) * 100

        );

    }

    return analytics;

}
/* ==========================================
   DASHBOARD REFRESH
========================================== */

const __dashboardSummaryV5 =
    updateDashboardSummary;

updateDashboardSummary = function () {

    __dashboardSummaryV5();

    const analytics =
        getTransportAnalytics();

    console.table({

        Capacity:
            analytics.totalCapacity,

        Occupied:
            analytics.occupiedSeats,

        Available:
            analytics.availableSeats,

        Occupancy:
            analytics.occupancy + "%"

    });

};
/* ==========================================
   BUS STATUS
========================================== */

function getBusStatus(busId) {

    const available =
        getAvailableSeats(busId);

    const bus =
        state.buses.find(

            b => b._id === busId

        );

    if (!bus) {

        return "Unknown";

    }

    const total =
        Number(bus.seatingCapacity || 0);

    if (available <= 0) {

        return "Full";

    }

    if (available <= Math.ceil(total * 0.2)) {

        return "Almost Full";

    }

    return "Available";

}
/* ==========================================
   TRANSPORT REPORT
========================================== */

window.transportModule.report =
function () {

    const analytics =
        getTransportAnalytics();

    console.log(
        "========= TRANSPORT REPORT ========="
    );

    console.log(
        "Routes :",
        state.routes.length
    );

    console.log(
        "Buses :",
        state.buses.length
    );

    console.log(
        "Students :",
        state.assignedStudents.length
    );

    console.log(
        "Capacity :",
        analytics.totalCapacity
    );

    console.log(
        "Occupied :",
        analytics.occupiedSeats
    );

    console.log(
        "Available :",
        analytics.availableSeats
    );

    console.log(
        "Occupancy :",
        analytics.occupancy + "%"
    );

    console.log(
        "===================================="
    );

};
/* ==========================================================
   TRANSPORT V5
   PART 8
   ADVANCED SEARCH ENGINE
========================================================== */

const transportSearch = {

    keyword: "",

    routeId: "",

    busId: ""

};

function applyAssignmentFilters() {

    const rows = assignedStudentTable?.querySelectorAll("tr");

    if (!rows) return;

    rows.forEach(row => {

        if (!row.dataset.assignment) return;

        const assignment = state.assignedStudents.find(

            item => item._id === row.dataset.assignment

        );

        if (!assignment) return;

        let visible = true;

        if (transportSearch.keyword) {

            const text = row.textContent.toLowerCase();

            visible = text.includes(

                transportSearch.keyword.toLowerCase()

            );

        }

        if (

            visible &&

            transportSearch.busId

        ) {

            visible =

                assignment.busId?._id ===

                transportSearch.busId;

        }

        if (

            visible &&

            transportSearch.routeId

        ) {

            visible =

                assignment.routeId?._id ===

                transportSearch.routeId;

        }

        row.style.display =

            visible ? "" : "none";

    });

}
/* ==========================================
   SEARCH BOX CONNECTOR
========================================== */

window.transportModule.searchAssignments =
function (keyword) {

    transportSearch.keyword = keyword || "";

    applyAssignmentFilters();

};
/* ==========================================
   FILTER BY BUS
========================================== */

window.transportModule.filterBus =
function (busId) {

    transportSearch.busId = busId || "";

    applyAssignmentFilters();

};
/* ==========================================
   FILTER BY ROUTE
========================================== */

window.transportModule.filterRoute =
function (routeId) {

    transportSearch.routeId = routeId || "";

    applyAssignmentFilters();

};
/* ==========================================================
   TRANSPORT V5
   PART 9
   EXPORT ENGINE
========================================================== */

function exportTransportCSV() {

    if (!state.assignedStudents.length) {

        showToast(
            "No transport data available.",
            "warning"
        );

        return;

    }

    const rows = [

        [
            "Class",
            "Student",
            "Bus",
            "Monthly Fee",
            "Assigned Months"
        ]

    ];

    state.assignedStudents.forEach(item => {

        const className =
            item.studentId?.classId?.name || "-";

        const student =
            item.studentId?.name || "-";

        const bus =
            item.busId?.busNumber || "-";

        const fee =
            item.monthlyFee || 0;

        const months = Array.isArray(item.assignedMonths)
            ? item.assignedMonths.join(", ")
            : item.assignedMonths || "";

        rows.push([
            className,
            student,
            bus,
            fee,
            months
        ]);

    });

    const csv = rows
        .map(r => r.join(","))
        .join("\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "transport-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast(
        "Transport report exported."
    );

}
/* ==========================================
   GLOBAL EXPORT
========================================== */

window.transportModule.exportCSV =
    exportTransportCSV;