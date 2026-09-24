/* ==========================================================
   AcademiaX Fee Management
   Common JavaScript Library
   Version 1.2 - Added Modal.confirm() for styled confirm
   dialogs (used by Logout and reusable for future actions
   like delete/cancel confirmations).
========================================================== */

"use strict";

/* ==========================================================
   CONFIGURATION
========================================================== */

const CONFIG = {

    API_BASE: "http://localhost:5000/api",

    REQUEST_TIMEOUT: 15000,

    DEBUG: true

};


/* ==========================================================
   LOGGER
========================================================== */

const Logger = {

    log(...args) {

        if (CONFIG.DEBUG) {

            console.log("[AcademiaX]", ...args);

        }

    },

    error(...args) {

        console.error("[AcademiaX]", ...args);

    }

};


/* ==========================================================
   STORAGE
========================================================== */

const Storage = {

    set(key, value) {

        localStorage.setItem(key, JSON.stringify(value));

    },

    get(key) {

        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) : null;

    },

    remove(key) {

        localStorage.removeItem(key);

    },

    clear() {

        localStorage.clear();

    }

};


/* ==========================================================
   TOKEN
========================================================== */

function getToken() {

    return localStorage.getItem("token");

}


/* ==========================================================
   API SERVICE
========================================================== */

class ApiService {

    /**
     * @param {string} endpoint
     * @param {object} options
     * @param {string} [options.method]
     * @param {object} [options.body]
     * @param {boolean} [options.silent] - when true, suppress the
     *        built-in Toast.error on failure (caller handles the
     *        error UI itself, e.g. a single combined banner).
     */
    static async request(endpoint, options = {}) {

        const token = getToken();

        const config = {

            method: options.method || "GET",

            headers: {

                "Content-Type": "application/json",

                ...(token && {

                    Authorization: `Bearer ${token}`

                })

            }

        };

        if (options.body) {

            config.body = JSON.stringify(options.body);

        }

        try {

            const response = await fetch(

                CONFIG.API_BASE + endpoint,

                config

            );

            const result = await response.json();

            if (!response.ok) {

                throw new Error(result.message || "Request Failed");

            }

            return result;

        }

        catch (error) {

            Logger.error(error);

            if (!options.silent) {

                Toast.error(error.message);

            }

            return null;

        }

    }


    static get(endpoint, options = {}) {

        return this.request(endpoint, { ...options, method: "GET" });

    }


    static post(endpoint, body, options = {}) {

        return this.request(endpoint, {

            ...options,

            method: "POST",

            body

        });

    }


    static put(endpoint, body, options = {}) {

        return this.request(endpoint, {

            ...options,

            method: "PUT",

            body

        });

    }


    static delete(endpoint, options = {}) {

        return this.request(endpoint, {

            ...options,

            method: "DELETE"

        });

    }

}


/* ==========================================================
   TOAST
========================================================== */

const Toast = {

    _icons: {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ"
    },

    _getContainer() {

        var container = document.getElementById("appToastContainer");

        if (!container) {

            container = document.createElement("div");
            container.id = "appToastContainer";
            container.className = "app-toast-container";
            document.body.appendChild(container);

        }

        return container;

    },

    _show(message, type) {

        var container = this._getContainer();

        var toast = document.createElement("div");
        toast.className = "app-toast app-toast-" + type;
        toast.innerHTML =
            '<span class="app-toast-icon">' + this._icons[type] + '</span>' +
            '<span class="app-toast-msg"></span>' +
            '<button class="app-toast-close" aria-label="Close">&times;</button>';

        toast.querySelector(".app-toast-msg").textContent = message;

        var remove = function() {
            toast.classList.remove("show");
            toast.classList.add("hide");
            setTimeout(function() { toast.remove(); }, 350);
        };

        toast.querySelector(".app-toast-close").addEventListener("click", remove);

        container.appendChild(toast);

        requestAnimationFrame(function() { toast.classList.add("show"); });

        setTimeout(remove, 4000);

    },

    success(message) {

        this._show(message, "success");

    },

    error(message) {

        this._show(message, "error");

    },

    warning(message) {

        this._show(message, "warning");

    },

    info(message) {

        this._show(message, "info");

    }

};


/* ==========================================================
   LOADER
========================================================== */

const Loader = {

    _getOverlay() {

        var overlay = document.getElementById("appLoaderOverlay");

        if (!overlay) {

            overlay = document.createElement("div");
            overlay.id = "appLoaderOverlay";
            overlay.className = "app-loader-overlay";
            overlay.innerHTML = '<div class="app-spinner"></div>';
            document.body.appendChild(overlay);

        }

        return overlay;

    },

    show() {

        Logger.log("Loading...");
        this._getOverlay().classList.add("active");

    },

    hide() {

        Logger.log("Loading Finished");
        this._getOverlay().classList.remove("active");

    }

};


/* ==========================================================
   MODAL (Confirm Dialog)
   Reusable styled confirm dialog. Usage:

   const ok = await Modal.confirm({
       title: "Log out?",
       message: "You'll need to sign in again.",
       confirmText: "Logout",
       cancelText: "Cancel",
       variant: "danger"
   });

   if (ok) { ...proceed... }
========================================================== */

const Modal = {

    _getOverlay() {

        var overlay = document.getElementById("appModalOverlay");

        if (!overlay) {

            overlay = document.createElement("div");
            overlay.id = "appModalOverlay";
            overlay.className = "app-modal-overlay";

            overlay.innerHTML = `
                <div class="app-modal-box">
                    <div class="app-modal-icon"></div>
                    <h3 class="app-modal-title"></h3>
                    <p class="app-modal-message"></p>
                    <div class="app-modal-actions">
                        <button type="button" class="app-modal-btn app-modal-btn-cancel">Cancel</button>
                        <button type="button" class="app-modal-btn app-modal-btn-confirm">Confirm</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

        }

        return overlay;

    },

    /**
     * Shows a styled confirm dialog.
     * @param {object} opts
     * @param {string} [opts.title]
     * @param {string} [opts.message]
     * @param {string} [opts.confirmText]
     * @param {string} [opts.cancelText]
     * @param {string} [opts.variant] - "danger" | "default"
     * @returns {Promise<boolean>} resolves true if confirmed, false if cancelled
     */
    confirm(opts = {}) {

        const overlay = this._getOverlay();

        const box = overlay.querySelector(".app-modal-box");
        const iconEl = overlay.querySelector(".app-modal-icon");
        const titleEl = overlay.querySelector(".app-modal-title");
        const msgEl = overlay.querySelector(".app-modal-message");
        const btnCancel = overlay.querySelector(".app-modal-btn-cancel");
        const btnConfirm = overlay.querySelector(".app-modal-btn-confirm");

        titleEl.textContent = opts.title || "Are you sure?";
        msgEl.textContent = opts.message || "Do you want to proceed?";
        btnCancel.textContent = opts.cancelText || "Cancel";
        btnConfirm.textContent = opts.confirmText || "Confirm";

        box.classList.toggle("app-modal-danger", opts.variant === "danger");

        iconEl.innerHTML = opts.variant === "danger"
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>';

        return new Promise((resolve) => {

            const cleanup = (result) => {
                overlay.classList.remove("active");
                btnCancel.removeEventListener("click", onCancel);
                btnConfirm.removeEventListener("click", onConfirm);
                overlay.removeEventListener("click", onOverlayClick);
                document.removeEventListener("keydown", onKeydown);
                resolve(result);
            };

            const onCancel = () => cleanup(false);
            const onConfirm = () => cleanup(true);

            const onOverlayClick = (e) => {
                if (e.target === overlay) cleanup(false);
            };

            const onKeydown = (e) => {
                if (e.key === "Escape") cleanup(false);
            };

            btnCancel.addEventListener("click", onCancel);
            btnConfirm.addEventListener("click", onConfirm);
            overlay.addEventListener("click", onOverlayClick);
            document.addEventListener("keydown", onKeydown);

            overlay.classList.add("active");
            btnConfirm.focus();

        });

    }

};


/* ==========================================================
   UTILITIES
========================================================== */

const Utils = {

    formatCurrency(amount) {

        return new Intl.NumberFormat("en-IN", {

            style: "currency",

            currency: "INR"

        }).format(amount);

    },

    formatDate(date) {

        return new Date(date).toLocaleDateString();

    },

    generateId() {

        return Date.now();

    }

};


/* ==========================================================
   COMMON INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    Logger.log("Common Library Loaded");

});