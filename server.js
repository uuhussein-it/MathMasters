/**
 * Minimal Express server for Render "Web Service" deployments.
 * The app itself is fully static (see /public), so this only serves files,
 * adds sensible caching, and exposes a health check for Render.
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');

// Health check endpoint (set as the Health Check Path in Render).
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// Static assets: images cache for a week; HTML/JS/CSS/JSON revalidate so updates show up immediately.
app.use(express.static(PUBLIC_DIR, {
  setHeaders(res, filePath) {
    if (/\.(jpg|png|svg|webp)$/i.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=604800');
    else res.setHeader('Cache-Control', 'no-cache');
  },
}));

// The app uses hash routing, so any other path just gets the app shell.
app.use((_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(PORT, () => console.log(`QuestLearn running at http://localhost:${PORT}`));
