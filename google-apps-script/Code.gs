const SHEET_NAME = "Users";

function doGet(e) {
  return handleRequest_(e.parameter);
}

function doPost(e) {
  return handleRequest_(e.parameter);
}

function handleRequest_(data) {
  try {
    const action = (data.action || "").trim();
    const origin = String(data.origin || "").trim();
    let result;

    if (!action) {
      result = { ok: false, message: "Missing action" };
      return response_(result, data.callback, origin);
    }

    if (action === "signup") {
      result = signup_(data);
      return response_(result, data.callback, origin);
    }

    if (action === "login") {
      result = login_(data);
      return response_(result, data.callback, origin);
    }

    result = { ok: false, message: "Unknown action" };
    return response_(result, data.callback, origin);
  } catch (err) {
    return response_({ ok: false, message: err.message || "Server error" }, data.callback, String(data.origin || "").trim());
  }
}

function signup_(data) {
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "").trim();

  if (!name || !email || !password) {
    return { ok: false, message: "Missing fields" };
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase() === email) {
      return { ok: false, message: "Email already exists" };
    }
  }

  sheet.appendRow([new Date(), email, name, password]);
  return { ok: true, message: "Account created" };
}

function login_(data) {
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "").trim();

  if (!email || !password) {
    return { ok: false, message: "Missing fields" };
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const rowEmail = String(values[i][1]).toLowerCase();
    const rowName = String(values[i][2] || "");
    const rowPassword = String(values[i][3] || "");

    if (rowEmail === email && rowPassword === password) {
      return { ok: true, name: rowName, message: "Login successful" };
    }
  }

  return { ok: false, message: "Invalid email or password" };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["createdAt", "email", "name", "password"]);
  } else {
    const header = String(sheet.getRange(1, 4).getValue() || "").trim();

    if (header === "passwordHash") {
      sheet.getRange(1, 4).setValue("password");
    }
  }

  return sheet;
}

function response_(obj, callback, origin) {
  const targetOrigin = String(origin || "").trim();

  if (targetOrigin) {
    return HtmlService.createHtmlOutput(bridgeHtml_(obj, targetOrigin));
  }

  const cb = String(callback || "").trim();

  if (cb && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cb)) {
    const body = cb + "(" + JSON.stringify(obj) + ");";
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function bridgeHtml_(obj, origin) {
  const payload = JSON.stringify(obj).replace(/</g, "\\u003c");
  const safeOrigin = JSON.stringify(origin);

  return "<!doctype html><html><head><meta charset=\"utf-8\"><title>Result</title></head><body><script>" +
    "(function(){" +
    "var result = " + payload + ";" +
    "var origin = " + safeOrigin + ";" +
    "if (window.opener) { window.opener.postMessage({type:'apps-script-auth-result', payload: result}, origin); }" +
    "setTimeout(function(){ window.close(); }, 250);" +
    "})();" +
    "</script></body></html>";
}
