/// <reference path="../pb_data/types.d.ts" />

const OWNER = "user = @request.auth.id";

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const tasks = new Collection({
    type: "base",
    name: "tasks",
    listRule: OWNER,
    viewRule: OWNER,
    createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
    updateRule: `${OWNER} && (@request.body.user:isset = false || @request.body.user = @request.auth.id)`,
    deleteRule: OWNER,
    fields: [
      { type: "text", name: "title", required: true, max: 200 },
      { type: "bool", name: "done" },
      { type: "relation", name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_tasks_user ON tasks (user)"],
  });
  app.save(tasks);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("tasks"));
});
