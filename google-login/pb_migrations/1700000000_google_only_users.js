/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.passwordAuth.enabled = false;
  users.oauth2.enabled = true;
  users.oauth2.mappedFields.name = "name";
  users.oauth2.mappedFields.avatarURL = "avatar";
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.passwordAuth.enabled = true;
  app.save(users);
});
