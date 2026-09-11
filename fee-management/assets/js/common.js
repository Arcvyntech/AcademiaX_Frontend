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

    success(message) {

        alert(message);

    },

    error(message) {

        alert(message);

    },

    warning(message) {

        alert(message);

    },

    info(message) {

        alert(message);

    }

};


/* ==========================================================
   LOADER
========================================================== */

const Loader = {

    show() {

        Logger.log("Loading...");

    },

    hide() {

        Logger.log("Loading Finished");

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