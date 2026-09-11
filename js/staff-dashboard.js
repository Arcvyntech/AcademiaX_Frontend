// =====================================
// AcademiaX Staff Dashboard
// =====================================

// ---------------------------
// Authentication
// ---------------------------

const token = localStorage.getItem("staff_token");

if (!token) {

    location.href = "staff-login.html";

}

// ---------------------------
// Logout
// ---------------------------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        if (!confirm("Are you sure you want to logout?")) return;

        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff");

        location.href = "staff-login.html";

    });

}

// ---------------------------
// Greeting
// ---------------------------

function setGreeting(name) {

    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if (hour < 12) {

        greeting = "Good Morning";

    } else if (hour < 17) {

        greeting = "Good Afternoon";

    }

    document.querySelector(".topbar h1").innerHTML =

        `${greeting}, <span id="staffName">${name}</span> 👋`;

}

// ---------------------------
// Live Date
// ---------------------------

function createDateClock() {

    const topbar = document.querySelector(".top-right");

    const wrapper = document.createElement("div");

    wrapper.style.textAlign = "right";
    wrapper.style.marginRight = "20px";

    const date = document.createElement("div");
    const time = document.createElement("div");

    date.style.fontWeight = "600";
    time.style.fontSize = "14px";
    time.style.color = "#777";

    wrapper.appendChild(date);
    wrapper.appendChild(time);

    topbar.prepend(wrapper);

    function updateClock() {

        const now = new Date();

        date.innerHTML = now.toLocaleDateString("en-IN", {

            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"

        });

        time.innerHTML = now.toLocaleTimeString();

    }

    updateClock();

    setInterval(updateClock,1000);

}

createDateClock();
// =====================================
// Dashboard API
// =====================================

async function loadDashboard() {

    try {

        const data = await apiFetch("/staff/dashboard", {
    auth: true,
    tokenKey: "staff_token"
});

        if (!data.success) {

            throw new Error("Unable to load dashboard.");

        }

        // -----------------------
        // Greeting
        // -----------------------

        setGreeting(data.staff.name);

        // -----------------------
        // Designation
        // -----------------------

        const designation = document.getElementById("staffDesignation");

        if (designation) {

            designation.textContent =

                data.staff.designation || "Staff";

        }

        // -----------------------
        // Dashboard Cards
        // -----------------------

        const todayClasses = document.getElementById("todayClasses");

        if (todayClasses) {

            todayClasses.textContent =

                data.stats.todayClasses;

        }

        const attendance = document.getElementById("attendanceCount");

        if (attendance) {

            attendance.textContent =

                data.stats.attendance;

        }

        const homework = document.getElementById("homeworkCount");

        if (homework) {

            homework.textContent =

                data.stats.homework;

        }

        const notices = document.getElementById("noticeCount");

        if (notices) {

            notices.textContent =

                data.stats.notices;

        }

        // -----------------------
        // Today's Summary
        // -----------------------

        const summary = document.querySelector(".summary");

        if (summary) {

            summary.innerHTML = `

                <li>📚 Today's Classes : <b>${data.stats.todayClasses}</b></li>

                <li>👨‍🎓 Total Students : <b>${data.stats.attendance}</b></li>

                <li>📝 Homework : <b>${data.stats.homework}</b></li>

                <li>📢 Notices : <b>${data.stats.notices}</b></li>

            `;

        }

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// =====================================
// Load Dashboard
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});
// =====================================
// Card Animation
// =====================================

function animateCards() {

    const cards = document.querySelectorAll(".card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(25px)";

        setTimeout(() => {

            card.style.transition = "0.5s ease";

            card.style.opacity = "1";

            card.style.transform = "translateY(0)";

        }, index * 150);

    });

}

// =====================================
// Notification Badge
// =====================================

function createNotificationBadge() {

    const notificationBtn = document.querySelector(".top-right button");

    if (!notificationBtn) return;

    notificationBtn.style.position = "relative";

    const badge = document.createElement("span");

    badge.innerHTML = "0";

    badge.className = "badge";

    badge.style.position = "absolute";
    badge.style.top = "-6px";
    badge.style.right = "-6px";
    badge.style.width = "20px";
    badge.style.height = "20px";
    badge.style.borderRadius = "50%";
    badge.style.background = "#E53935";
    badge.style.color = "#fff";
    badge.style.display = "flex";
    badge.style.justifyContent = "center";
    badge.style.alignItems = "center";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "600";

    notificationBtn.appendChild(badge);

}

// =====================================
// Timetable Hover
// =====================================

document.querySelectorAll(".schedule-item").forEach(item => {

    item.addEventListener("mouseenter", () => {

        item.style.transform = "scale(1.02)";

    });

    item.addEventListener("mouseleave", () => {

        item.style.transform = "scale(1)";

    });

});

// =====================================
// Quick Action Buttons
// =====================================

document.querySelectorAll(".actions button").forEach(btn => {

    btn.addEventListener("click", () => {

        switch (btn.innerText.trim()) {

            case "Mark Attendance":

                alert("Attendance Module Coming Soon");

                break;

            case "Add Homework":

                alert("Homework Module Coming Soon");

                break;

            case "View Students":

                alert("Student Module Coming Soon");

                break;

            case "Timetable":

                alert("Timetable Module Coming Soon");

                break;

            case "Send Notice":

                alert("Notice Module Coming Soon");

                break;

            case "Apply Leave":

                alert("Leave Module Coming Soon");

                break;

            default:

                alert(btn.innerText);

        }

    });

});

// =====================================
// Session Check
// =====================================

setInterval(() => {

    const token = localStorage.getItem("staff_token");

    if (!token) {

        alert("Session Expired");

        location.href = "staff-login.html";

    }

}, 60000);

// =====================================
// Auto Refresh Dashboard
// =====================================

setInterval(() => {

    loadDashboard();

}, 300000);

// =====================================
// Dashboard Animation
// =====================================

window.addEventListener("load", () => {

    animateCards();

    createNotificationBadge();

});

// =====================================
// Console
// =====================================

console.log("%cAcademiaX Staff Dashboard Loaded",
"color:#F4B400;font-size:16px;font-weight:bold;");

console.log("AcademiaX ERP v1.0");