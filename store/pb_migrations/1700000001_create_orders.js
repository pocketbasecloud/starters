/// <reference path="../pb_data/types.d.ts" />

const STAFF = '@request.auth.collectionName = "staff"';
const VISITOR_IP_HEADERS = ["CF-Connecting-IP", "X-Forwarded-For"];
const FORM_LIMITS = [
  { label: "POST /checkout", maxRequests: 10, duration: 60, audience: "" },
  { label: "POST /cart/", maxRequests: 60, duration: 60, audience: "" },
];

function perVisitorProxy(settings) {
  const proxy = JSON.parse(JSON.stringify(settings.trustedProxy));
  return (proxy.headers || []).length > 0 ? proxy : { headers: VISITOR_IP_HEADERS, useLeftmostIP: false };
}

function setFormLimits(app, keep) {
  const settings = app.settings();
  const limits = JSON.parse(JSON.stringify(settings.rateLimits));
  const kept = (limits.rules || []).filter((rule) => !FORM_LIMITS.some((form) => form.label === rule.label));
  const patch = { rateLimits: { enabled: keep ? true : limits.enabled, rules: keep ? [...kept, ...FORM_LIMITS] : kept } };
  if (keep) patch.trustedProxy = perVisitorProxy(settings);
  unmarshal(patch, settings);
  app.save(settings);
}

migrate((app) => {
  const staff = new Collection({
    type: "auth",
    name: "staff",
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: null,
    updateRule: "id = @request.auth.id",
    deleteRule: null,
    fields: [{ type: "text", name: "name", max: 100 }],
  });
  app.save(staff);

  const customers = new Collection({
    type: "base",
    name: "customers",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "email", name: "email", required: true },
      { type: "text", name: "name", max: 200 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_customers_email ON customers (email)"],
  });
  app.save(customers);

  const orders = new Collection({
    type: "base",
    name: "orders",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "customer", collectionId: customers.id, maxSelect: 1, cascadeDelete: false },
      { type: "email", name: "email" },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["pending", "paid", "fulfilled", "cancelled"] },
      { type: "number", name: "total", onlyInt: true, min: 0 },
      { type: "text", name: "currency", max: 3 },
      { type: "text", name: "stripe_session", max: 255 },
      { type: "text", name: "payment_intent", max: 255 },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_orders_status ON orders (status, created)"],
  });
  app.save(orders);

  const products = app.findCollectionByNameOrId("products");
  const items = new Collection({
    type: "base",
    name: "order_items",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "order", required: true, collectionId: orders.id, maxSelect: 1, cascadeDelete: true },
      { type: "relation", name: "product", collectionId: products.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "name", required: true, max: 120 },
      { type: "number", name: "price", onlyInt: true, min: 0 },
      { type: "number", name: "quantity", required: true, onlyInt: true, min: 1, max: 99 },
    ],
    indexes: ["CREATE INDEX idx_order_items_order ON order_items (`order`)"],
  });
  app.save(items);

  const settings = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "currency", required: true, pattern: "^[a-z]{3}$", help: "Three-letter code Stripe uses, such as usd, eur or gbp" },
      { type: "text", name: "tagline", max: 200 },
      { type: "text", name: "shipping_note", max: 200 },
    ],
  });
  app.save(settings);
  const defaults = new Record(settings);
  defaults.load({ currency: "usd", tagline: "Small-batch goods, made to last.", shipping_note: "Free returns for 30 days" });
  app.save(defaults);

  const audit = new Collection({
    type: "base",
    name: "audit_log",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "actor", max: 200 },
      { type: "text", name: "action", required: true, max: 60 },
      { type: "text", name: "target", max: 100 },
      { type: "text", name: "detail", max: 1000 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE INDEX idx_audit_log_created ON audit_log (created)"],
  });
  app.save(audit);

  setFormLimits(app, true);
}, (app) => {
  setFormLimits(app, false);
  for (const name of ["audit_log", "settings", "order_items", "orders", "customers", "staff"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
