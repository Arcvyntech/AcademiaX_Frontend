/* ==========================================================
   AcademiaX ERP
   Fee Heads Management
   Version : 2.0 (Standalone) - Improved UX/UI
========================================================== */

const FeeHeads = {

    feeHeads: [],
    filteredFeeHeads: [],
    editingId: null,
    statusFilter: "all",     // all | active | inactive
    searchTerm: "",
    isLoading: false,
    searchDebounceTimer: null,

    elements: {},

    /* ======================================================
       INITIALIZE
    ====================================================== */

    async init() {

        this.cacheDOM();
        this.bindEvents();
        this.initColorPresets();
        await this.loadFeeHeads();

    },

    /* ======================================================
       CACHE DOM
    ====================================================== */

    cacheDOM() {

        this.elements.search = document.getElementById("searchFeeHead");
        this.elements.name = document.getElementById("feeHeadName");
        this.elements.nameError = document.getElementById("feeHeadNameError");
        this.elements.description = document.getElementById("feeHeadDescription");
        this.elements.descCount = document.getElementById("feeHeadDescCount");
        this.elements.color = document.getElementById("feeHeadColor");
        this.elements.colorPresets = document.getElementById("colorPresets");
        this.elements.button = document.getElementById("btnAddFeeHead");
        this.elements.cancelBtn = document.getElementById("btnCancelEdit");
        this.elements.container = document.getElementById("feeHeadsContainer");
        this.elements.statusFilter = document.getElementById("statusFilter");
        this.elements.statTotal = document.getElementById("statTotal");
        this.elements.statActive = document.getElementById("statActive");
        this.elements.statInactive = document.getElementById("statInactive");
        this.elements.toastStack = document.getElementById("toastStack");
        this.elements.confirmOverlay = document.getElementById("confirmOverlay");
        this.elements.confirmTitle = document.getElementById("confirmTitle");
        this.elements.confirmMessage = document.getElementById("confirmMessage");
        this.elements.confirmAccept = document.getElementById("confirmAccept");
        this.elements.confirmCancel = document.getElementById("confirmCancel");
        this.elements.resultCount = document.getElementById("resultCount");

    },

    /* ======================================================
       BIND EVENTS
    ====================================================== */

    bindEvents() {

        this.elements.button.addEventListener("click", () => {

            if (this.editingId) {
                this.updateFeeHead();
            } else {
                this.createFeeHead();
            }

        });

        if (this.elements.cancelBtn) {

            this.elements.cancelBtn.addEventListener("click", () => {
                this.resetForm();
            });

        }

        // Debounced live search
        this.elements.search.addEventListener("input", (event) => {

            const value = event.target.value;

            clearTimeout(this.searchDebounceTimer);

            this.searchDebounceTimer = setTimeout(() => {
                this.searchTerm = value;
                this.applyFilters();
            }, 250);

        });

        // Submit form on Enter (but not inside the textarea)
        this.elements.name.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                event.preventDefault();
                this.elements.button.click();
            }

        });

        // Esc cancels an in-progress edit
        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape" && this.editingId) {
                this.resetForm();
            }

        });

        // Clear inline error as soon as the user starts typing
        this.elements.name.addEventListener("input", () => {
            this.clearFieldError();
        });

        // Live character counter for description
        if (this.elements.description && this.elements.descCount) {

            this.elements.description.addEventListener("input", () => {
                this.updateDescCount();
            });

        }

        // Status filter dropdown
        if (this.elements.statusFilter) {

            this.elements.statusFilter.addEventListener("change", (event) => {
                this.statusFilter = event.target.value;
                this.applyFilters();
            });

        }

        // Confirm dialog buttons
        if (this.elements.confirmCancel) {

            this.elements.confirmCancel.addEventListener("click", () => {
                this.closeConfirm();
            });

        }

        if (this.elements.confirmOverlay) {

            this.elements.confirmOverlay.addEventListener("click", (event) => {

                if (event.target === this.elements.confirmOverlay) {
                    this.closeConfirm();
                }

            });

        }

        this.bindCardEvents();

    },

    /* ======================================================
       COLOR PRESETS
    ====================================================== */

    initColorPresets() {

        if (!this.elements.colorPresets) return;

        const presets = [
            "#ff7a00", "#2563eb", "#16a34a", "#9333ea",
            "#ef4444", "#0891b2", "#db2777", "#f59e0b"
        ];

        this.elements.colorPresets.innerHTML = presets.map(hex => `
            <button
                type="button"
                class="color-swatch"
                data-color="${hex}"
                style="background:${hex}"
                aria-label="Use color ${hex}">
            </button>
        `).join("");

        this.elements.colorPresets.addEventListener("click", (event) => {

            const swatch = event.target.closest(".color-swatch");

            if (!swatch) return;

            this.elements.color.value = swatch.dataset.color;

        });

    },

    /* ======================================================
       LOAD FEE HEADS
    ====================================================== */

    async loadFeeHeads() {

        this.setLoading(true);

        try {

            const response = await apiFetch("/fee-heads", {
                method: "GET",
                auth: true
            });

            this.feeHeads = response.data || [];
            this.applyFilters();
            this.updateStats();

        }
        catch (error) {

            console.error(error);
            this.showToast(error.message || "Failed to load Fee Heads.", "error");
            this.renderError();

        }
        finally {

            this.setLoading(false);

        }

    },

    /* ======================================================
       FILTER + SEARCH (combined)
    ====================================================== */

    applyFilters() {

        const keyword = this.searchTerm.trim().toLowerCase();

        this.filteredFeeHeads = this.feeHeads.filter(item => {

            const matchesKeyword = !keyword ||
                item.name.toLowerCase().includes(keyword) ||
                (item.description || "").toLowerCase().includes(keyword);

            const matchesStatus =
                this.statusFilter === "all" ||
                (this.statusFilter === "active" && item.status) ||
                (this.statusFilter === "inactive" && !item.status);

            return matchesKeyword && matchesStatus;

        });

        this.renderFeeHeads();

    },

    // Kept for backward compatibility with existing markup/tests
    searchFeeHeads(keyword = "") {

        this.searchTerm = keyword;
        this.applyFilters();

    },

    /* ======================================================
       STATS
    ====================================================== */

    updateStats() {

        if (!this.elements.statTotal) return;

        const total = this.feeHeads.length;
        const active = this.feeHeads.filter(item => item.status).length;
        const inactive = total - active;

        this.elements.statTotal.textContent = total;
        this.elements.statActive.textContent = active;
        this.elements.statInactive.textContent = inactive;

    },

    /* ======================================================
       RENDER FEE HEADS
    ====================================================== */

    renderFeeHeads() {

        if (!this.elements.container) return;

        if (this.elements.resultCount) {

            const count = this.filteredFeeHeads.length;
            this.elements.resultCount.textContent =
                count === this.feeHeads.length
                    ? `${count} fee head${count === 1 ? "" : "s"}`
                    : `${count} of ${this.feeHeads.length} fee heads`;

        }

        if (this.filteredFeeHeads.length === 0) {

            const hasAnyData = this.feeHeads.length > 0;

            this.elements.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${hasAnyData ? "🔍" : "💰"}</div>
                    <h3>${hasAnyData ? "No matching Fee Heads" : "No Fee Heads Yet"}</h3>
                    <p>${hasAnyData
                        ? "Try a different search term or filter."
                        : "Use the form on the left to create your first Fee Head."}</p>
                </div>
            `;

            return;
        }

        this.elements.container.innerHTML = this.filteredFeeHeads
            .map(item => this.createCard(item))
            .join("");

    },

    renderError() {

        if (!this.elements.container) return;

        this.elements.container.innerHTML = `
            <div class="empty-state empty-state-error">
                <div class="empty-state-icon">⚠️</div>
                <h3>Couldn't load Fee Heads</h3>
                <p>Check your connection and try again.</p>
                <button id="btnRetryLoad" class="retry-btn">Retry</button>
            </div>
        `;

        const retryBtn = document.getElementById("btnRetryLoad");

        if (retryBtn) {
            retryBtn.addEventListener("click", () => this.loadFeeHeads());
        }

    },

    /* ======================================================
       LOADING STATE
    ====================================================== */

    setLoading(isLoading) {

        this.isLoading = isLoading;

        if (!this.elements.container) return;

        if (isLoading) {

            this.elements.container.innerHTML = Array.from({ length: 3 })
                .map(() => `
                    <div class="fee-head-card skeleton-card" aria-hidden="true">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-desc"></div>
                        <div class="skeleton-line skeleton-desc short"></div>
                    </div>
                `)
                .join("");

        }

    },

    /* ======================================================
       CREATE CARD
    ====================================================== */

    createCard(item) {

        const isEditing = this.editingId === item._id;

        return `
            <div class="fee-head-card ${isEditing ? "is-editing" : ""}" style="--card-color:${item.color || "#ff7a00"}">

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
                        <span class="status-dot"></span>
                        ${item.status ? "Active" : "Inactive"}
                    </span>

                </div>

                <div class="fee-head-color">
                    <span class="color-circle" style="background:${item.color || "#ff7a00"}"></span>
                    <span>Color Tag</span>
                </div>

                <div class="card-actions">

                    <button class="edit-btn" data-id="${item._id}" aria-label="Edit ${this.escapeHTML(item.name)}">
                        ✏ Edit
                    </button>

                    <button class="status-btn" data-id="${item._id}" aria-label="${item.status ? "Deactivate" : "Activate"} ${this.escapeHTML(item.name)}">
                        ${item.status ? "⏸ Deactivate" : "▶ Activate"}
                    </button>

                    <button class="delete-btn" data-id="${item._id}" aria-label="Delete ${this.escapeHTML(item.name)}">
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

        this.elements.container.addEventListener("click", (event) => {

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

        });

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
       INLINE VALIDATION
    ====================================================== */

    showFieldError(message) {

        if (!this.elements.nameError) return;

        this.elements.nameError.textContent = message;
        this.elements.nameError.hidden = false;
        this.elements.name.classList.add("input-error");

    },

    clearFieldError() {

        if (!this.elements.nameError) return;

        this.elements.nameError.textContent = "";
        this.elements.nameError.hidden = true;
        this.elements.name.classList.remove("input-error");

    },

    updateDescCount() {

        const max = 200;
        const len = this.elements.description.value.length;

        this.elements.descCount.textContent = `${len}/${max}`;
        this.elements.descCount.classList.toggle("over-limit", len > max);

    },

    validateForm() {

        const name = this.elements.name.value.trim();

        this.clearFieldError();

        if (!name) {

            this.showFieldError("Fee Head Name is required.");
            this.elements.name.focus();
            return false;

        }

        const duplicate = this.feeHeads.find(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item._id !== this.editingId
        );

        if (duplicate) {

            this.showFieldError("A Fee Head with this name already exists.");
            this.elements.name.focus();
            return false;

        }

        return true;

    },

    /* ======================================================
       BUTTON LOADING HELPER
    ====================================================== */

    setButtonBusy(isBusy, busyLabel) {

        this.elements.button.disabled = isBusy;

        if (isBusy) {

            this.elements.button.dataset.originalText = this.elements.button.textContent;
            this.elements.button.textContent = busyLabel;

        }
        else if (this.elements.button.dataset.originalText) {

            this.elements.button.textContent = this.elements.button.dataset.originalText;

        }

    },

    /* ======================================================
       CREATE FEE HEAD
    ====================================================== */

    async createFeeHead() {

        if (!this.validateForm()) return;

        this.setButtonBusy(true, "Adding...");

        try {

            const payload = {
                name: this.elements.name.value.trim(),
                description: this.elements.description.value.trim(),
                color: this.elements.color.value
            };

            const response = await apiFetch("/fee-heads", {
                method: "POST",
                auth: true,
                body: payload
            });

            this.showToast(response.message || "Fee Head created successfully.", "success");
            this.resetForm();
            await this.loadFeeHeads();

        }
        catch (error) {

            console.error(error);
            this.showToast(error.message || "Unable to create Fee Head.", "error");

        }
        finally {

            this.setButtonBusy(false);

        }

    },

    /* ======================================================
       EDIT FEE HEAD
    ====================================================== */

    editFeeHead(id) {

        const feeHead = this.feeHeads.find(item => item._id === id);

        if (!feeHead) return;

        this.editingId = id;
        this.clearFieldError();

        this.elements.name.value = feeHead.name;
        this.elements.description.value = feeHead.description || "";
        this.elements.color.value = feeHead.color || "#ff7a00";

        this.updateDescCount();

        this.elements.button.textContent = "Update Fee Head";

        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.hidden = false;
        }

        this.renderFeeHeads();

        this.elements.name.focus();
        this.elements.name.scrollIntoView({ behavior: "smooth", block: "center" });

    },

    /* ======================================================
       UPDATE FEE HEAD
    ====================================================== */

    async updateFeeHead() {

        if (!this.validateForm()) return;

        this.setButtonBusy(true, "Updating...");

        try {

            const payload = {
                name: this.elements.name.value.trim(),
                description: this.elements.description.value.trim(),
                color: this.elements.color.value
            };

            const response = await apiFetch(`/fee-heads/${this.editingId}`, {
                method: "PUT",
                auth: true,
                body: payload
            });

            this.showToast(response.message || "Fee Head updated successfully.", "success");
            this.resetForm();
            await this.loadFeeHeads();

        }
        catch (error) {

            console.error(error);
            this.showToast(error.message || "Unable to update Fee Head.", "error");

        }
        finally {

            this.setButtonBusy(false);

        }

    },

    /* ======================================================
       RESET FORM
    ====================================================== */

    resetForm() {

        this.editingId = null;
        this.clearFieldError();

        this.elements.name.value = "";
        this.elements.description.value = "";
        this.elements.color.value = "#ff7a00";

        this.updateDescCount();

        this.elements.button.textContent = "+ Add Fee Head";

        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.hidden = true;
        }

        this.renderFeeHeads();

    },

    /* ======================================================
       DELETE FEE HEAD (custom confirm dialog)
    ====================================================== */

    deleteFeeHead(id) {

        const feeHead = this.feeHeads.find(item => item._id === id);

        if (!feeHead) return;

        this.showConfirm({
            title: "Delete Fee Head?",
            message: `"${feeHead.name}" will be permanently removed. This can't be undone.`,
            acceptLabel: "Delete",
            onAccept: async () => {

                try {

                    const response = await apiFetch(`/fee-heads/${id}`, {
                        method: "DELETE",
                        auth: true
                    });

                    this.showToast(response.message || "Fee Head deleted successfully.", "success");

                    if (this.editingId === id) {
                        this.resetForm();
                    }

                    await this.loadFeeHeads();

                }
                catch (error) {

                    console.error(error);
                    this.showToast(error.message || "Unable to delete Fee Head.", "error");

                }

            }
        });

    },

    /* ======================================================
       TOGGLE STATUS
    ====================================================== */

    async toggleStatus(id) {

        try {

            const response = await apiFetch(`/fee-heads/${id}/status`, {
                method: "PATCH",
                auth: true
            });

            this.showToast(response.message || "Status updated.", "success");
            await this.loadFeeHeads();

        }
        catch (error) {

            console.error(error);
            this.showToast(error.message || "Unable to update status.", "error");

        }

    },

    /* ======================================================
       TOAST NOTIFICATIONS
    ====================================================== */

    showToast(message, type = "info") {

        if (!this.elements.toastStack) {
            // Fallback if the toast markup isn't present
            alert(message);
            return;
        }

        const icons = { success: "✅", error: "⚠️", info: "ℹ️" };

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.setAttribute("role", "status");

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this.escapeHTML(message)}</span>
            <button class="toast-close" aria-label="Dismiss notification">✕</button>
        `;

        this.elements.toastStack.appendChild(toast);

        const remove = () => {
            toast.classList.add("toast-leaving");
            setTimeout(() => toast.remove(), 200);
        };

        toast.querySelector(".toast-close").addEventListener("click", remove);

        setTimeout(remove, 4000);

    },

    /* ======================================================
       CONFIRM DIALOG
    ====================================================== */

    showConfirm({ title, message, acceptLabel = "Confirm", onAccept }) {

        if (!this.elements.confirmOverlay) {
            // Fallback if the modal markup isn't present
            if (confirm(message)) onAccept();
            return;
        }

        this.elements.confirmTitle.textContent = title;
        this.elements.confirmMessage.textContent = message;
        this.elements.confirmAccept.textContent = acceptLabel;

        this.elements.confirmOverlay.hidden = false;
        document.body.classList.add("modal-open");

        const acceptHandler = () => {

            this.closeConfirm();
            onAccept();

        };

        // Ensure we never stack duplicate listeners
        const freshAccept = this.elements.confirmAccept.cloneNode(true);
        this.elements.confirmAccept.replaceWith(freshAccept);
        this.elements.confirmAccept = freshAccept;

        this.elements.confirmAccept.addEventListener("click", acceptHandler);

        this.elements.confirmAccept.focus();

    },

    closeConfirm() {

        if (!this.elements.confirmOverlay) return;

        this.elements.confirmOverlay.hidden = true;
        document.body.classList.remove("modal-open");

    }

};

/* ==========================================================
   START MODULE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    FeeHeads.init();
});