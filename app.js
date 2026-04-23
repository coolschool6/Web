const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylcKiS4ObMc8NDWqLYvScYh-thNv5ACWG8er8GKuLZik8yS73Iint06ytzsPXv5hg_cA/exec";

const tabs = document.querySelectorAll(".tab");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const statusEl = document.getElementById("status");

for (const tab of tabs) {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
}

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || password.length < 6) {
    showStatus("Please fill all fields correctly.", false);
    return;
  }

  if (!isConfigured()) return;

  showStatus("Creating account...", true);
  const passwordHash = await sha256(password);

  const result = await callApi({
    action: "signup",
    name,
    email,
    passwordHash,
  });

  if (result.ok) {
    showStatus("Sign up successful. You can log in now.", true);
    signupForm.reset();
    setTab("login");
  } else {
    showStatus(result.message || "Sign up failed.", false);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 6) {
    showStatus("Enter a valid email and password.", false);
    return;
  }

  if (!isConfigured()) return;

  showStatus("Checking credentials...", true);
  const passwordHash = await sha256(password);

  const result = await callApi({
    action: "login",
    email,
    passwordHash,
  });

  if (result.ok) {
    showStatus(`Welcome back, ${result.name || "user"}!`, true);
    loginForm.reset();
  } else {
    showStatus(result.message || "Login failed.", false);
  }
});

function setTab(which) {
  for (const tab of tabs) {
    const active = tab.dataset.tab === which;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  }

  signupForm.classList.toggle("active", which === "signup");
  loginForm.classList.toggle("active", which === "login");
  statusEl.textContent = "";
  statusEl.className = "status";
}

function showStatus(message, success) {
  statusEl.textContent = message;
  statusEl.className = `status ${success ? "ok" : "err"}`;
}

function isConfigured() {
  if (SCRIPT_URL.includes("PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE")) {
    showStatus("Set SCRIPT_URL in app.js first.", false);
    return false;
  }
  return true;
}

async function callApi(payload) {
  try {
    const params = new URLSearchParams(payload);
    const url = `${SCRIPT_URL}?${params.toString()}`;
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      return { ok: false, message: `HTTP error ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    return { ok: false, message: error.message || "Network error" };
  }
}

async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
