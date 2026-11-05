const TOLERANCE_SECONDS = 300;

function secretKey() {
  return $os.getenv("STRIPE_SECRET_KEY");
}

function apiUrl() {
  return ($os.getenv("STRIPE_API_URL") || "https://api.stripe.com").replace(/\/$/, "");
}

function configured() {
  return secretKey() !== "";
}

function encode(value, prefix, pairs) {
  if (value === null || value === undefined) return pairs;
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) encode(child, prefix ? `${prefix}[${key}]` : key, pairs);
    return pairs;
  }
  pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  return pairs;
}

function createCheckoutSession(params) {
  const response = $http.send({
    url: `${apiUrl()}/v1/checkout/sessions`,
    method: "POST",
    body: encode(params, "", []).join("&"),
    headers: {
      "Authorization": `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 20,
  });
  if (response.statusCode >= 400 || !response.json || !response.json.url) {
    const message = response.json && response.json.error ? response.json.error.message : `status ${response.statusCode}`;
    throw new Error(`Stripe refused the checkout: ${message}`);
  }
  return response.json;
}

function verifiedEvent(raw, header, secret) {
  if (!secret || !header) return null;
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = Number((parts.find(([key]) => key === "t") || [])[1]);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value || "");
  if (!timestamp || signatures.length === 0) return null;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return null;
  const expected = $security.hs256(`${timestamp}.${raw}`, secret);
  if (!signatures.some((signature) => $security.equal(signature, expected))) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { configured, createCheckoutSession, verifiedEvent };
