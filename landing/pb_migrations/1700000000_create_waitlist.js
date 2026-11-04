/// <reference path="../pb_data/types.d.ts" />

const FORM_LIMITS = [
  { label: "POST /waitlist", maxRequests: 5, duration: 60, audience: "" },
  { label: "POST /contact", maxRequests: 3, duration: 60, audience: "" },
];

migrate((app) => {
  const waitlist = new Collection({
    type: "base",
    name: "waitlist",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "email", name: "email", required: true },
      { type: "text", name: "source", max: 100 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_waitlist_email ON waitlist (email)"],
  });
  app.save(waitlist);

  const messages = new Collection({
    type: "base",
    name: "messages",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 100 },
      { type: "email", name: "email", required: true },
      { type: "text", name: "message", required: true, max: 5000 },
      { type: "bool", name: "handled" },
      { type: "autodate", name: "created", onCreate: true },
    ],
  });
  app.save(messages);

  const settings = app.settings();
  const limits = JSON.parse(JSON.stringify(settings.rateLimits));
  const kept = (limits.rules || []).filter((rule) => !FORM_LIMITS.some((form) => form.label === rule.label));
  unmarshal({ rateLimits: { enabled: true, rules: [...kept, ...FORM_LIMITS] } }, settings);
  app.save(settings);
}, (app) => {
  for (const name of ["messages", "waitlist"]) app.delete(app.findCollectionByNameOrId(name));
  const settings = app.settings();
  const limits = JSON.parse(JSON.stringify(settings.rateLimits));
  const kept = (limits.rules || []).filter((rule) => !FORM_LIMITS.some((form) => form.label === rule.label));
  unmarshal({ rateLimits: { rules: kept } }, settings);
  app.save(settings);
});
