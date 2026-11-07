/// <reference path="../pb_data/types.d.ts" />

const IN_TEAM = "members_via_team.user ?= @request.auth.id";
const VISITOR_IP_HEADERS = ["CF-Connecting-IP", "X-Forwarded-For"];
const FORM_LIMITS = [
  { label: "POST /app/teams", maxRequests: 60, duration: 60, audience: "" },
  { label: "POST /app/invite-links", maxRequests: 10, duration: 60, audience: "" },
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
    ],
    indexes: ["CREATE UNIQUE INDEX idx_profiles_user ON profiles (user)"],
  });
  app.save(profiles);

  const teams = new Collection({
    type: "base",
    name: "teams",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "name", required: true, max: 60 },
      { type: "relation", name: "created_by", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "autodate", name: "created", onCreate: true },
    ],
  });
  app.save(teams);

  const members = new Collection({
    type: "base",
    name: "members",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "team", required: true, collectionId: teams.id, maxSelect: 1, cascadeDelete: true },
      { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { type: "select", name: "role", required: true, maxSelect: 1, values: ["owner", "admin", "member"] },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_members_pair ON members (team, user)"],
  });
  app.save(members);

  teams.listRule = IN_TEAM;
  teams.viewRule = IN_TEAM;
  app.save(teams);
  members.listRule = `team.${IN_TEAM}`;
  members.viewRule = `team.${IN_TEAM}`;
  app.save(members);

  const invites = new Collection({
    type: "base",
    name: "invites",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "team", required: true, collectionId: teams.id, maxSelect: 1, cascadeDelete: true },
      { type: "email", name: "email", required: true },
      { type: "select", name: "role", required: true, maxSelect: 1, values: ["admin", "member"] },
      { type: "text", name: "token_hash", required: true, hidden: true, max: 64 },
      { type: "relation", name: "invited_by", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "date", name: "expires", required: true },
      { type: "date", name: "accepted" },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_invites_token ON invites (token_hash)"],
  });
  app.save(invites);

  const projects = new Collection({
    type: "base",
    name: "projects",
    listRule: `team.${IN_TEAM}`,
    viewRule: `team.${IN_TEAM}`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "team", required: true, collectionId: teams.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "name", required: true, max: 80 },
      { type: "text", name: "description", max: 300 },
      { type: "bool", name: "archived" },
      { type: "autodate", name: "created", onCreate: true },
    ],
  });
  app.save(projects);

  const tasks = new Collection({
    type: "base",
    name: "tasks",
    listRule: `project.team.${IN_TEAM}`,
    viewRule: `project.team.${IN_TEAM}`,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "project", required: true, collectionId: projects.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 200 },
      { type: "bool", name: "done" },
      { type: "relation", name: "assignee", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "relation", name: "created_by", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_tasks_project ON tasks (project, done)"],
  });
  app.save(tasks);

  const settings = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "number", name: "invite_days", required: true, onlyInt: true, min: 1, max: 30, help: "How long an invite link works" },
      { type: "number", name: "max_members", required: true, onlyInt: true, min: 1, max: 1000, help: "The most people in one team" },
    ],
  });
  app.save(settings);
  const defaults = new Record(settings);
  defaults.load({ invite_days: 7, max_members: 50 });
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
      { type: "relation", name: "team", collectionId: teams.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "actor", max: 200 },
      { type: "text", name: "action", required: true, max: 60 },
      { type: "text", name: "target", max: 100 },
      { type: "text", name: "detail", max: 1000 },
      { type: "autodate", name: "created", onCreate: true },
    ],
    indexes: ["CREATE INDEX idx_audit_log_team ON audit_log (team, created)"],
  });
  app.save(audit);

  setFormLimits(app, true);
}, (app) => {
  setFormLimits(app, false);
  for (const name of ["audit_log", "settings", "tasks", "projects", "invites", "members", "teams", "profiles"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
