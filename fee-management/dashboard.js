/* ==========================================================
   AcademiaX Fee Management Dashboard
   Dashboard JavaScript
   Version 1.6 - Logout now uses the styled Modal.confirm()
   dialog instead of the native browser confirm().
========================================================== */

"use strict";

/* ==========================================================
                    DASHBOARD MANAGER
========================================================== */

class DashboardManager {

    constructor() {

        this.stats = {
            feeHeads: 0,
            students: 0,
            todayCollection: 0,
            pendingDue: 0
        };

        this.collections = [];

        this.pendingDues = [];

        this.elements = {};

        this.isLoading = false;

    }

    /* ======================================================
                        INITIALIZE
    ====================================================== */

    async init() {

        Logger.log("Initializing Dashboard...");

        this.cacheElements();

        this.bindEvents();

        await this.loadDashboard();

    }

    /* ======================================================
                    CACHE DOM ELEMENTS
    ====================================================== */

    cacheElements() {

        this.elements = {

            feeHeads: document.getElementById("totalFeeHeads"),

            students: document.getElementById("totalStudents"),

            collection: document.getElementById("todayCollection"),

            due: document.getElementById("pendingDue"),

            recentCollection:

                document.getElementById("recentCollectionList"),

            pendingDue:

                document.getElementById("pendingDueList"),

            btnFeeHead:

                document.getElementById("btnFeeHead"),

            btnTransport:

                document.getElementById("btnTransport"),

            btnFeeSetup:

                document.getElementById("btnFeeSetup"),

            btnCollection:

                document.getElementById("btnCollection"),

            btnReports:

                document.getElementById("btnReports"),

            btnRefresh:

                document.getElementById("btnRefreshDashboard"),

            lastUpdated:

                document.getElementById("lastUpdated"),

            btnLogout:

                document.getElementById("btnLogout")

        };

    }

    /* ======================================================
                    BIND EVENTS
    ====================================================== */

    bindEvents() {

        Logger.log("Binding Events...");

        if (this.elements.btnFeeHead) {

            this.elements.btnFeeHead.addEventListener("click", () => {

                this.openFeeHeads();

            });

        }

        if (this.elements.btnTransport) {

            this.elements.btnTransport.addEventListener("click", () => {

                this.openTransport();

            });

        }

        if (this.elements.btnFeeSetup) {

            this.elements.btnFeeSetup.addEventListener("click", () => {

                this.openFeeSetup();

            });

        }

        if (this.elements.btnCollection) {

            this.elements.btnCollection.addEventListener("click", () => {

                this.openCollection();

            });

        }

        if (this.elements.btnReports) {

            this.elements.btnReports.addEventListener("click", () => {

                this.openReports();

            });

        }

        if (this.elements.btnRefresh) {

            this.elements.btnRefresh.addEventListener("click", () => {

                if (!this.isLoading) {
                    this.loadDashboard();
                }

            });

        }

        if (this.elements.btnLogout) {

            this.elements.btnLogout.addEventListener("click", async (e) => {

                e.preventDefault();

                await this.handleLogout();

            });

        }

    }

    /* ======================================================
                    LOAD DASHBOARD
    ====================================================== */

    async loadDashboard() {

        this.isLoading = true;
        this.setRefreshBusy(true);

        Loader.show();

        try {

            await this.loadStatistics();

            await this.loadRecentCollections();

            await this.loadPendingDue();

            this.updateLastUpdated();

        }

        catch (error) {

            // Loading issues are logged, not surfaced as an alarming
            // banner/toast — the UI just shows zero/empty states.
            Logger.error(error);

        }

        finally {

            Loader.hide();
            this.isLoading = false;
            this.setRefreshBusy(false);

        }

    }

    /* ======================================================
                    LOAD STATISTICS
    ====================================================== */

    async loadStatistics() {

        Logger.log("Loading Statistics...");

        const response = await ApiService.get("/fee/dashboard", { silent: true });

        if (response && response.data) {

            this.stats = {
                feeHeads: response.data.feeHeads || 0,
                students: response.data.students || 0,
                todayCollection: response.data.todayCollection || 0,
                pendingDue: response.data.pendingDue || 0
            };

        } else {

            Logger.log("Dashboard statistics unavailable from API.");

            this.stats = {
                feeHeads: 0,
                students: 0,
                todayCollection: 0,
                pendingDue: 0
            };

        }

        this.updateStatCards();

    }

    /* ======================================================
                UPDATE DASHBOARD CARDS
    ====================================================== */

    updateStatCards() {

        if (this.elements.feeHeads) {

            this.elements.feeHeads.textContent =

                this.stats.feeHeads;

        }

        if (this.elements.students) {

            this.elements.students.textContent =

                this.stats.students;

        }

        if (this.elements.collection) {

            this.elements.collection.textContent =

                Utils.formatCurrency(

                    this.stats.todayCollection

                );

        }

        if (this.elements.due) {

            this.elements.due.textContent =

                Utils.formatCurrency(

                    this.stats.pendingDue

                );

        }

    }

    /* ======================================================
                LOAD RECENT COLLECTIONS
    ====================================================== */

    async loadRecentCollections() {

        Logger.log("Loading Recent Collections...");

        const response = await ApiService.get("/collection/recent", { silent: true });

        if (response && response.data) {

            this.collections = response.data;

        } else {

            Logger.log("Recent collections unavailable from API.");

            this.collections = [];

        }

        this.renderRecentCollections();

    }

    /* ======================================================
                LOAD PENDING DUE
    ====================================================== */

    async loadPendingDue() {

        Logger.log("Loading Pending Due...");

        const response = await ApiService.get("/due/pending", { silent: true });

        if (response && response.data) {

            this.pendingDues = response.data;

        } else {

            Logger.log("Pending due data unavailable from API.");

            this.pendingDues = [];

        }

        this.renderPendingDue();

    }

    /* ======================================================
                RENDER COLLECTIONS
    ====================================================== */

    renderRecentCollections() {

        if (!this.elements.recentCollection) return;

        this.elements.recentCollection.innerHTML = "";

        if (!this.collections || this.collections.length === 0) {

            this.elements.recentCollection.innerHTML =
                '<p class="empty-state">No collections recorded yet.</p>';

            return;

        }

        this.collections.forEach(item => {

            const row = document.createElement("div");

            row.className = "dashboard-item";

            row.innerHTML = `
                <div class="dashboard-item-avatar">${this.getInitials(item.student)}</div>
                <div class="dashboard-item-info">
                    <strong>${item.student}</strong>
                    <small>${item.date}</small>
                </div>
                <span class="dashboard-item-amount amount-positive">+${Utils.formatCurrency(item.amount)}</span>
            `;

            this.elements.recentCollection.appendChild(row);

        });

    }

    getInitials(name) {

        if (!name) return "?";

        return name.split(" ").map(part => part[0]).join("").substring(0, 2).toUpperCase();

    }

    /* ======================================================
                RENDER PENDING DUE
    ====================================================== */

    renderPendingDue() {

        if (!this.elements.pendingDue) return;

        this.elements.pendingDue.innerHTML = "";

        if (!this.pendingDues || this.pendingDues.length === 0) {

            this.elements.pendingDue.innerHTML =
                '<p class="empty-state">All caught up — no pending dues.</p>';

            return;

        }

        this.pendingDues.forEach(item => {

            const row = document.createElement("div");

            row.className = "dashboard-item";

            row.innerHTML = `
                <div class="dashboard-item-avatar avatar-due">${this.getInitials(item.student)}</div>
                <div class="dashboard-item-info">
                    <strong>${item.student}</strong>
                    <small>Pending payment</small>
                </div>
                <span class="dashboard-item-amount amount-due">${Utils.formatCurrency(item.amount)}</span>
            `;

            this.elements.pendingDue.appendChild(row);

        });

    }

    /* ======================================================
                REFRESH BUTTON STATE
    ====================================================== */

    setRefreshBusy(isBusy) {

        if (!this.elements.btnRefresh) return;

        this.elements.btnRefresh.disabled = isBusy;
        this.elements.btnRefresh.classList.toggle("is-refreshing", isBusy);

    }

    updateLastUpdated() {

        if (!this.elements.lastUpdated) return;

        const now = new Date();

        const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        this.elements.lastUpdated.textContent = `Updated ${time}`;

    }

    /* ======================================================
                NAVIGATION
    ====================================================== */

    openFeeHeads() {

        window.location.href = "fee-heads/index.html";

    }

    openTransport() {

        window.location.href = "transport/index.html";

    }

    openFeeSetup() {

        window.location.href = "fee-management/index.html#tab-fee-setup";

    }

    openCollection() {

        window.location.href = "fee-management/index.html#tab-collection";

    }

    openReports() {

        Toast.info("Reports Module Coming Soon");

    }

    /* ======================================================
                LOGOUT
    ====================================================== */

    async handleLogout() {

        const confirmed = await Modal.confirm({
            title: "Log out?",
            message: "You'll need to sign in again to access your dashboard.",
            confirmText: "Logout",
            cancelText: "Cancel",
            variant: "danger"
        });

        if (!confirmed) return;

        Logger.log("Logging out...");

        Storage.remove("token");
        localStorage.clear();

        window.location.href = "index.html";

    }

}

/* ==========================================================
                INITIALIZE DASHBOARD
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const dashboard = new DashboardManager();

    dashboard.init();

});