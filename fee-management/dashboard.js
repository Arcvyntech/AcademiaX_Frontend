/* ==========================================================
   AcademiaX Fee Management Dashboard
   Dashboard JavaScript
   Version 1.0
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

                document.getElementById("btnReports")

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

    }

    /* ======================================================
                    LOAD DASHBOARD
    ====================================================== */

    async loadDashboard() {

        Loader.show();

        try {

            await this.loadStatistics();

            await this.loadRecentCollections();

            await this.loadPendingDue();

        }

        catch (error) {

            Logger.error(error);

            Toast.error("Unable to load dashboard.");

        }

        finally {

            Loader.hide();

        }

    }

    /* ======================================================
                    LOAD STATISTICS
    ====================================================== */

    async loadStatistics() {

        Logger.log("Loading Statistics...");

        /*
            Future API

            const response =
            await ApiService.get("/fee/dashboard");

        */

        this.stats = {

            feeHeads: 12,

            students: 856,

            todayCollection: 145000,

            pendingDue: 362000

        };

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

        /*
            Future API

            this.collections =
            await ApiService.get("/collection/recent");
        */

        this.collections = [

            {
                student: "Rahul Sharma",
                amount: 2500,
                date: "22 Jul 2026"
            },

            {
                student: "Aman Verma",
                amount: 3200,
                date: "22 Jul 2026"
            },

            {
                student: "Priya Joshi",
                amount: 1800,
                date: "22 Jul 2026"
            }

        ];

        this.renderRecentCollections();

    }

    /* ======================================================
                LOAD PENDING DUE
    ====================================================== */

    async loadPendingDue() {

        Logger.log("Loading Pending Due...");

        /*
            Future API

            this.pendingDues =
            await ApiService.get("/due/pending");
        */

        this.pendingDues = [

            {
                student: "Karan Singh",
                amount: 4500
            },

            {
                student: "Neha Rawat",
                amount: 2700
            },

            {
                student: "Rohan Bisht",
                amount: 3900
            }

        ];

        this.renderPendingDue();

    }

    /* ======================================================
                RENDER COLLECTIONS
    ====================================================== */

    renderRecentCollections() {

        if (!this.elements.recentCollection) return;

        this.elements.recentCollection.innerHTML = "";

        this.collections.forEach(item => {

            const row = document.createElement("div");

            row.className = "dashboard-item";

            row.innerHTML = `

                <strong>${item.student}</strong>

                <span>${Utils.formatCurrency(item.amount)}</span>

                <small>${item.date}</small>

            `;

            this.elements.recentCollection.appendChild(row);

        });

    }

    /* ======================================================
                RENDER PENDING DUE
    ====================================================== */

    renderPendingDue() {

        if (!this.elements.pendingDue) return;

        this.elements.pendingDue.innerHTML = "";

        this.pendingDues.forEach(item => {

            const row = document.createElement("div");

            row.className = "dashboard-item";

            row.innerHTML = `

                <strong>${item.student}</strong>

                <span>${Utils.formatCurrency(item.amount)}</span>

            `;

            this.elements.pendingDue.appendChild(row);

        });

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

        window.location.href = "fee-setup/index.html";

    }

    openCollection() {

        window.location.href = "collection/index.html";

    }

    openReports() {

        Toast.info("Reports Module Coming Soon");

    }

}

/* ==========================================================
                INITIALIZE DASHBOARD
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const dashboard = new DashboardManager();

    dashboard.init();

});