const SHEET_NAME = "Users";

function doGet(e) {
  try {
    const action = (e.parameter.action || "").trim();
    let result;

    if (!action) {
      result = { ok: false, message: "Missing action" };
      return response_(result, e.parameter.callback);
    }

    if (action === "signup") {
      result = signup_(e.parameter);
      return response_(result, e.parameter.callback);
    }

    if (action === "login") {
      result = login_(e.parameter);
      return response_(result, e.parameter.callback);
    }

    result = { ok: false, message: "Unknown action" };
    return response_(result, e.parameter.callback);
  } catch (err) {
    return response_({ ok: false, message: err.message || "Server error" }, e.parameter.callback);
  }
}

function signup_(data) {
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const passwordHash = String(data.passwordHash || "").trim();

  if (!name || !email || !passwordHash) {
    return { ok: false, message: "Missing fields" };
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase() === email) {
      return { ok: false, message: "Email already exists" };
    }
  }

  sheet.appendRow([new Date(), email, name, passwordHash]);
  return { ok: true, message: "Account created" };
}

function login_(data) {
  const email = String(data.email || "").trim().toLowerCase();
  const passwordHash = String(data.passwordHash || "").trim();

  if (!email || !passwordHash) {
    return { ok: false, message: "Missing fields" };
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const rowEmail = String(values[i][1]).toLowerCase();
    const rowName = String(values[i][2] || "");
    const rowHash = String(values[i][3] || "");

    if (rowEmail === email && rowHash === passwordHash) {
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
    sheet.appendRow(["createdAt", "email", "name", "passwordHash"]);
  }

  return sheet;
}

function response_(obj, callback) {
  const cb = String(callback || "").trim();

  if (cb && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cb)) {
    const body = cb + "(" + JSON.stringify(obj) + ");";
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
