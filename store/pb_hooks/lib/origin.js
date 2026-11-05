const DEFAULT_APP_URL = "http://localhost:8090";

function siteOrigin(e) {
  const configured = ($app.settings().meta.appURL || "").replace(/\/$/, "");
  if (configured && configured !== DEFAULT_APP_URL) return configured;
  const proto = e.request.header.get("X-Forwarded-Proto") || (e.request.tls ? "https" : "http");
  return `${proto}://${e.request.host}`;
}

module.exports = { siteOrigin };
