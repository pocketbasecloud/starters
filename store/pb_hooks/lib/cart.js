const COOKIE = "cart";
const MAX_LINES = 30;
const MAX_QUANTITY = 20;
const LINE = /^([a-z0-9]{15})_(\d{1,2})$/;

function secure(e) {
  const appUrl = $app.settings().meta.appURL || "";
  return appUrl.startsWith("https://") || e.request.header.get("X-Forwarded-Proto") === "https";
}

function read(e) {
  let value = "";
  try {
    value = e.request.cookie(COOKIE).value;
  } catch {
    return [];
  }
  const lines = [];
  for (const part of value.split(".").slice(0, MAX_LINES)) {
    const match = LINE.exec(part);
    if (!match) continue;
    const quantity = Math.min(MAX_QUANTITY, Number(match[2]));
    if (quantity > 0 && !lines.some((line) => line.product === match[1])) lines.push({ product: match[1], quantity });
  }
  return lines;
}

function write(e, lines) {
  const value = lines.slice(0, MAX_LINES).map((line) => `${line.product}_${line.quantity}`).join(".");
  e.setCookie({ name: COOKIE, value, path: "/", httpOnly: true, secure: secure(e), sameSite: 2, maxAge: value ? 60 * 60 * 24 * 30 : -1 });
}

function setQuantity(e, productId, quantity) {
  const lines = read(e).filter((line) => line.product !== productId);
  const wanted = Math.max(0, Math.min(MAX_QUANTITY, Math.floor(Number(quantity) || 0)));
  if (wanted > 0) lines.push({ product: productId, quantity: wanted });
  write(e, lines);
  return lines;
}

function add(e, productId) {
  const existing = read(e).find((line) => line.product === productId);
  return setQuantity(e, productId, (existing ? existing.quantity : 0) + 1);
}

function resolve(lines) {
  const resolved = [];
  for (const line of lines) {
    let product;
    try {
      product = $app.findRecordById("products", line.product);
    } catch {
      continue;
    }
    if (!product.getBool("active")) continue;
    resolved.push({ product, quantity: line.quantity, price: product.getInt("price") });
  }
  return resolved;
}

function count(e) {
  return read(e).reduce((sum, line) => sum + line.quantity, 0);
}

module.exports = { MAX_QUANTITY, read, write, add, setQuantity, resolve, count, clear: (e) => write(e, []) };
