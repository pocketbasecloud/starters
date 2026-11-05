/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page(""));
});

routerAdd("GET", "/c/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page(e.request.pathValue("id")));
});

routerAdd("GET", "/app/conversations", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.list(e.auth, e.request.url.query().get("selected")));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/conversations/new", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.newConversation());
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/conversations", (e) => {
  const views = require(`${__hooks}/views.js`);
  const conversations = require(`${__hooks}/lib/conversations.js`);
  const conversation = conversations.start(e.auth, e.requestInfo().body);
  e.response.header().set("HX-Trigger", "conversations-changed");
  e.response.header().set("HX-Push-Url", `/c/${conversation.id}`);
  return e.html(200, views.pane(conversation, e.auth));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/conversations/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const conversations = require(`${__hooks}/lib/conversations.js`);
  const conversation = conversations.forMember(e.request.pathValue("id"), e.auth.id);
  e.response.header().set("HX-Trigger", "conversations-changed");
  return e.html(200, views.pane(conversation, e.auth));
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/conversations/{id}/messages", (e) => {
  const views = require(`${__hooks}/views.js`);
  const conversations = require(`${__hooks}/lib/conversations.js`);
  const conversation = conversations.forMember(e.request.pathValue("id"), e.auth.id);
  const message = conversations.send(conversation, e.auth, e.requestInfo().body.body);
  e.response.header().set("HX-Trigger", "conversations-changed");
  return e.html(200, views.message(message, e.auth));
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/conversations/{id}/leave", (e) => {
  const views = require(`${__hooks}/views.js`);
  const conversations = require(`${__hooks}/lib/conversations.js`);
  conversations.leave(conversations.forMember(e.request.pathValue("id"), e.auth.id), e.auth);
  e.response.header().set("HX-Trigger", "conversations-changed");
  e.response.header().set("HX-Push-Url", "/");
  return e.html(200, views.empty());
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/messages/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const conversations = require(`${__hooks}/lib/conversations.js`);
  const id = e.request.pathValue("id");
  let message;
  try {
    message = conversations.ID.test(id) ? $app.findRecordById("messages", id) : null;
  } catch {
    message = null;
  }
  if (!message) throw new NotFoundError("Message not found");
  conversations.forMember(message.getString("conversation"), e.auth.id);
  conversations.markRead(message.getString("conversation"), e.auth.id);
  return e.html(200, views.message(message, e.auth));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/notifications", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.notifications(e.auth.id));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/notifications/count", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.notifyCount(e.auth.id));
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/notifications/read", (e) => {
  const views = require(`${__hooks}/views.js`);
  $app.db().newQuery("UPDATE notifications SET read = TRUE WHERE user = {:u} AND read = FALSE").bind({ u: e.auth.id }).execute();
  e.response.header().set("HX-Trigger", "notifications-changed");
  return e.html(200, views.notifications(e.auth.id));
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/profile", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.profileForm(e.auth, false));
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/profile", (e) => {
  const views = require(`${__hooks}/views.js`);
  const people = require(`${__hooks}/lib/people.js`);
  const body = e.requestInfo().body;
  const name = String(body.display_name ?? "").trim().slice(0, 60);
  if (!name) throw new BadRequestError("Your name can't be empty.");
  const profile = people.ensureProfile($app, e.auth);
  profile.set("display_name", name);
  profile.set("about", String(body.about ?? "").trim().slice(0, 200));
  $app.save(profile);
  e.response.header().set("HX-Trigger", "conversations-changed");
  return e.html(200, views.profileForm(e.auth, true));
}, $apis.requireAuth("users"));
