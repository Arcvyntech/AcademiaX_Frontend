// ======================================
// Fee Management Module Access
// ======================================

function renderFeeModule(subscription){

    const status=document.getElementById("feeModuleStatus");

    const button=document.getElementById("feeModuleBtn");

    if(!status || !button) return;

    const active=

        subscription.features &&

        subscription.features.includes("fee_management");

    if(active){

        status.innerHTML="🟢 Active";

        status.style.background="#DCFCE7";

        status.style.color="#15803D";

        button.innerHTML="Open Module";

        button.style.background="#2563EB";

        button.style.color="#fff";

        button.onclick=function(){

            window.location.href="fee-management/dashboard.html";

        };

    }

    else{

        status.innerHTML="🔒 Locked";

        status.style.background="#FEE2E2";

        status.style.color="#DC2626";

        button.innerHTML="Upgrade Plan";

        button.style.background="#F59E0B";

        button.style.color="#fff";

        button.onclick=function(){

            window.location.href="subscription.html";

        };

    }

}