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

  const result = await callApi({
    action: "signup",
    name,
    email,
    password,
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

  const result = await callApi({
    action: "login",
    email,
    password,
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
    return await callApiJsonp(payload);
  } catch (error) {
    return { ok: false, message: error.message || "Network error" };
  }
}

function callApiJsonp(payload) {
  return new Promise((resolve) => {
    const callbackName = `cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const params = new URLSearchParams({ ...payload, callback: callbackName });
    const url = `${SCRIPT_URL}?${params.toString()}`;
    const script = document.createElement("script");

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ ok: false, message: "Request timed out" });
    }, 10000);

    window[callbackName] = (data) => {
      clearTimeout(timeout);
      cleanup();
      resolve(data || { ok: false, message: "Empty response" });
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({ ok: false, message: "Failed to fetch from Apps Script" });
    };

    script.src = url;
    document.body.appendChild(script);
  });
}

