/// <reference path="../pb_data/types.d.ts" />

const OWNER = "owner = @request.auth.id";

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const notes = new Collection({
    type: "base",
    name: "notes",
    listRule: OWNER,
    viewRule: OWNER,
    createRule: '@request.auth.collectionName = "users" && @request.body.owner = @request.auth.id',
    updateRule: `${OWNER} && (@request.body.owner:isset = false || @request.body.owner = @request.auth.id)`,
    deleteRule: OWNER,
    fields: [
      { type: "relation", name: "owner", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 200 },
      { type: "text", name: "body", max: 20000 },
      { type: "bool", name: "pinned" },
      {
        type: "file",
        name: "attachments",
        maxSelect: 5,
        maxSize: 10485760,
        protected: true,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"],
        thumbs: ["400x400"],
      },
      { type: "autodate", name: "created", onCreate: true },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_notes_owner ON notes (owner, updated)"],
  });
  app.save(notes);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("notes"));
});
