"use strict";

/* ==========================================================
   AcademiaX ERP
   Transport Reports
   Version : 3.0
========================================================== */

/* ==========================================================
GLOBAL DATA
========================================================== */

let reportData = [];

let routes = [];

let vehicles = [];

let drivers = [];

/* ==========================================================
DOM ELEMENTS
========================================================== */

const reportTableBody =
document.getElementById("reportTableBody");

const reportCount =
document.getElementById("reportCount");

const emptyState =
document.getElementById("emptyState");

const loader =
document.getElementById("loader");

const toast =
document.getElementById("toast");

const totalRoutes =
document.getElementById("totalRoutes");

const totalStudents =
document.getElementById("totalStudents");

const monthlyCollection =
document.getElementById("monthlyCollection");

const activeVehicles =
document.getElementById("activeVehicles");

const routeFilter =
document.getElementById("routeFilter");

const vehicleFilter =
document.getElementById("vehicleFilter");

const driverFilter =
document.getElementById("driverFilter");

const statusFilter =
document.getElementById("statusFilter");

const fromDate =
document.getElementById("fromDate");

const toDate =
document.getElementById("toDate");

/* ==========================================================
INITIALIZE
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initializeReports

);

async function initializeReports(){

    try{

        showLoader();

        bindEvents();

        await loadDashboard();

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to load transport reports."

        );

    }

    finally{

        hideLoader();

    }

}

/* ==========================================================
LOAD ALL DATA
========================================================== */

async function loadDashboard(){

    await Promise.all([

        loadRoutes(),

        loadVehicles(),

        loadDrivers(),

        loadReports()

    ]);

    renderRouteDropdown();

    renderVehicleDropdown();

    renderDriverDropdown();

    refreshDashboard();

}

/* ==========================================================
API
========================================================== */

async function loadRoutes(){

    const response = await apiFetch(

        "/transport",

        {

            auth:true

        }

    );

    routes = response.data || [];

}

async function loadVehicles(){

    const response = await apiFetch(

        "/transport/vehicles",

        {

            auth:true

        }

    );

    vehicles = response.data || [];

}

async function loadDrivers(){

    const response = await apiFetch(

        "/transport/drivers",

        {

            auth:true

        }

    );

    drivers = response.data || [];

}

async function loadReports(){

    const response = await apiFetch(

        "/transport/reports",

        {

            auth:true

        }

    );

    reportData = response.data || [];

}
/* ==========================================================
SUMMARY
========================================================== */

function refreshDashboard(){

    updateSummary();

    renderRouteDropdown();

    renderVehicleDropdown();

    renderDriverDropdown();

    renderReportTable(reportData);

    renderCharts();

}

function updateSummary(){

    if(totalRoutes){

        totalRoutes.textContent = routes.length;

    }

    if(totalStudents){

        totalStudents.textContent = reportData.length;

    }

    if(activeVehicles){

        activeVehicles.textContent = vehicles.filter(

            vehicle => vehicle.status === "active"

        ).length;

    }

    if(monthlyCollection){

        const total = reportData.reduce(

            (sum,item)=>

            sum + Number(item.monthlyFee || 0),

            0

        );

        monthlyCollection.textContent =

            "₹ " + total.toLocaleString();

    }

    if(reportCount){

        reportCount.textContent =

            `${reportData.length} Records`;

    }

}

/* ==========================================================
ROUTE DROPDOWN
========================================================== */

function renderRouteDropdown(){

    if(!routeFilter) return;

    routeFilter.innerHTML =

    `<option value="">All Routes</option>`;

    routes.forEach(route=>{

        routeFilter.innerHTML +=

        `<option value="${route._id}">

            ${route.routeName}

        </option>`;

    });

}

/* ==========================================================
VEHICLE DROPDOWN
========================================================== */

function renderVehicleDropdown(){

    if(!vehicleFilter) return;

    vehicleFilter.innerHTML =

    `<option value="">All Vehicles</option>`;

    vehicles.forEach(vehicle=>{

        vehicleFilter.innerHTML +=

        `<option value="${vehicle._id}">

            ${vehicle.vehicleNumber}

        </option>`;

    });

}

/* ==========================================================
DRIVER DROPDOWN
========================================================== */

function renderDriverDropdown(){

    if(!driverFilter) return;

    driverFilter.innerHTML =

    `<option value="">All Drivers</option>`;

    drivers.forEach(driver=>{

        driverFilter.innerHTML +=

        `<option value="${driver._id}">

            ${driver.driverName}

        </option>`;

    });

}

/* ==========================================================
REPORT TABLE
========================================================== */

function renderReportTable(data = reportData){

    if(!reportTableBody) return;

    if(!data.length){

        reportTableBody.innerHTML =

        `<tr>

            <td colspan="8" class="empty-row">

                No transport report found.

            </td>

        </tr>`;

        if(emptyState){

            emptyState.style.display = "flex";

        }

        return;

    }

    if(emptyState){

        emptyState.style.display = "none";

    }

    reportTableBody.innerHTML = "";

    data.forEach(item=>{

        reportTableBody.innerHTML += `

<tr>

<td>${item.studentName || "-"}</td>

<td>${item.mobileNo || "-"}</td>

<td>${item.routeName || "-"}</td>

<td>${item.stopName || "-"}</td>

<td>${item.vehicleNumber || "-"}</td>

<td>${item.driverName || "-"}</td>

<td>

₹ ${Number(

item.monthlyFee || 0

).toLocaleString()}

</td>

<td>

<span class="status ${item.status}">

${item.status || "-"}

</span>

</td>

</tr>

`;

    });

}

/* ==========================================================
FILTERS
========================================================== */

function applyFilters(){

    let filtered = [...reportData];

    if(routeFilter.value){

        filtered = filtered.filter(item=>

            item.routeId === routeFilter.value

        );

    }

    if(vehicleFilter.value){

        filtered = filtered.filter(item=>

            item.vehicleId === vehicleFilter.value

        );

    }

    if(driverFilter.value){

        filtered = filtered.filter(item=>

            item.driverId === driverFilter.value

        );

    }

    if(statusFilter.value){

        filtered = filtered.filter(item=>

            item.status === statusFilter.value

        );

    }

    if(fromDate.value){

        filtered = filtered.filter(item=>

            new Date(item.createdAt) >=

            new Date(fromDate.value)

        );

    }

    if(toDate.value){

        filtered = filtered.filter(item=>

            new Date(item.createdAt) <=

            new Date(toDate.value + "T23:59:59")

        );

    }

    renderReportTable(filtered);

    if(reportCount){

        reportCount.textContent =

        `${filtered.length} Records`;

    }

}
/* ==========================================================
EVENTS
========================================================== */

function bindEvents(){

    const backBtn =
    document.getElementById("backBtn");

    const reloadBtn =
    document.getElementById("reloadBtn");

    const printBtn =
    document.getElementById("printBtn");

    const exportPdfBtn =
    document.getElementById("exportPdfBtn");

    const exportExcelBtn =
    document.getElementById("exportExcelBtn");

    const applyFilterBtn =
    document.getElementById("applyFilterBtn");

    const resetFilterBtn =
    document.getElementById("resetFilterBtn");

    backBtn?.addEventListener("click",()=>{

        history.back();

    });

    reloadBtn?.addEventListener("click",()=>{

        loadDashboard();

    });

    printBtn?.addEventListener("click",()=>{

        window.print();

    });

    applyFilterBtn?.addEventListener(

        "click",

        applyFilters

    );

    resetFilterBtn?.addEventListener(

        "click",

        resetFilters

    );

    exportPdfBtn?.addEventListener(

        "click",

        exportPdf

    );

    exportExcelBtn?.addEventListener(

        "click",

        exportExcel

    );

}

/* ==========================================================
RESET FILTERS
========================================================== */

function resetFilters(){

    fromDate.value = "";

    toDate.value = "";

    routeFilter.value = "";

    vehicleFilter.value = "";

    driverFilter.value = "";

    statusFilter.value = "";

    renderReportTable(reportData);

    updateSummary();

}

/* ==========================================================
PDF EXPORT
========================================================== */

function exportPdf(){

    try{

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF(

            "landscape"

        );

        doc.setFontSize(20);

        doc.text(

            "AcademiaX ERP",

            14,

            18

        );

        doc.setFontSize(13);

        doc.text(

            "Transport Report",

            14,

            28

        );

        doc.autoTable({

            startY:40,

            head:[[
                "Student",
                "Mobile",
                "Route",
                "Stop",
                "Vehicle",
                "Driver",
                "Monthly Fee",
                "Status"
            ]],

            body:reportData.map(item=>[

                item.studentName,

                item.mobileNo,

                item.routeName,

                item.stopName,

                item.vehicleNumber,

                item.driverName,

                item.monthlyFee,

                item.status

            ])

        });

        doc.save(

            `Transport_Report_${Date.now()}.pdf`

        );

        showToast(

            "PDF Exported Successfully"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to export PDF."

        );

    }

}

/* ==========================================================
EXCEL EXPORT
========================================================== */

function exportExcel(){

    try{

        const rows = reportData.map(item=>({

            Student:item.studentName,

            Mobile:item.mobileNo,

            Route:item.routeName,

            Stop:item.stopName,

            Vehicle:item.vehicleNumber,

            Driver:item.driverName,

            MonthlyFee:item.monthlyFee,

            Status:item.status

        }));

        const sheet =

        XLSX.utils.json_to_sheet(rows);

        const workbook =

        XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(

            workbook,

            sheet,

            "Transport Report"

        );

        XLSX.writeFile(

            workbook,

            `Transport_Report_${Date.now()}.xlsx`

        );

        showToast(

            "Excel Exported Successfully"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to export Excel."

        );

    }

}

/* ==========================================================
LOADER
========================================================== */

function showLoader(){

    loader?.classList.add("show");

}

function hideLoader(){

    loader?.classList.remove("show");

}

/* ==========================================================
TOAST
========================================================== */

function showToast(message){

    if(!toast) return;

    toast.innerHTML =

    `<span>${message}</span>`;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}
/* ==========================================================
CHARTS
========================================================== */

let collectionChart = null;

let routeChart = null;

function renderCharts(){

    if(typeof Chart === "undefined") return;

    const collectionCanvas =
    document.getElementById("collectionChart");

    const routeCanvas =
    document.getElementById("routeChart");

    /* ---------- Monthly Collection ---------- */

    if(collectionCanvas){

        if(collectionChart){

            collectionChart.destroy();

        }

        collectionChart = new Chart(

            collectionCanvas,

            {

                type:"bar",

                data:{

                    labels:["Transport"],

                    datasets:[{

                        label:"Monthly Collection",

                        data:[

                            reportData.reduce(

                                (sum,item)=>

                                sum +

                                Number(item.monthlyFee || 0),

                                0

                            )

                        ]

                    }]

                },

                options:{

                    responsive:true,

                    maintainAspectRatio:false

                }

            }

        );

    }

    /* ---------- Route Distribution ---------- */

    if(routeCanvas){

        const routeMap = {};

        reportData.forEach(item=>{

            const route =

            item.routeName ||

            "Unknown";

            routeMap[route] =

            (routeMap[route] || 0) + 1;

        });

        if(routeChart){

            routeChart.destroy();

        }

        routeChart = new Chart(

            routeCanvas,

            {

                type:"doughnut",

                data:{

                    labels:Object.keys(routeMap),

                    datasets:[{

                        data:Object.values(routeMap)

                    }]

                },

                options:{

                    responsive:true,

                    maintainAspectRatio:false

                }

            }

        );

    }

}

/* ==========================================================
READY
========================================================== */

console.log("====================================");

console.log("AcademiaX ERP");

console.log("Transport Reports");

console.log("Version : 3.0");

console.log("Student Name : Enabled");

console.log("Mobile Number : Enabled");

console.log("PDF Export : Enabled");

console.log("Excel Export : Enabled");

console.log("Charts : Enabled");

console.log("Print : Enabled");

console.log("Filters : Enabled");

console.log("Status : Production Ready");

console.log("====================================");