/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page());
});

routerAdd("GET", "/app/tasks", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.list(e.auth.id, e.request.url.query().get("show")));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/summary", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.summary(e.auth.id));
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/tasks", (e) => {
  const views = require(`${__hooks}/views.js`);
  const title = String(e.requestInfo().body.title ?? "").trim();
  if (!title) throw new BadRequestError("Give the task a title");
  if (title.length > 200) throw new BadRequestError("Keep the title under 200 characters");
  const task = new Record($app.findCollectionByNameOrId("tasks"));
  task.set("title", title);
  task.set("user", e.auth.id);
  $app.save(task);
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, views.item(task));
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/app/tasks/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const task = views.owned(e);
  task.set("done", !task.getBool("done"));
  $app.save(task);
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, views.item(task));
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/app/tasks/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  $app.delete(views.owned(e));
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, "");
}, $apis.requireAuth("users"));
