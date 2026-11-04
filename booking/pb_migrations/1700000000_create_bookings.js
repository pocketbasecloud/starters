/// <reference path="../pb_data/types.d.ts" />

const SERVICES = [
  { name: "Intro call", minutes: 30, price: 0, sort: 1, description: "A short call to get to know each other and see if we're a fit." },
  { name: "Consultation", minutes: 60, price: 9000, sort: 2, description: "A focused session on one question, with written notes afterwards." },
  { name: "Deep-dive session", minutes: 90, price: 15000, sort: 3, description: "Time to work through a larger problem together, step by step." },
];

const STAFF = '@request.auth.collectionName = "users"';
const FORM_LIMITS = [{ label: "POST /book", maxRequests: 5, duration: 60, audience: "" }];

function setFormLimits(app, enabled, keep) {
  const settings = app.settings();
  const limits = JSON.parse(JSON.stringify(settings.rateLimits));
  const kept = (limits.rules || []).filter((rule) => !FORM_LIMITS.some((form) => form.label === rule.label));
  unmarshal({ rateLimits: { enabled: enabled ?? limits.enabled, rules: keep ? [...kept, ...FORM_LIMITS] : kept } }, settings);
  app.save(settings);
}

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = null;
  app.save(users);

  const services = new Collection({
    type: "base",
    name: "services",
    listRule: "active = true",
    viewRule: "active = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 80 },
      { type: "number", name: "minutes", required: true, onlyInt: true, min: 5, max: 480 },
      { type: "number", name: "price", onlyInt: true, min: 0, help: "In cents: 9000 is 90.00. Leave 0 for free." },
      { type: "text", name: "description", max: 300 },
      { type: "number", name: "sort", onlyInt: true },
      { type: "bool", name: "active" },
    ],
  });
  app.save(services);

  const bookings = new Collection({
    type: "base",
    name: "bookings",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "service", required: true, collectionId: services.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "name", required: true, max: 100 },
      { type: "email", name: "email", required: true },
      { type: "text", name: "notes", max: 1000 },
      { type: "date", name: "starts", required: true },
      { type: "date", name: "ends", required: true },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["confirmed", "cancelled"] },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_bookings_starts ON bookings (starts)"],
  });
  app.save(bookings);

  for (const sample of SERVICES) {
    const service = new Record(services);
    service.load({ ...sample, active: true });
    app.save(service);
  }

  setFormLimits(app, true, true);
}, (app) => {
  setFormLimits(app, null, false);
  for (const name of ["bookings", "services"]) app.delete(app.findCollectionByNameOrId(name));
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
});
