// Extends app.json. EXPO_BASE_URL lets the web export be served from a
// subpath -- GitHub Pages hosts it at /safe-bites (see SETUP.md). Local dev
// leaves it unset, so the dev server stays at the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
