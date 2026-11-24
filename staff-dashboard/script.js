import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// SUPABASE CONNECTION
const SUPABASE_URL = "https://dbacmnqminkbrnequplq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_TzcYMh4sGPahOXQDh561bA_J-sjl2qT";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// FOOTER YEAR
document.getElementById("year").textContent = new Date().getFullYear();

// STAFF LOGIN
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  loginMessage.textContent = "";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    loginMessage.textContent =
      "Sign-in successful. Staff access verification is the next step.";

    loginMessage.style.color = "#0c827b";

    console.log("Authenticated user:", data.user.id);
    window.location.href = "dashboard.html";
  } catch (error) {
    loginMessage.textContent =
      error.message || "Unable to sign in. Please try again.";

    loginMessage.style.color = "#dc2626";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});
