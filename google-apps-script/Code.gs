const SHEET_NAME = "Users";

function doGet(e) {
  try {
    const action = (e.parameter.action || "").trim();

    if (!action) {
      return json({ ok: false, message: "Missing action" });
    }

    if (action === "signup") {
      return signup_(e.parameter);
    }

    if (action === "login") {
      return login_(e.parameter);
    }

    return json({ ok: false, message: "Unknown action" });
  } catch (err) {
    return json({ ok: false, message: err.message || "Server error" });
  }
}

function signup_(data) {
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const passwordHash = String(data.passwordHash || "").trim();

  if (!name || !email || !passwordHash) {
    return json({ ok: false, message: "Missing fields" });
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]).toLowerCase() === email) {
      return json({ ok: false, message: "Email already exists" });
    }
  }

  sheet.appendRow([new Date(), email, name, passwordHash]);
  return json({ ok: true, message: "Account created" });
}

function login_(data) {
  const email = String(data.email || "").trim().toLowerCase();
  const passwordHash = String(data.passwordHash || "").trim();

  if (!email || !passwordHash) {
    return json({ ok: false, message: "Missing fields" });
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const rowEmail = String(values[i][1]).toLowerCase();
    const rowName = String(values[i][2] || "");
    const rowHash = String(values[i][3] || "");

    if (rowEmail === email && rowHash === passwordHash) {
      return json({ ok: true, name: rowName, message: "Login successful" });
    }
  }

  return json({ ok: false, message: "Invalid email or password" });
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

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
