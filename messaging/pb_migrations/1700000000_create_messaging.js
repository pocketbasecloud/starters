/// <reference path="../pb_data/types.d.ts" />

const MEMBER = "members.id ?= @request.auth.id";
const FORM_LIMITS = [
  { label: "POST /app/conversations", maxRequests: 30, duration: 60, audience: "" },
];

function setFormLimits(app, keep) {
  const settings = app.settings();
  const limits = JSON.parse(JSON.stringify(settings.rateLimits));
  const kept = (limits.rules || []).filter((rule) => !FORM_LIMITS.some((form) => form.label === rule.label));
  unmarshal({ rateLimits: { enabled: keep ? true : limits.enabled, rules: keep ? [...kept, ...FORM_LIMITS] : kept } }, settings);
  app.save(settings);
}

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const profiles = new Collection({
    type: "base",
    name: "profiles",
    listRule: '@request.auth.collectionName = "users"',
    viewRule: '@request.auth.collectionName = "users"',
    createRule: null,
    updateRule: "user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)",
    deleteRule: null,
    fields: [
      { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "display_name", required: true, max: 60 },
      { type: "text", name: "about", max: 200 },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_profiles_user ON profiles (user)"],
  });
  app.save(profiles);

  const conversations = new Collection({
    type: "base",
    name: "conversations",
    listRule: MEMBER,
    viewRule: MEMBER,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "title", max: 80 },
      { type: "relation", name: "members", required: true, collectionId: users.id, maxSelect: 50, cascadeDelete: false },
      { type: "relation", name: "created_by", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "last_message", max: 140 },
      { type: "date", name: "last_message_at" },
      { type: "autodate", name: "created", onCreate: true },
    ],
  });
  app.save(conversations);

  const messages = new Collection({
    type: "base",
    name: "messages",
    listRule: `conversation.${MEMBER}`,
    viewRule: `conversation.${MEMBER}`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "conversation", required: true, collectionId: conversations.id, maxSelect: 1, cascadeDelete: true },
      { type: "relation", name: "author", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "body", required: true, max: 4000 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE INDEX idx_messages_conversation ON messages (conversation, created)"],
  });
  app.save(messages);

  const reads = new Collection({
    type: "base",
    name: "reads",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "conversation", required: true, collectionId: conversations.id, maxSelect: 1, cascadeDelete: true },
      { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { type: "date", name: "read_at", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_reads_pair ON reads (conversation, user)"],
  });
  app.save(reads);

  const notifications = new Collection({
    type: "base",
    name: "notifications",
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: "user = @request.auth.id",
    fields: [
      { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "text", required: true, max: 200 },
      { type: "text", name: "link", max: 200, pattern: "^/[a-zA-Z0-9/_-]*$" },
      { type: "bool", name: "read" },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE INDEX idx_notifications_user ON notifications (user, read, created)"],
  });
  app.save(notifications);

  const settings = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "number", name: "max_members", required: true, onlyInt: true, min: 2, max: 50, help: "The most people in one conversation" },
      { type: "number", name: "retention_days", onlyInt: true, min: 0, max: 3650, help: "Delete messages older than this many days. 0 keeps them forever." },
    ],
  });
  app.save(settings);
  const defaults = new Record(settings);
  defaults.load({ max_members: 20, retention_days: 0 });
  app.save(defaults);

  const audit = new Collection({
    type: "base",
    name: "audit_log",
    listRule: null,
    viewRule: null,
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
  for (const name of ["audit_log", "settings", "notifications", "reads", "messages", "conversations", "profiles"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
