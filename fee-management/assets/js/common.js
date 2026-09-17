/* ==========================================================
   AcademiaX Fee Management
   Common JavaScript Library
   Version 1.0
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

            Toast.error(error.message);

            return null;

        }

    }


    static get(endpoint) {

        return this.request(endpoint);

    }


    static post(endpoint, body) {

        return this.request(endpoint, {

            method: "POST",

            body

        });

    }


    static put(endpoint, body) {

        return this.request(endpoint, {

            method: "PUT",

            body

        });

    }


    static delete(endpoint) {

        return this.request(endpoint, {

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