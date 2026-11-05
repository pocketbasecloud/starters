const SYMBOLS = { usd: "$", eur: "€", gbp: "£", aud: "A$", cad: "C$", jpy: "¥" };
const ZERO_DECIMAL = ["jpy", "krw", "vnd"];
const DEFAULTS = { currency: "usd", tagline: "", shipping_note: "" };

function current() {
  try {
    const record = $app.findFirstRecordByFilter("settings", "id != ''");
    return {
      currency: record.getString("currency") || DEFAULTS.currency,
      tagline: record.getString("tagline"),
      shipping_note: record.getString("shipping_note"),
    };
  } catch {
    return DEFAULTS;
  }
}

function money(amount, currency) {
  const code = (currency || DEFAULTS.currency).toLowerCase();
  const symbol = SYMBOLS[code] ?? `${code.toUpperCase()} `;
  const thousands = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (ZERO_DECIMAL.includes(code)) return `${symbol}${thousands(amount)}`;
  return `${symbol}${thousands(Math.floor(amount / 100))}.${String(amount % 100).padStart(2, "0")}`;
}

module.exports = { current, money };
