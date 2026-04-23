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
    return await callApiBridge(payload);
  } catch (error) {
    return { ok: false, message: error.message || "Network error" };
  }
}

function callApiBridge(payload) {
  return new Promise((resolve) => {
    const bridgeName = "appsScriptBridge";
    const bridgeWindow = window.open("", bridgeName, "width=520,height=640");

    if (!bridgeWindow) {
      resolve({ ok: false, message: "Popup blocked. Allow popups and try again." });
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = SCRIPT_URL;
    form.target = bridgeName;
    form.style.display = "none";

    const fields = {
      ...payload,
      origin: window.location.origin,
      responseMode: "bridge",
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }

    document.body.appendChild(form);

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
      form.remove();
    };

    const onMessage = (event) => {
      const allowedOrigins = new Set(["https://script.google.com", "https://script.googleusercontent.com"]);

      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      const data = event.data;

      if (!data || data.type !== "apps-script-auth-result") {
        return;
      }

      cleanup();
      resolve(data.payload || { ok: false, message: "Empty response" });

      try {
        bridgeWindow.close();
      } catch {
        // ignore
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ ok: false, message: "Request timed out" });

      try {
        bridgeWindow.close();
      } catch {
        // ignore
      }
    }, 15000);

    window.addEventListener("message", onMessage);
    form.submit();
  });
}

