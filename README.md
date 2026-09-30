# Andromeda Atlas

An interactive 3D atlas of a fictional Andromeda Galaxy, built with Vite, React, and Three.js.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # type-check + production build into dist/
npm run preview    # serve the built dist/ on port 3000
```

Requires Node 20.19+ (22 recommended; pinned in `.node-version`).

## Deploying on Render

The app is fully client-side, so it deploys as a **Static Site** (free, served from Render's CDN, no cold starts).

### Option A: Blueprint (uses `render.yaml`)

1. In the Render dashboard: **New → Blueprint**.
2. Connect the GitHub repo `starcadges/galactic-map`, branch `main`.
3. Render reads `render.yaml` and creates the `galactic-map` static site. Click **Apply**.

### Option B: Manual Static Site

**New → Static Site**, connect `starcadges/galactic-map`, then set:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | *(leave blank)* |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

A static site has **no start command**. Render serves the files in `dist/` directly.

Optional: under **Redirects/Rewrites**, add a rewrite from `/*` to `/index.html`, so any deep link loads the app. The Blueprint adds this for you.

### Option C: Web Service (only if you need a Node process)

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npx vite preview` |
| Environment variable | `NODE_VERSION` = `22` |

`npx vite preview` binds to `0.0.0.0` on Render's `$PORT` (see `vite.config.ts`). Don't use `npm run preview` here: that script pins port 3000, which Render won't route to. Free web services sleep when idle, so Option A or B is the better fit.

Every push to `main` triggers an automatic redeploy.
