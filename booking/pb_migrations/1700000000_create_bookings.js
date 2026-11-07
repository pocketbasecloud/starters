/// <reference path="../pb_data/types.d.ts" />

const STAFF = '@request.auth.collectionName = "staff"';
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const CLOCK = "^([01][0-9]|2[0-3]):[0-5][0-9]$";
const VISITOR_IP_HEADERS = ["CF-Connecting-IP", "X-Forwarded-For"];
const FORM_LIMITS = [{ label: "POST /book", maxRequests: 5, duration: 60, audience: "" }];

const SAMPLE_STAFF = [
  { name: "Sam Rivera", title: "Founder", email: "sam@example.com", days: ["monday", "tuesday", "wednesday", "thursday", "friday"], start: "09:00", end: "17:00" },
  { name: "Alex Kim", title: "Consultant", email: "alex@example.com", days: ["tuesday", "wednesday", "thursday", "friday", "saturday"], start: "10:00", end: "18:00" },
];

const SAMPLE_SERVICES = [
  { name: "Intro call", minutes: 30, price: 0, sort: 1, description: "A short call to get to know each other and see if we're a fit.", staff: [] },
  { name: "Consultation", minutes: 60, price: 9000, sort: 2, description: "A focused session on one question, with written notes afterwards.", staff: [] },
  { name: "Deep-dive session", minutes: 90, price: 15000, sort: 3, description: "Time to work through a larger problem together, step by step.", staff: ["Sam Rivera"] },
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
  const users = app.findCollectionByNameOrId("users");
  users.createRule = null;
  app.save(users);

  const staff = new Collection({
    type: "auth",
    name: "staff",
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: null,
    updateRule: "id = @request.auth.id",
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 100 },
      { type: "text", name: "title", max: 100 },
      { type: "bool", name: "active" },
    ],
  });
  app.save(staff);

  const settings = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "number", name: "utc_offset_minutes", onlyInt: true, min: -720, max: 840, help: "Your time zone as minutes from UTC: -300 for New York in winter, 60 for Paris" },
      { type: "number", name: "slot_minutes", required: true, onlyInt: true, min: 5, max: 240, help: "How often a booking can start" },
      { type: "number", name: "days_ahead", required: true, onlyInt: true, min: 1, max: 90 },
      { type: "number", name: "notice_minutes", onlyInt: true, min: 0, max: 10080, help: "The shortest notice you accept" },
      { type: "text", name: "currency_symbol", max: 4 },
    ],
  });
  app.save(settings);
  const defaults = new Record(settings);
  defaults.load({ utc_offset_minutes: 0, slot_minutes: 30, days_ahead: 21, notice_minutes: 120, currency_symbol: "$" });
  app.save(defaults);

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
      { type: "relation", name: "staff", collectionId: staff.id, maxSelect: 50, cascadeDelete: false, help: "Who offers it. Leave empty for everyone." },
      { type: "number", name: "sort", onlyInt: true },
      { type: "bool", name: "active" },
    ],
  });
  app.save(services);

  const shifts = new Collection({
    type: "base",
    name: "shifts",
    listRule: STAFF,
    viewRule: STAFF,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "staff", required: true, collectionId: staff.id, maxSelect: 1, cascadeDelete: true },
      { type: "select", name: "weekday", required: true, maxSelect: 1, values: WEEKDAYS },
      { type: "text", name: "start", required: true, pattern: CLOCK, help: "24-hour time, such as 09:00" },
      { type: "text", name: "end", required: true, pattern: CLOCK, help: "24-hour time, such as 17:30" },
    ],
  });
  app.save(shifts);

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
      { type: "relation", name: "staff", required: true, collectionId: staff.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "name", required: true, max: 100 },
      { type: "email", name: "email", required: true },
      { type: "text", name: "notes", max: 1000 },
      { type: "date", name: "starts", required: true },
      { type: "date", name: "ends", required: true },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["confirmed", "cancelled"] },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_bookings_staff_starts ON bookings (staff, starts)"],
  });
  app.save(bookings);

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

  const staffIds = {};
  for (const sample of SAMPLE_STAFF) {
    const member = new Record(staff);
    member.setEmail(sample.email);
    member.setPassword($security.randomString(32));
    member.set("name", sample.name);
    member.set("title", sample.title);
    member.set("active", true);
    app.save(member);
    staffIds[sample.name] = member.id;
    for (const weekday of sample.days) {
      const shift = new Record(shifts);
      shift.load({ staff: member.id, weekday, start: sample.start, end: sample.end });
      app.save(shift);
    }
  }

  for (const sample of SAMPLE_SERVICES) {
    const service = new Record(services);
    service.load({ ...sample, staff: sample.staff.map((name) => staffIds[name]), active: true });
    app.save(service);
  }

  setFormLimits(app, true);
}, (app) => {
  setFormLimits(app, false);
  for (const name of ["audit_log", "bookings", "shifts", "services", "settings", "staff"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
});
