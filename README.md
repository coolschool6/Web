# Web

Website

## Login/Sign Up with Google Sheets (via GitHub)

This project gives you:
- A simple sign up / log in page using HTML, CSS, JavaScript
- User info stored in Google Sheets through Google Apps Script
- A flow you can host on GitHub Pages

## Project structure

- index.html
- style.css
- app.js
- google-apps-script/Code.gs

## 1) Create the Google Sheet and Apps Script backend

1. Create a new Google Sheet and name it, for example: `AuthDemo`.
2. In that sheet, go to **Extensions > Apps Script**.
3. Delete default code and paste contents of `google-apps-script/Code.gs`.
4. Save the project.
5. Click **Deploy > New deployment**.
6. Choose type **Web app**.
7. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** and authorize.
9. Copy the **Web app URL**.

## 2) Connect frontend to Apps Script

1. Open `app.js`.
2. Replace:
   - `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   with your deployed Web app URL.

## 3) Push to GitHub

Run in terminal from this folder:

```bash
git init
git add .
git commit -m "Initial auth page with Google Sheets backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 4) Publish on GitHub Pages

1. Go to your GitHub repo.
2. Open **Settings > Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` and folder `/ (root)`
4. Save.
5. Wait 1-2 minutes; GitHub gives a live URL.

## 5) Test the flow

1. Open your GitHub Pages URL.
2. Sign up with name, email, password.
3. Open Google Sheet and confirm a new row appears.
4. Try login with same email/password.

## Important security note

This is a beginner demo. For production:
- Do not do authentication only in frontend JS.
- Use a real backend and secure auth (JWT/session + strong password hashing with salt server-side).
- Protect endpoints with proper access controls.
