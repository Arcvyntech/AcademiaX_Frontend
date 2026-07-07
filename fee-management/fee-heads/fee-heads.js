/* ==========================================================
   AcademiaX ERP
   Fee Heads Module
   Version : 2.0
========================================================== */

let feeHeads = [];

const institution = JSON.parse(
    localStorage.getItem("ax_institution") || "{}"
);

const backBtn = document.getElementById("backBtn");
const addFeeHeadBtn = document.getElementById("addFeeHeadBtn");
const createFirstFeeHead = document.getElementById("createFirstFeeHead");

const modal = document.getElementById("feeHeadModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const form = document.getElementById("feeHeadForm");

const table = document.getElementById("feeHeadTable");
const totalFeeHeads = document.getElementById("totalFeeHeads");

const toast = document.getElementById("toast");
const loader = document.getElementById("loader");

const searchInput = document.getElementById("searchFee");
const filterType = document.getElementById("filterType");
const filterFrequency = document.getElementById("filterFrequency");
const filterStatus = document.getElementById("filterStatus");

/* ==========================================================
                    PAGE LOAD
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadFeeHeads();

});

/* ==========================================================
                    LOAD FEE HEADS
========================================================== */

async function loadFeeHeads() {

    try {

        loader.classList.add("show");

        const response = await apiFetch(

            "/fee-heads",

            {

                auth: true

            }

        );

        feeHeads = response.data || [];

        renderTable();

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

function closeFeeModal() {

    modal.classList.remove("active");

    form.reset();

}

addFeeHeadBtn.onclick = openModal;

if (createFirstFeeHead) {

    createFirstFeeHead.onclick = openModal;

}

closeModal.onclick = closeFeeModal;

cancelBtn.onclick = closeFeeModal;

window.onclick = function (e) {

    if (e.target === modal) {

        closeFeeModal();

    }

};

/* ==========================================================
                    TABLE
========================================================== */

function renderTable() {

    totalFeeHeads.textContent = feeHeads.length;

    if (feeHeads.length === 0) {

        table.innerHTML = `

<tr>

<td colspan="7">

<div class="empty-state">

<div class="empty-icon">

💰

</div>

<h2>

No Fee Heads Found

</h2>

<p>

Click "Add Fee Head" to create your first Fee Head.

</p>

<button
class="primary-btn"
id="createAgain">

+ Create Fee Head

</button>

</div>

</td>

</tr>

`;

        const btn = document.getElementById("createAgain");

        if (btn) {

            btn.onclick = openModal;

        }

        return;

    }

    table.innerHTML = "";

    feeHeads.forEach(fee => {

        table.innerHTML += `

<tr>

<td>

<strong>${fee.feeName}</strong>

</td>

<td>

${capitalize(fee.feeType)}

</td>

<td>

${capitalize(fee.frequency)}

</td>

<td>

<span class="${fee.status}">

${capitalize(fee.status)}

</span>

</td>

<td>

0

</td>

<td>

${new Date(fee.createdAt).toLocaleDateString("en-IN")}

</td>

<td>

<button
onclick="deleteFee('${fee._id}')">

🗑

</button>

</td>

</tr>

`;

    });

}
/* ==========================================================
                    SAVE FEE HEAD
========================================================== */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        loader.classList.add("show");

        await apiFetch(

            "/fee-heads",

            {

                method: "POST",

                auth: true,

                body: {

                    feeName: document.getElementById("feeName").value.trim(),

                    feeType: document.getElementById("feeType").value,

                    frequency: document.getElementById("feeFrequency").value,

                    description: document.getElementById("feeDescription").value,

                    status: document.getElementById("feeStatus").value

                }

            }

        );

        closeFeeModal();

        showToast("Fee Head Added Successfully");

        await loadFeeHeads();

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
                    DELETE FEE HEAD
========================================================== */

async function deleteFee(id) {

    const confirmDelete = confirm(

        "Are you sure you want to delete this Fee Head?"

    );

    if (!confirmDelete) return;

    try {

        loader.classList.add("show");

        await apiFetch(

            "/fee-heads/" + id,

            {

                method: "DELETE",

                auth: true

            }

        );

        showToast("Fee Head Deleted Successfully");

        await loadFeeHeads();

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
                    SEARCH
========================================================== */

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value.toLowerCase();

    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {

        row.style.display = row.innerText
            .toLowerCase()
            .includes(keyword)
            ? ""
            : "none";

    });

});

/* ==========================================================
                    FILTERS
========================================================== */

filterType.addEventListener("change", () => {

    applyFilters();

});

filterFrequency.addEventListener("change", () => {

    applyFilters();

});

filterStatus.addEventListener("change", () => {

    applyFilters();

});

function applyFilters() {

    const type = filterType.value;

    const frequency = filterFrequency.value;

    const status = filterStatus.value;

    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {

        if (!row.children.length) return;

        const rowType = row.children[1]?.innerText
            .toLowerCase()
            .trim();

        const rowFrequency = row.children[2]?.innerText
            .toLowerCase()
            .trim();

        const rowStatus = row.children[3]?.innerText
            .toLowerCase()
            .trim();

        const typeMatch =
            !type || rowType === type;

        const frequencyMatch =
            !frequency || rowFrequency === frequency;

        const statusMatch =
            !status || rowStatus === status;

        row.style.display =
            typeMatch &&
            frequencyMatch &&
            statusMatch
                ? ""
                : "none";

    });

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

    return text.charAt(0).toUpperCase() +

        text.slice(1);

}

/* ==========================================================
                    READY
========================================================== */

console.log("===================================");

console.log("AcademiaX Fee Heads Module Loaded");

console.log("Backend Connected Successfully");

console.log("===================================");