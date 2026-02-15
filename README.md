<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CJ Travel

A travel planning application built with Angular and Vite.

## Run Locally

**Prerequisites:**  Node.js 18 or higher

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## GitHub Pages Deployment

This repository is configured to automatically deploy to GitHub Pages on every push to the `main` branch.

### Prerequisites

1. In your GitHub repository, go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**

### How it works

- The workflow is defined in `.github/workflows/pages.yml`
- On every push to `main`, the app is built with Vite using the base path `/cjtravel/`
- The build output is deployed to GitHub Pages
- The site is available at: `https://erdneebatulzii23-stack.github.io/cjtravel/`

### Manual deployment

You can also trigger a deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy CJ Travel to GitHub Pages** workflow
3. Click **Run workflow**

### Technical details

- The app uses Vite's `base` configuration to handle the project path (`/cjtravel/`)
- A custom Vite plugin automatically updates the `<base href>` in `index.html` during build
- A `404.html` file is generated for SPA routing support on GitHub Pages
