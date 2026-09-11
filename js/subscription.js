/* ==========================================================
   AcademiaX Subscription Center
   Part 3A
   Plans Data + Individual Plans + Premium Plan
========================================================== */

// =============================
// PLAN DATA
// =============================

const plans = [

    {
        id: 1,

        title: "Fee Management",

        icon: "💰",

        monthly: 499,

        yearly: 499 * 12 * 0.80,

        description:
            "Manage student fee collection, pending fees, receipts and reports.",

        features: [

            "Student Fee Collection",

            "Pending Fee Reports",

            "Auto Receipts",

            "Fee Analytics"

        ]
    },

    {
        id: 2,

        title: "ID Card Management",

        icon: "🪪",

        monthly: 399,

        yearly: 399 * 12 * 0.80,

        description:
            "Generate and print professional Student & Staff ID Cards.",

        features: [

            "Student ID",

            "Staff ID",

            "QR Code",

            "Print Ready"

        ]
    },

    {
        id: 3,

        title: "Online Fee Payment",

        icon: "💳",

        monthly: 599,

        yearly: 599 * 12 * 0.80,

        description:
            "Accept fee online using UPI, Cards and Net Banking.",

        features: [

            "UPI Payment",

            "Cards",

            "Net Banking",

            "Payment Reports"

        ]
    },

    {
        id: 4,

        title: "Teacher Parent Chat",

        icon: "💬",

        monthly: 499,

        yearly: 499 * 12 * 0.80,

        description:
            "Secure communication between teachers and parents.",

        features: [

            "Real Time Chat",

            "Media Sharing",

            "Notifications",

            "Chat History"

        ]
    }

];


// =============================
// BILLING TYPE
// =============================

let billingType = "monthly";


// =============================
// FORMAT PRICE
// =============================

function getPrice(plan){

    if(billingType==="monthly"){

        return plan.monthly;

    }

    return Math.round(plan.yearly);

}


// =============================
// RENDER INDIVIDUAL PLANS
// =============================

function renderIndividualPlans(){

    const container=document.getElementById("individualPlans");

    container.innerHTML="";

    plans.forEach(plan=>{

        container.innerHTML += `

        <div class="plan-card">

            <div class="plan-icon">

                ${plan.icon}

            </div>

            <h3>

                ${plan.title}

            </h3>

            <p class="plan-description">

                ${plan.description}

            </p>

            <div class="price">

                ₹${getPrice(plan)}

                <span>

                    / ${billingType}

                </span>

            </div>

            <ul class="features">

                ${plan.features.map(item=>`

                    <li>

                        <i class="fa-solid fa-check"></i>

                        ${item}

                    </li>

                `).join("")}

            </ul>

            <button

                class="subscribe-btn"

                onclick="subscribe('${plan.title}',${getPrice(plan)})">

                Subscribe

            </button>

        </div>

        `;

    });

}



// =============================
// PREMIUM PLAN
// =============================

function renderPremiumPlan(){

    const premium=document.getElementById("premiumPlan");

    const totalMonthly=

        plans.reduce((sum,p)=>sum+p.monthly,0);

    const totalYearly=

        plans.reduce((sum,p)=>sum+p.yearly,0);

    const price=

        billingType==="monthly"

        ?

        Math.round(totalMonthly*0.70)

        :

        Math.round(totalYearly*0.70);

    premium.innerHTML=`

    <div class="premium-card">

        <span class="badge">

            MOST POPULAR

        </span>

        <h2>

            🚀 AcademiaX Premium

        </h2>

        <p>

            Get every premium module with one subscription.

        </p>

        <div class="premium-price">

            ₹${price}

            <span>

                / ${billingType}

            </span>

        </div>

        <ul class="features">

            ${plans.map(plan=>`

            <li>

                <i class="fa-solid fa-check"></i>

                ${plan.title}

            </li>

            `).join("")}

        </ul>

        <button

            class="premium-btn"

            onclick="subscribe('AcademiaX Premium',${price})">

            Get Premium

        </button>

    </div>

    `;

}



// =============================
// INITIAL LOAD
// =============================

renderIndividualPlans();

renderPremiumPlan();
/* ==========================================================
   PART 3B
   Combo Plans + Billing Toggle
==========================================================*/


// =====================================
// GENERATE ALL 2-PLAN COMBINATIONS
// =====================================

function generateCombinations(arr){

    let combos=[];

    for(let i=0;i<arr.length;i++){

        for(let j=i+1;j<arr.length;j++){

            combos.push([arr[i],arr[j]]);

        }

    }

    return combos;

}



// =====================================
// RENDER COMBO PLANS
// =====================================

function renderComboPlans(){

    const container=document.getElementById("comboPlans");

    container.innerHTML="";

    const combos=generateCombinations(plans);

    combos.forEach((combo,index)=>{

        const monthlyPrice=

            combo[0].monthly+

            combo[1].monthly;

        const yearlyPrice=

            combo[0].yearly+

            combo[1].yearly;

        const finalPrice=

            billingType==="monthly"

            ?

            Math.round(monthlyPrice*0.85)

            :

            Math.round(yearlyPrice*0.85);

        const originalPrice=

            billingType==="monthly"

            ?

            monthlyPrice

            :

            yearlyPrice;

        const save=

            originalPrice-finalPrice;

        container.innerHTML+=`

        <div class="plan-card">

            <span class="badge">

                SAVE ₹${save}

            </span>

            <div class="plan-icon">

                ${combo[0].icon}

                ${combo[1].icon}

            </div>

            <h3>

                ${combo[0].title}

                +

                ${combo[1].title}

            </h3>

            <p class="plan-description">

                Best combo for schools looking to save more.

            </p>

            <div class="price">

                ₹${finalPrice}

                <span>

                    / ${billingType}

                </span>

            </div>

            <ul class="features">

                <li>

                    <i class="fa-solid fa-check"></i>

                    ${combo[0].title}

                </li>

                <li>

                    <i class="fa-solid fa-check"></i>

                    ${combo[1].title}

                </li>

            </ul>

            <button

                class="subscribe-btn"

                onclick="subscribe(

                    '${combo[0].title} + ${combo[1].title}',

                    ${finalPrice}

                )">

                Subscribe

            </button>

        </div>

        `;

    });

}



// =====================================
// BILLING TOGGLE
// =====================================

const billingButtons=document.querySelectorAll(".billing-btn");

billingButtons.forEach(button=>{

    button.addEventListener("click",()=>{

        billingButtons.forEach(btn=>{

            btn.classList.remove("active");

        });

        button.classList.add("active");

        if(button.innerText.includes("Yearly")){

            billingType="yearly";

        }

        else{

            billingType="monthly";

        }

        renderIndividualPlans();

        renderComboPlans();

        renderPremiumPlan();

    });

});




// =====================================
// INITIAL LOAD
// =====================================

renderComboPlans();
/* ==========================================================
   PART 3C
   Subscribe Modal + Backend Ready + Payment Ready
==========================================================*/

// ===============================
// MODAL ELEMENTS
// ===============================

const modal = document.getElementById("subscriptionModal");
const selectedPlan = document.getElementById("selectedPlan");
const continuePayment = document.getElementById("continuePayment");

let selectedSubscription = null;


// ===============================
// OPEN SUBSCRIBE MODAL
// ===============================

function subscribe(planName, price){

    selectedSubscription = {

        planName,

        price,

        billingType

    };

    selectedPlan.innerHTML = `

        <strong>${planName}</strong>

        <br><br>

        Price :

        <strong>

        ₹${price}

        </strong>

        / ${billingType}

    `;

    modal.style.display = "flex";

}



// ===============================
// CLOSE MODAL
// ===============================

function closeModal(){

    modal.style.display = "none";

}



// Click outside modal

window.addEventListener("click",(e)=>{

    if(e.target===modal){

        closeModal();

    }

});



// ESC key

window.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeModal();

    }

});




// ===============================
// CONTINUE PAYMENT
// ===============================

continuePayment.addEventListener("click", async () => {

    if (!selectedSubscription) return;

    continuePayment.disabled = true;
    continuePayment.innerHTML = "Processing...";

    try {

        const institution = JSON.parse(
            localStorage.getItem("ax_institution") || "{}"
        );

        await apiFetch("/subscription/subscribe", {

            method: "POST",

            auth: true,

            body: {

                institutionId: institution.id,

                institutionCode: institution.code,

                planName: selectedSubscription.planName,

                planType: "individual",

                features: [],

                billingCycle: selectedSubscription.billingType,

                amount: selectedSubscription.price

            }

        });

        closeModal();

        continuePayment.disabled = false;

        continuePayment.innerHTML = "Continue";

        document.getElementById("successPlan").innerText =
            selectedSubscription.planName;

        document.getElementById("successPrice").innerText =
            "₹" +
            selectedSubscription.price +
            " / " +
            selectedSubscription.billingType;

        document.getElementById("successModal").style.display = "flex";

    }

    catch (err) {

        console.error(err);

        continuePayment.disabled = false;

        continuePayment.innerHTML = "Continue";

        alert(err.message);

    }

});
// ===============================
// DASHBOARD BUTTON
// ===============================

const dashboardBtn=document.querySelector(".dashboard-btn");

if(dashboardBtn){

    dashboardBtn.addEventListener("click",()=>{

        // Change according to your dashboard filename

        window.location.href="dashboard.html";

    });

}



// ===============================
// FUTURE API METHODS
// ===============================

async function getCurrentSubscription(){

    /*
    const res=await fetch("/api/subscription/current");

    return await res.json();
    */

}



async function cancelSubscription(){

    /*
    await fetch("/api/subscription/cancel",{

        method:"POST"

    });
    */

}



async function renewSubscription(){

    /*
    await fetch("/api/subscription/renew",{

        method:"POST"

    });
    */

}



// ===============================
// PAGE LOADED
// ===============================

console.log("AcademiaX Subscription Module Loaded");
function goDashboard() {
    window.location.href = "dashboard.html";
}