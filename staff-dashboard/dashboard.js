// PUBLIC WEBSITE CONFIGURATION
const PUBLIC_WEBSITE_URL =
  "https://b-nyang15.github.io/meditrust-health-centre/";

document.getElementById("viewPublicWebsite").href = PUBLIC_WEBSITE_URL;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// SUPABASE CONNECTION
const SUPABASE_URL = "https://dbacmnqminkbrnequplq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_TzcYMh4sGPahOXQDh561bA_J-sjl2qT";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// HIDE DASHBOARD UNTIL ACCESS IS VERIFIED
document.body.style.visibility = "hidden";

// DASHBOARD INITIALIZATION
async function initializeDashboard() {
  try {
    // 1. Check whether a user is signed in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.replace("index.html");
      return;
    }

    // 2. Check the user's staff account
    const { data: staff, error: staffError } = await supabase
      .from("staff_members")
      .select("full_name, role, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffError || !staff || !staff.is_active) {
      await supabase.auth.signOut();
      window.location.replace("index.html");
      return;
    }

    // 3. Only administrators and finance staff
    // can access payment management.
    if (!["admin", "finance"].includes(staff.role)) {
      await supabase.auth.signOut();
      window.location.replace("index.html");
      return;
    }

    // 4. Display the verified staff details
    const adminName = document.querySelector(".admin-profile strong");
    const adminRole = document.querySelector(".admin-profile small");

    adminName.textContent = staff.full_name;
    adminRole.textContent = staff.role.toUpperCase();

    // 5. Display the dashboard
    document.body.style.visibility = "visible";

    // 6. Load payment information
    await loadPaymentStatistics();
  } catch (error) {
    console.error("Dashboard initialization failed:", error);
    window.location.replace("index.html");
  }
}

// LOAD PAYMENT STATISTICS
async function loadPaymentStatistics() {
  const statuses = ["pending", "verified", "rejected"];
  const counts = {};

  try {
    const { count: total, error: totalError } = await supabase
      .from("payment_submissions")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    for (const status of statuses) {
      const { count, error } = await supabase
        .from("payment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (error) throw error;
      counts[status] = count ?? 0;
    }

    document.getElementById("totalPayments").textContent = total ?? 0;
    document.getElementById("pendingPayments").textContent = counts.pending;
    document.getElementById("verifiedPayments").textContent = counts.verified;
    document.getElementById("rejectedPayments").textContent = counts.rejected;

    await loadRecentPayments();
  } catch (error) {
    console.error("Could not load payment statistics:", error);
  }
}

// LOAD RECENT PAYMENTS
async function loadRecentPayments() {
  const tableBody = document.getElementById("paymentsTableBody");

  const { data: payments, error } = await supabase
    .from("payment_submissions")
    .select("payer_name, transaction_code, amount, payment_method, status")
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Could not load payments:", error);
    tableBody.textContent = "Unable to load payment records.";
    return;
  }

  tableBody.replaceChildren();

  if (!payments || payments.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No payment submissions yet.";

    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  payments.forEach((payment) => {
    const row = document.createElement("tr");

    const values = [
      payment.payer_name,
      payment.transaction_code,
      `KES ${Number(payment.amount).toLocaleString("en-KE")}`,
      payment.payment_method,
      payment.status,
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "";
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

// REFRESH BUTTON
document
  .getElementById("refreshPayments")
  .addEventListener("click", loadPaymentStatistics);

// SIGN OUT
document.getElementById("logoutButton").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Unable to sign out. Please try again.");
    return;
  }

  window.location.replace("index.html");
});

// FOOTER YEAR
document.getElementById("dashboardYear").textContent = new Date().getFullYear();

// START DASHBOARD
initializeDashboard();
