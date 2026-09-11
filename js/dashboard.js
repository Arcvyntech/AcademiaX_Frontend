
// ======================================================
// AcademiaX Dashboard
// Part 1
// ======================================================
(async () => {

    // ==========================================
    // Authentication Check
    // ==========================================

    const token = localStorage.getItem("ax_token");

    if (!token) {

        location.href = "login.html";

        return;

    }

    const institution = JSON.parse(

        localStorage.getItem("ax_institution") || "{}"

    );

    // ==========================================
    // Institution Profile
    // ==========================================

    try {

        const profile = await apiFetch(

            "/institution/profile",

            {

                auth: true,

                tokenKey: "ax_token"

            }

        );

        document.getElementById("instName").textContent =

            profile.institution.name;

        document.getElementById("instCode").textContent =

            profile.institution.code;

        document.getElementById("welcomeName").textContent =

            profile.institution.name;

    }

    catch (err) {

        console.error("PROFILE ERROR :", err);

        alert(err.message);

        return;

    }

    // ==========================================
    // Dashboard Statistics
    // ==========================================

    try {

        const stats = await apiFetch(

            "/admin/stats",

            {

                auth: true,

                tokenKey: "ax_token"

            }

        );

        document.getElementById("stStaff").textContent =
            stats.data.staff;

        document.getElementById("stClasses").textContent =
            stats.data.classes;

        document.getElementById("stSubjects").textContent =
            stats.data.subjects;

        document.getElementById("stStudents").textContent =
            stats.data.students;

    }

    catch (err) {

        console.log("Stats Error :", err);

    }

    // ==========================================
    // Current Subscription
    // ==========================================

    try {

        const subscription = await apiFetch(

            "/subscription/current/" +

            institution.code,

            {

                auth: true,

                tokenKey: "ax_token"

            }

        );

        const sub = subscription.data;

        document.getElementById("subscriptionPlan").textContent =
            sub.planName;

        document.getElementById("subscriptionBilling").textContent =
            sub.billingCycle;

        document.getElementById("subscriptionAmount").textContent =
            "₹" + sub.amount;

        document.getElementById("subscriptionExpiry").textContent =
            formatDate(sub.expiresAt);

        updateSubscriptionStatus(

            sub.status,

            sub.paymentStatus

        );
        renderFeeModule(sub);

    }

    catch (err) {

        console.log("Subscription :", err);

    }
        // ==========================================
    // End of Main Function
    // ==========================================

})();


// ==========================================
// Format Date
// ==========================================

function formatDate(date) {

    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });

}


// ==========================================
// Subscription Status Badge
// ==========================================

function updateSubscriptionStatus(status, paymentStatus) {

    const badge = document.getElementById("subscriptionStatus");

    if (!badge) return;

    if (paymentStatus === "pending") {

        badge.textContent = "🟡 Pending";

        badge.className = "subscription-status pending";

        return;

    }

    if (status === "active") {

        badge.textContent = "🟢 Active";

        badge.className = "subscription-status active";

        return;

    }

    if (status === "expired") {

        badge.textContent = "🔴 Expired";

        badge.className = "subscription-status expired";

        return;

    }

    if (status === "cancelled") {

        badge.textContent = "⚫ Cancelled";

        badge.className = "subscription-status cancelled";

        return;

    }

    badge.textContent = status;

}


// ==========================================
// Logout
// ==========================================

document.getElementById("logout").addEventListener("click", () => {

    localStorage.removeItem("ax_token");

    localStorage.removeItem("ax_institution");

    location.href = "login.html";

});


// ==========================================
// Dashboard Ready
// ==========================================

console.log("AcademiaX Dashboard Loaded Successfully");