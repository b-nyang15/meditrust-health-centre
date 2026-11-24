/* =========================================
   MEDITRUST HEALTH CENTRE
   Website Interactions
========================================= */

// EMAILJS CONFIGURATION

const EMAILJS_PUBLIC_KEY = "Gr1X-fSCie41pbTTk";
const EMAILJS_SERVICE_ID = "service_eooit3h";
const EMAILJS_TEMPLATE_ID = "template_cscx4m7";
const PAYMENT_TEMPLATE_ID = "template_w97k27x";

// =========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = "https://dbacmnqminkbrnequplq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiYWNtbnFtaW5rYnJuZXF1cGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NDQ5OTAsImV4cCI6MjExMTAyMDk5MH0.EiUWCrMvA3Llrc4QLEmkX3Ml42Z0W_FfnZtDxWy2QWU";

let supabaseClient = null;

async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { createClient } =
    await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  return supabaseClient;
}

// =========================================
// LOAD ACTIVE PAYMENT CATEGORIES
// =========================================

async function loadPaymentCategories() {
  const categorySelects = [
    document.getElementById("paymentCategory"),
    document.getElementById("transactionCategory"),
  ].filter(Boolean);

  if (categorySelects.length === 0) return;

  categorySelects.forEach((select) => {
    select.innerHTML = '<option value="">Loading categories...</option>';
    select.disabled = true;
  });

  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("payment_categories")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("No active payment categories found.");
    }

    categorySelects.forEach((select) => {
      select.innerHTML = '<option value="">Select a payment category</option>';

      data.forEach(({ name }) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });

      select.disabled = false;
    });
  } catch (error) {
    console.error("Could not load payment categories:", error);

    categorySelects.forEach((select) => {
      select.innerHTML =
        '<option value="">Payment categories unavailable</option>';
      select.disabled = true;
    });
  }
}

loadPaymentCategories();

// INITIALIZE EMAILJS

if (typeof emailjs !== "undefined") {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY,
  });
}

// =========================================
// LIGHT & DARK THEME
// =========================================

const themeButtons = document.querySelectorAll(".theme-toggle");
const savedTheme = (() => {
  try {
    return localStorage.getItem("meditrust-theme");
  } catch (error) {
    return null;
  }
})();

const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;

const initialTheme =
  savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : systemPrefersDark
      ? "dark"
      : "light";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  themeButtons.forEach((button) => {
    const isDark = theme === "dark";

    button.textContent = isDark ? "☀️" : "🌙";
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
    button.setAttribute(
      "title",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
    button.setAttribute("aria-pressed", String(isDark));
  });
}

// Apply the selected theme when the page loads.

applyTheme(initialTheme);

// Theme toggle interaction.

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    const newTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(newTheme);

    try {
      localStorage.setItem("meditrust-theme", newTheme);
    } catch (error) {
      console.warn("Theme preference could not be saved.");
    }
  });
});

// =========================================
// MOBILE NAVIGATION
// =========================================

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );

    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      menuToggle.textContent = "☰";
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      menuToggle.textContent = "☰";
    }
  });
}

// =========================================
// AUTOMATIC COPYRIGHT YEAR
// =========================================

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// =========================================
// ACTIVE NAVIGATION LINK
// =========================================

const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".main-nav a").forEach((link) => {
  const linkPage = link.getAttribute("href");

  if (linkPage === currentPage) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  } else {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  }
});

// =========================================
// EMAIL ENQUIRY FORM
// =========================================

const contactForm = document.getElementById("contactForm");
const formNotice = document.getElementById("formNotice");

if (contactForm && formNotice) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (typeof emailjs === "undefined") {
      formNotice.textContent =
        "The email service could not load. Please try again later.";
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Sending enquiry...";

    formNotice.textContent = "Please wait while your enquiry is being sent.";

    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        contactForm,
      );

      formNotice.textContent =
        "Thank you! Your enquiry has been sent successfully.";

      contactForm.reset();
    } catch (error) {
      console.error("EmailJS error:", error);

      formNotice.textContent =
        "Sorry, your enquiry could not be sent. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send Enquiry →";
    }
  });
}

// =========================================
// PAYMENT INSTRUCTIONS
// =========================================

const paymentForm = document.getElementById("paymentForm");

if (paymentForm) {
  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const paymentMethod = document.getElementById("paymentMethod");

    if (!paymentMethod) return;

    const selectedMethod = (
      paymentMethod.value +
      " " +
      paymentMethod.options[paymentMethod.selectedIndex].text
    ).toLowerCase();

    let heading = "";
    let instructions = "";

    if (selectedMethod.includes("mpesa") || selectedMethod.includes("m-pesa")) {
      heading = "M-Pesa Payment Instructions";

      instructions = `
        <p><strong>Payment method:</strong> M-Pesa</p>
        <p><strong>Phone number:</strong> 0707623164</p>
        <p><strong>Recipient:</strong> Confirm the name displayed by M-Pesa before sending.</p>
        <p>Open M-Pesa on your phone, choose Send Money, enter the number above, confirm the recipient and amount, then complete the payment using your M-Pesa PIN.</p>
      `;
    } else if (
      selectedMethod.includes("paybill") ||
      selectedMethod.includes("equity pay")
    ) {
      heading = "Equity PayBill Instructions";

      instructions = `
        <p><strong>Business number:</strong> 247247</p>
        <p><strong>Account number:</strong> 1650183866480</p>
        <p>Open M-Pesa, select Lipa na M-Pesa, choose PayBill, enter the business number and account number, then confirm the details before completing payment.</p>
      `;
    } else if (
      selectedMethod.includes("bank") ||
      selectedMethod.includes("transfer")
    ) {
      heading = "Equity Bank Transfer Instructions";

      instructions = `
        <p><strong>Bank:</strong> Equity Bank</p>
        <p><strong>Account number:</strong> 1650183866480</p>
        <p><strong>Account holder:</strong> Nyang Both Manyal</p>
        <p>Use your Equity banking channel to make the transfer. Confirm the account details before sending.</p>
      `;
    } else {
      heading = "Payment Method Not Recognised";
      instructions =
        "<p>Please select one of the available payment methods.</p>";
    }

    let instructionsPanel = document.getElementById("paymentInstructions");

    if (!instructionsPanel) {
      instructionsPanel = document.createElement("section");
      instructionsPanel.id = "paymentInstructions";
      instructionsPanel.className = "payment-instructions";
      instructionsPanel.setAttribute("role", "status");
      paymentForm.insertAdjacentElement("afterend", instructionsPanel);
    }

    instructionsPanel.innerHTML = `
      <h3>${heading}</h3>
      ${instructions}
      <p><strong>Important:</strong> Keep your M-Pesa or bank transaction confirmation. Your payment is not verified automatically by this website.</p>
    `;

    instructionsPanel.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
}

// =========================================
// PAYMENT REFERENCE SUBMISSION TO SUPABASE
// =========================================

const transactionForm = document.getElementById("transactionForm");

if (transactionForm) {
  transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const notice = transactionForm.querySelector(".form-notice");
    const submitButton = transactionForm.querySelector('button[type="submit"]');

    const paymentMethod = document.getElementById("transactionMethod");

    const templateParams = {
      transactionName: document.getElementById("transactionName").value.trim(),
      transactionPhone: document
        .getElementById("transactionPhone")
        .value.trim(),
      transactionCategory: document.getElementById("transactionCategory").value,
      transactionCode: document.getElementById("transactionCode").value.trim(),
      transactionAmount: document.getElementById("transactionAmount").value,
      transactionMethod:
        paymentMethod.options[paymentMethod.selectedIndex].text,
    };

    const paymentPayload = {
      payer_name: templateParams.transactionName,
      payer_phone: templateParams.transactionPhone,
      transaction_code: templateParams.transactionCode,
      amount: Number(templateParams.transactionAmount),
      payment_method: paymentMethod.value,
      payment_category: templateParams.transactionCategory,
    };

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    if (notice) {
      notice.textContent =
        "Please wait while your payment reference is being submitted.";
    }

    try {
      const supabase = await getSupabaseClient();

      // Save payment reference in Supabase.
      const { data, error } = await supabase.functions.invoke(
        "submit-payment",
        {
          body: paymentPayload,
        },
      );

      if (error) {
        throw error;
      }

      if (!data || !data.payment) {
        throw new Error(
          data?.error || "Payment submission could not be confirmed.",
        );
      }

      // Send an email notification after successful database insertion.
      let emailSent = false;

      if (typeof emailjs !== "undefined") {
        try {
          await emailjs.send(
            EMAILJS_SERVICE_ID,
            PAYMENT_TEMPLATE_ID,
            templateParams,
          );

          emailSent = true;
        } catch (emailError) {
          console.error("Payment notification email failed:", emailError);
        }
      }

      if (notice) {
        notice.textContent = emailSent
          ? "Your payment reference has been submitted successfully. Your payment is pending verification by MediTrust."
          : "Your payment reference was saved successfully. Email notification could not be sent, but your submission is pending verification.";
      }

      transactionForm.reset();
    } catch (error) {
      console.error("Payment submission error:", error);

      if (notice) {
        notice.textContent =
          error.message ||
          "Your payment reference could not be submitted. Please try again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit for Verification";
    }
  });
}
