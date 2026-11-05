module.exports = {
  record(app, { actor, action, target, detail }) {
    const entry = new Record(app.findCollectionByNameOrId("audit_log"));
    entry.set("actor", actor || "system");
    entry.set("action", action);
    entry.set("target", target || "");
    entry.set("detail", String(detail || "").slice(0, 1000));
    app.save(entry);
  },
};
