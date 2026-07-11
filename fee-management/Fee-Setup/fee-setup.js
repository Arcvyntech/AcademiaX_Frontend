"use strict";

/* ======================================================
   AcademiaX ERP
   Fee Setup Module V6
====================================================== */

/* ======================================================
GLOBAL STATE
====================================================== */

let classList = [];
let feeHeadList = [];
let feeSetupList = [];
let filteredFeeSetups = [];

let editingId = null;
let selectedFeeHeads = [];

/* ======================================================
DOM
====================================================== */

const classSelect =
document.getElementById("classSelect");

const sessionSelect =
document.getElementById("session");

const statusSelect =
document.getElementById("status");

const effectiveDate =
document.getElementById("effectiveDate");

const discountInput =
document.getElementById("discount");

const remarksInput =
document.getElementById("remarks");

const feeHeadTableBody =
document.getElementById("feeHeadTableBody");

const feeSetupTableBody =
document.getElementById("feeSetupTableBody");

const saveBtn =
document.getElementById("saveBtn");

const resetBtn =
document.getElementById("resetBtn");

const backBtn =
document.getElementById("backBtn");

const loader =
document.getElementById("loader");

const toast =
document.getElementById("toast");

const searchInput =
document.getElementById("searchSetup");

const statusFilter =
document.getElementById("statusFilter");

const totalSetupCount =
document.getElementById("totalSetupCount");

const activeSetupCount =
document.getElementById("activeSetupCount");

const inactiveSetupCount =
document.getElementById("inactiveSetupCount");

const configuredAmount =
document.getElementById("configuredAmount");

/* ======================================================
INITIALIZE
====================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initializePage

);

async function initializePage(){

    try{

        showLoader();

        bindEvents();

        await loadMasterData();

    }

    catch(error){

        console.error(

            "Initialization Error",

            error

        );

        showToast(

            "Unable to load Fee Setup."

        );

    }

    finally{

        hideLoader();

    }

}

/* ======================================================
MASTER LOADER
====================================================== */

async function loadMasterData(){

    await Promise.all([

        loadClasses(),

        loadFeeHeads(),

        loadFeeSetups()

    ]);

    renderClassDropdown();

    renderFeeHeadTable();

    renderFeeSetupTable();

    renderSummaryCards();

}

/* ======================================================
LOAD CLASSES
====================================================== */

async function loadClasses(){

    try{

        const response = await apiFetch(

            "/admin/classes",

            {

                auth:true

            }

        );

        classList =

            response.success

            ?

            response.data

            :

            [];

    }

    catch(error){

        console.error(error);

        classList=[];

    }

}

/* ======================================================
LOAD FEE HEADS
====================================================== */

async function loadFeeHeads(){

    try{

        const response = await apiFetch(

            "/fee-heads",

            {

                auth:true

            }

        );

        feeHeadList =

            response.success

            ?

            response.data

            :

            [];

    }

    catch(error){

        console.error(error);

        feeHeadList=[];

    }

}

/* ======================================================
LOAD SAVED SETUPS
====================================================== */

async function loadFeeSetups(){

    try{

        const response = await apiFetch(

            "/fee-setup",

            {

                auth:true

            }

        );

        feeSetupList =

            response.success

            ?

            response.data

            :

            [];

        filteredFeeSetups=[

            ...feeSetupList

        ];

    }

    catch(error){

        console.error(error);

        feeSetupList=[];

        filteredFeeSetups=[];

    }

}
/* ======================================================
CLASS DROPDOWN
====================================================== */

function renderClassDropdown(){

    if(!classSelect) return;

    classSelect.innerHTML=`

        <option value="">

            Select Class & Section

        </option>

    `;

    classList.forEach(item=>{

        const displayName=

            item.displayName ||

            (

                item.section && item.section.trim()

                ?

                `${item.name} - ${item.section}`

                :

                item.nickname && item.nickname.trim()

                ?

                `${item.name} - ${item.nickname}`

                :

                item.name

            );

        classSelect.innerHTML+=`

            <option value="${item._id}">

                ${displayName}

            </option>

        `;

    });

}

/* ======================================================
FEE HEAD TABLE
====================================================== */

function renderFeeHeadTable(){

    if(!feeHeadTableBody) return;

    if(!feeHeadList.length){

        feeHeadTableBody.innerHTML=`

        <tr>

            <td colspan="6" class="empty-row">

                No Fee Heads Found

            </td>

        </tr>

        `;

        return;

    }

    feeHeadTableBody.innerHTML="";

    feeHeadList.forEach(head=>{

        feeHeadTableBody.innerHTML+=`

        <tr>

            <td>

                <input

                    type="checkbox"

                    class="feeHeadCheck"

                    data-id="${head._id}"

                >

            </td>

            <td>

                <strong>${head.feeName}</strong>

                <br>

                <small>${head.feeType || "-"}</small>

            </td>

            <td>

                <input

                    type="number"

                    class="amountInput"

                    value="0"

                    min="0"

                >

            </td>

            <td>

                <select class="frequencyInput">

                    <option value="monthly">Monthly</option>

                    <option value="quarterly">Quarterly</option>

                    <option value="half-yearly">Half Yearly</option>

                    <option value="yearly">Yearly</option>

                    <option value="one-time">One Time</option>

                </select>

            </td>

            <td>

                <input

                    type="number"

                    class="dueDateInput"

                    value="1"

                    min="1"

                    max="31"

                >

            </td>

            <td>

                <input

                    type="number"

                    class="lateFeeInput"

                    value="0"

                    min="0"

                >

            </td>

        </tr>

        `;

    });

}

/* ======================================================
SUMMARY CARDS
====================================================== */

function renderSummaryCards(){

    const active=

        feeSetupList.filter(

            item=>item.status==="active"

        ).length;

    const inactive=

        feeSetupList.length-active;

    const total=

        feeSetupList.reduce(

            (sum,item)=>{

                return sum+

                (item.feeHeads||[])

                .reduce(

                    (t,h)=>t+Number(h.amount||0),

                    0

                );

            },

            0

        );

    if(totalSetupCount)

        totalSetupCount.textContent=

        feeSetupList.length;

    if(activeSetupCount)

        activeSetupCount.textContent=

        active;

    if(inactiveSetupCount)

        inactiveSetupCount.textContent=

        inactive;

    if(configuredAmount)

        configuredAmount.textContent=

        "₹"+

        total.toLocaleString("en-IN");

}

/* ======================================================
SEARCH & FILTER
====================================================== */

function applyFilters(){

    const search=

        (searchInput?.value || "")

        .trim()

        .toLowerCase();

    const status=

        statusFilter?.value || "";

    filteredFeeSetups=

        feeSetupList.filter(item=>{

            const className=

                (

                    item.classId?.displayName ||

                    item.classId?.name ||

                    ""

                )

                .toLowerCase();

            const matchSearch=

                !search ||

                className.includes(search);

            const matchStatus=

                !status ||

                item.status===status;

            return matchSearch && matchStatus;

        });

    renderFeeSetupTable();

}
/* ======================================================
COLLECT FEE HEAD DATA
====================================================== */

function collectFeeHeads(){

    selectedFeeHeads=[];

    document

    .querySelectorAll("#feeHeadTableBody tr")

    .forEach(row=>{

        const check=row.querySelector(".feeHeadCheck");

        if(!check || !check.checked) return;

        selectedFeeHeads.push({

            feeHeadId:check.dataset.id,

            amount:Number(

                row.querySelector(".amountInput").value||0

            ),

            frequency:

                row.querySelector(".frequencyInput").value,

            dueDate:Number(

                row.querySelector(".dueDateInput").value||1

            ),

            lateFee:Number(

                row.querySelector(".lateFeeInput").value||0

            )

        });

    });

}

/* ======================================================
VALIDATION
====================================================== */

function validateForm(){

    if(!classSelect.value){

        showToast("Please select class.");

        return false;

    }

    if(!effectiveDate.value){

        showToast("Please select effective date.");

        return false;

    }

    collectFeeHeads();

    if(selectedFeeHeads.length===0){

        showToast("Please select at least one fee head.");

        return false;

    }

    return true;

}

/* ======================================================
SAVE / UPDATE
====================================================== */

async function saveFeeSetup(){

    if(!validateForm()) return;

    try{

        showLoader();

        const payload={

            session:sessionSelect.value,

            classId:classSelect.value,

            feeHeads:selectedFeeHeads,

            discount:Number(discountInput.value||0),

            remarks:remarksInput.value.trim(),

            effectiveDate:effectiveDate.value,

            status:statusSelect.value

        };

        let response;

        if(editingId){

            response=await apiFetch(

                "/fee-setup/"+editingId,

                {

                    method:"PUT",

                    auth:true,

                    body:payload

                }

            );

        }

        else{

            response=await apiFetch(

                "/fee-setup",

                {

                    method:"POST",

                    auth:true,

                    body:payload

                }

            );

        }

        if(!response.success){

            showToast(

                response.message||

                "Unable to save."

            );

            return;

        }

        editingId=null;

        resetForm();

        await loadFeeSetups();

        renderSummaryCards();

        renderFeeSetupTable();

        showToast(

            "Fee Setup Saved Successfully."

        );

    }

    catch(error){

        console.error(error);

        showToast("Server Error");

    }

    finally{

        hideLoader();

    }

}

/* ======================================================
RENDER TABLE
====================================================== */

function renderFeeSetupTable(){

    if(!feeSetupTableBody) return;

    if(filteredFeeSetups.length===0){

        feeSetupTableBody.innerHTML=`

        <tr>

            <td colspan="8" class="empty-row">

                No Fee Setup Found

            </td>

        </tr>

        `;

        return;

    }

    feeSetupTableBody.innerHTML="";

    filteredFeeSetups.forEach(item=>{

        const className=

            item.classId?.displayName ||

            (

                item.classId?.section

                ?

                `${item.classId.name} - ${item.classId.section}`

                :

                item.classId?.nickname

                ?

                `${item.classId.name} - ${item.classId.nickname}`

                :

                item.classId?.name ||

                "-"

            );

        const totalAmount=

            (item.feeHeads||[])

            .reduce(

                (sum,h)=>sum+Number(h.amount||0),

                0

            );

        const finalAmount=

            totalAmount-

            (

                totalAmount*

                Number(item.discount||0)/100

            );

        feeSetupTableBody.innerHTML+=`

        <tr>

            <td>

                <strong>${className}</strong>

            </td>

            <td>

                ${item.session}

            </td>

            <td>

                ₹${totalAmount.toLocaleString("en-IN")}

            </td>

            <td>

                ${item.discount||0}%

            </td>

            <td>

                ₹${finalAmount.toLocaleString("en-IN")}

            </td>

            <td>

                <span class="status-${item.status}">

                    ${item.status}

                </span>

            </td>

            <td>

                ${formatDate(item.effectiveDate)}

            </td>

            <td>

                <button

                    class="secondary-btn"

                    onclick="editFeeSetup('${item._id}')">

                    Edit

                </button>

                <button

                    class="secondary-btn"

                    onclick="deleteFeeSetup('${item._id}')">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}
/* ======================================================
EDIT FEE SETUP
====================================================== */

window.editFeeSetup = function(id){

    const item = feeSetupList.find(

        setup => setup._id === id

    );

    if(!item){

        showToast("Fee Setup not found.");

        return;

    }

    editingId = id;

    classSelect.value = item.classId?._id || "";

    sessionSelect.value = item.session || "";

    statusSelect.value = item.status || "active";

    effectiveDate.value = item.effectiveDate
        ? item.effectiveDate.substring(0,10)
        : "";

    discountInput.value = item.discount || 0;

    remarksInput.value = item.remarks || "";

    renderFeeHeadTable();

    setTimeout(()=>{

        document

        .querySelectorAll("#feeHeadTableBody tr")

        .forEach(row=>{

            const checkbox = row.querySelector(".feeHeadCheck");

            const amount = row.querySelector(".amountInput");

            const frequency = row.querySelector(".frequencyInput");

            const dueDate = row.querySelector(".dueDateInput");

            const lateFee = row.querySelector(".lateFeeInput");

            const fee = item.feeHeads.find(

                f =>

                (f.feeHeadId._id || f.feeHeadId)

                === checkbox.dataset.id

            );

            if(!fee) return;

            checkbox.checked = true;

            amount.value = fee.amount;

            frequency.value = fee.frequency;

            dueDate.value = fee.dueDate;

            lateFee.value = fee.lateFee;

        });

    },100);

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

};

/* ======================================================
DELETE
====================================================== */

window.deleteFeeSetup = async function(id){

    if(

        !confirm(

            "Delete this Fee Setup?"

        )

    ) return;

    try{

        showLoader();

        const response = await apiFetch(

            "/fee-setup/"+id,

            {

                method:"DELETE",

                auth:true

            }

        );

        if(!response.success){

            showToast(

                response.message

            );

            return;

        }

        await loadFeeSetups();

        renderSummaryCards();

        renderFeeSetupTable();

        showToast(

            "Deleted Successfully."

        );

    }

    catch(error){

        console.error(error);

        showToast("Delete Failed");

    }

    finally{

        hideLoader();

    }

};

/* ======================================================
RESET
====================================================== */

function resetForm(){

    editingId = null;

    classSelect.selectedIndex = 0;

    sessionSelect.selectedIndex = 0;

    statusSelect.value = "active";

    effectiveDate.value = "";

    discountInput.value = "";

    remarksInput.value = "";

    renderFeeHeadTable();

}

/* ======================================================
SEARCH EVENTS
====================================================== */

searchInput?.addEventListener(

    "keyup",

    applyFilters

);

statusFilter?.addEventListener(

    "change",

    applyFilters

);
/* ======================================================
LOADER
====================================================== */

function showLoader(){

    if(loader){

        loader.style.display="flex";

    }

}

function hideLoader(){

    if(loader){

        loader.style.display="none";

    }

}

/* ======================================================
TOAST
====================================================== */

let toastTimer;

function showToast(message){

    if(!toast) return;

    const span = toast.querySelector("span");

    if(span){

        span.textContent = message;

    }

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(()=>{

        toast.classList.remove("show");

    },2500);

}

/* ======================================================
DATE FORMAT
====================================================== */

function formatDate(date){

    if(!date) return "-";

    return new Date(date).toLocaleDateString(

        "en-IN",

        {

            day:"2-digit",

            month:"short",

            year:"numeric"

        }

    );

}

/* ======================================================
EVENTS
====================================================== */

function bindEvents(){

    saveBtn?.addEventListener(

        "click",

        saveFeeSetup

    );

    resetBtn?.addEventListener(

        "click",

        resetForm

    );

    backBtn?.addEventListener(

        "click",

        ()=>history.back()

    );

}

/* ======================================================
AUTO REFRESH
====================================================== */

async function refreshFeeSetup(){

    await loadMasterData();

}

window.refreshFeeSetup = refreshFeeSetup;

/* ======================================================
WINDOW READY
====================================================== */

window.addEventListener(

    "load",

    ()=>{

        console.log("====================================");

        console.log("AcademiaX ERP");

        console.log("Fee Setup Module");

        console.log("Version : 6.0");

        console.log("Status : Ready");

        console.log("====================================");

    }

);

/* ======================================================
GLOBAL FUNCTIONS
====================================================== */

window.saveFeeSetup = saveFeeSetup;

window.editFeeSetup = editFeeSetup;

window.deleteFeeSetup = deleteFeeSetup;

window.resetFeeSetup = resetForm;