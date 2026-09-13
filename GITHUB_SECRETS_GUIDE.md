# GitHub Repository Secrets & Variables Guide

To securely deploy this full-stack application (or upload it to a hosting provider via GitHub Actions), you need to configure **Environment Secrets** and **Environment Variables** in your GitHub repository.

## 1. How to add them in GitHub
1. Go to your repository on GitHub.
2. Click on **Settings** > **Secrets and variables** > **Actions**.
3. Use **New repository secret** for sensitive data (API keys, passwords).
4. Use **New repository variable** for non-sensitive data (URLs, public configs).

---

## 2. Secrets to Add (New repository secret)

You must add the following secrets for the backend to function correctly:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini AI API key for chatbot features. | `AIzaSy...` |
| `JWT_SECRET` | A long, random string used to secure user sessions. | `my-super-secret-key-12345` |
| `ADMIN_PASSKEY` | The secret password used to access the Admin console. | `admin_secret_99` |

*(If you are deploying to a service like Render, Heroku, or Google Cloud Run, these secrets will be passed to your production server.)*

---

## 3. Variables to Add (New repository variable)

These are public configuration values used by your build environment:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | The environment the app is running in. | `production` |
| `APP_URL` | The public URL where your app is hosted. | `https://my-college-app.onrender.com` |

---

## Important Note about GitHub Pages
You previously had a `jekyll-gh-pages.yml` workflow. Because this is a **Full-Stack Application** with a Node.js/Express backend (`server.ts`), **GitHub Pages cannot host the backend.** GitHub Pages only hosts static files (HTML/CSS/JS). 

To host the entire app (both the React frontend and the Express backend with Gemini/Firebase integrations), you should deploy it to a full-stack hosting provider like **Render, Railway, or Google Cloud Run** instead of GitHub Pages.
