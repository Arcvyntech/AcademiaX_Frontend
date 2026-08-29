/* ==========================================================
   AcademiaX ERP
   Fee Heads Management
   Version : 1.0 (Standalone)
========================================================== */

const FeeHeads = {

    feeHeads: [],
    filteredFeeHeads: [],
    editingId: null,

    elements: {},

    /* ======================================================
       INITIALIZE
    ====================================================== */

    async init() {

        this.cacheDOM();

        this.bindEvents();

        await this.loadFeeHeads();

    },

    /* ======================================================
       CACHE DOM
    ====================================================== */

    cacheDOM() {

        this.elements.search =
            document.getElementById("searchFeeHead");

        this.elements.name =
            document.getElementById("feeHeadName");

        this.elements.description =
            document.getElementById("feeHeadDescription");

        this.elements.color =
            document.getElementById("feeHeadColor");

        this.elements.button =
            document.getElementById("btnAddFeeHead");

        this.elements.container =
            document.getElementById("feeHeadsContainer");

    },

    /* ======================================================
       BIND EVENTS
    ====================================================== */

    bindEvents() {

        this.elements.button.addEventListener(

            "click",

            () => {

                if (this.editingId) {

                    this.updateFeeHead();

                } else {

                    this.createFeeHead();

                }

            }

        );

        this.elements.search.addEventListener(

            "input",

            (event) => {

                this.searchFeeHeads(event.target.value);

            }

        );

    this.bindCardEvents();

    },

    /* ======================================================
       LOAD FEE HEADS
    ====================================================== */

    async loadFeeHeads() {

        try {

            const response = await apiFetch(

                "/fee-head",

                {

                    method: "GET",

                    auth: true

                }

            );

            this.feeHeads = response.data || [];

            this.filteredFeeHeads = [...this.feeHeads];

            this.renderFeeHeads();

        }

        catch (error) {

            console.error(error);

            alert(

                error.message ||

                "Failed to load Fee Heads."

            );

        }

    },

    /* ======================================================
       SEARCH
    ====================================================== */

    searchFeeHeads(keyword = "") {

        keyword = keyword

            .trim()

            .toLowerCase();

        if (!keyword) {

            this.filteredFeeHeads = [

                ...this.feeHeads

            ];

        }

        else {

            this.filteredFeeHeads =

                this.feeHeads.filter(item =>

                    item.name

                        .toLowerCase()

                        .includes(keyword)

                );

        }

        this.renderFeeHeads();

    },

        /* ======================================================
       RENDER FEE HEADS
    ====================================================== */

    renderFeeHeads() {

        if (!this.elements.container) return;

        if (this.filteredFeeHeads.length === 0) {

            this.elements.container.innerHTML = `
                <div class="empty-state">
                    <h3>No Fee Heads Found</h3>
                    <p>Create your first Fee Head.</p>
                </div>
            `;

            return;
        }

        this.elements.container.innerHTML = this.filteredFeeHeads
            .map(item => this.createCard(item))
            .join("");

    },

    /* ======================================================
       CREATE CARD
    ====================================================== */

  createCard(item) {

    return `
        <div class="fee-head-card" style="--card-color:${item.color || "#ff7a00"}">

            <div class="fee-head-top">

                <div>

                    <div class="fee-head-title">

                        ${this.escapeHTML(item.name)}

                    </div>

                    <div class="fee-head-description">

                        ${this.escapeHTML(item.description || "No description added.")}

                    </div>

                </div>

                <span class="status-badge ${item.status ? "status-active" : "status-inactive"}">

                    ${item.status ? "🟢 Active" : "🔴 Inactive"}

                </span>

            </div>

            <div class="fee-head-color">

                <span
                    class="color-circle"
                    style="background:${item.color || "#ff7a00"}">
                </span>

                <span>

                    Color Tag

                </span>

            </div>

            <div class="card-actions">

                <button
                    class="edit-btn"
                    data-id="${item._id}">

                    ✏ Edit

                </button>

                <button
                    class="status-btn"
                    data-id="${item._id}">

                    ${item.status ? "⏸ Deactivate" : "▶ Activate"}

                </button>

                <button
                    class="delete-btn"
                    data-id="${item._id}">

                    🗑 Delete

                </button>

            </div>

        </div>
    `;

},
    /* ======================================================
       EVENT DELEGATION
    ====================================================== */

    bindCardEvents() {

        this.elements.container.addEventListener(

            "click",

            (event) => {

                const button = event.target.closest("button");

                if (!button) return;

                const id = button.dataset.id;

                if (button.classList.contains("edit-btn")) {

                    this.editFeeHead(id);

                }

                else if (button.classList.contains("delete-btn")) {

                    this.deleteFeeHead(id);

                }

                else if (button.classList.contains("status-btn")) {

                    this.toggleStatus(id);

                }

            }

        );

    },

    /* ======================================================
       ESCAPE HTML
    ====================================================== */

    escapeHTML(text = "") {

        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    },
    /* ======================================================
       VALIDATE FORM
    ====================================================== */

    validateForm() {

        const name = this.elements.name.value.trim();

        if (!name) {

            alert("Fee Head Name is required.");

            this.elements.name.focus();

            return false;

        }

        return true;

    },

    /* ======================================================
       CREATE FEE HEAD
    ====================================================== */

    async createFeeHead() {

        if (!this.validateForm()) {

            return;

        }

        try {

            const payload = {

                name: this.elements.name.value.trim(),

                description: this.elements.description.value.trim(),

                color: this.elements.color.value

            };

            const response = await apiFetch(

                "/fee-head",

                {

                    method: "POST",

                    auth: true,

                    body: payload

                }

            );

            alert(response.message || "Fee Head created successfully.");

            this.resetForm();

            await this.loadFeeHeads();

        }

        catch (error) {

            console.error(error);

            alert(error.message || "Unable to create Fee Head.");

        }

    },

    /* ======================================================
       EDIT FEE HEAD
    ====================================================== */

    editFeeHead(id) {

        const feeHead = this.feeHeads.find(

            item => item._id === id

        );

        if (!feeHead) return;

        this.editingId = id;

        this.elements.name.value = feeHead.name;

        this.elements.description.value = feeHead.description || "";

        this.elements.color.value = feeHead.color || "#ff7a00";

        this.elements.button.textContent = "Update Fee Head";

        this.elements.name.focus();

    },

    /* ======================================================
       UPDATE FEE HEAD
    ====================================================== */

    async updateFeeHead() {

        if (!this.validateForm()) {

            return;

        }

        try {

            const payload = {

                name: this.elements.name.value.trim(),

                description: this.elements.description.value.trim(),

                color: this.elements.color.value

            };

            const response = await apiFetch(

                `/fee-head/${this.editingId}`,

                {

                    method: "PUT",

                    auth: true,

                    body: payload

                }

            );

            alert(response.message || "Fee Head updated successfully.");

            this.resetForm();

            await this.loadFeeHeads();

        }

        catch (error) {

            console.error(error);

            alert(error.message || "Unable to update Fee Head.");

        }

    },

    /* ======================================================
       RESET FORM
    ====================================================== */

    resetForm() {

        this.editingId = null;

        this.elements.name.value = "";

        this.elements.description.value = "";

        this.elements.color.value = "#ff7a00";

        this.elements.button.textContent = "+ Add Fee Head";

    },
        /* ======================================================
       DELETE FEE HEAD
    ====================================================== */

    async deleteFeeHead(id) {

        const confirmed = confirm(
            "Are you sure you want to delete this Fee Head?"
        );

        if (!confirmed) return;

        try {

            const response = await apiFetch(

                `/fee-head/${id}`,

                {
                    method: "DELETE",
                    auth: true
                }

            );

            alert(response.message || "Fee Head deleted successfully.");

            await this.loadFeeHeads();

        }

        catch (error) {

            console.error(error);

            alert(error.message || "Unable to delete Fee Head.");

        }

    },

    /* ======================================================
       TOGGLE STATUS
    ====================================================== */

    async toggleStatus(id) {

        try {

            const response = await apiFetch(

                `/fee-head/${id}/status`,

                {
                    method: "PATCH",
                    auth: true
                }

            );

            alert(response.message || "Status updated.");

            await this.loadFeeHeads();

        }

        catch (error) {

            console.error(error);

            alert(error.message || "Unable to update status.");

        }

    }

};

/* ==========================================================
   START MODULE
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        FeeHeads.init();

    }

);