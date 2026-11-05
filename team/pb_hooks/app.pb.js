/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page({}));
});

routerAdd("GET", "/t/{team}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page({ team: e.request.pathValue("team") }));
});

routerAdd("GET", "/t/{team}/people", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page({ team: e.request.pathValue("team"), view: "people" }));
});

routerAdd("GET", "/t/{team}/p/{project}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page({ team: e.request.pathValue("team"), project: e.request.pathValue("project") }));
});

routerAdd("GET", "/invite/{token}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page({ invite: e.request.pathValue("token") }));
});

routerAdd("GET", "/app/home", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  const result = views.home(e.auth, { team: query.get("team"), project: query.get("project"), view: query.get("view") });
  e.response.header().set("HX-Push-Url", result.url);
  return e.html(200, result.html);
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/teams", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const team = teams.create(e.auth, e.requestInfo().body.name);
  const result = views.home(e.auth, { team: team.id });
  e.response.header().set("HX-Push-Url", result.url);
  return e.html(200, result.html);
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/teams/{team}/projects", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const work = require(`${__hooks}/lib/work.js`);
  const member = teams.membership(e.request.pathValue("team"), e.auth.id);
  const project = work.createProject(member, e.auth, e.requestInfo().body);
  const result = views.home(e.auth, { team: member.getString("team"), project: project.id });
  e.response.header().set("HX-Push-Url", result.url);
  return e.html(200, result.html);
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/projects/{id}/tasks", (e) => {
  const views = require(`${__hooks}/views.js`);
  const work = require(`${__hooks}/lib/work.js`);
  const { project } = work.projectFor(e.request.pathValue("id"), e.auth.id);
  const task = work.createTask(project, e.auth, e.requestInfo().body);
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, views.task(task, project));
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/app/tasks/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const work = require(`${__hooks}/lib/work.js`);
  const { task, project } = work.taskFor(e.request.pathValue("id"), e.auth.id);
  work.updateTask(task, project, e.requestInfo().body);
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, views.task(task, project));
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/app/tasks/{id}", (e) => {
  const work = require(`${__hooks}/lib/work.js`);
  const { task } = work.taskFor(e.request.pathValue("id"), e.auth.id);
  $app.delete(task);
  e.response.header().set("HX-Trigger", "tasks-changed");
  return e.html(200, "");
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/invite-links", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const mail = require(`${__hooks}/lib/mail.js`);
  const body = e.requestInfo().body;
  const member = teams.membership(String(body.team ?? ""), e.auth.id);
  teams.requireManager(member);
  const { record, token } = teams.invite(member, e.auth, body);
  const meta = $app.settings().meta;
  const origin = require(`${__hooks}/lib/origin.js`).siteOrigin(e);
  const link = `${origin}/invite/${token}`;
  const team = $app.findRecordById("teams", member.getString("team"));
  const sent = mail.send($app, {
    to: record.getString("email"),
    name: "",
    subject: `Join ${team.getString("name")} on ${meta.appName || "the workspace"}`,
    html: $template.loadFiles(`${__hooks}/views/emails/invite.html`).render({ team: team.getString("name"), link, site: meta.appName || "the workspace", days: Math.round((Date.parse(record.getString("expires").replace(" ", "T")) - Date.now()) / 86400000) }),
  });
  const result = views.home(e.auth, { team: member.getString("team"), view: "people", flash: { email: record.getString("email"), link, sent } });
  return e.html(200, result.html);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/app/invite-links/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const invite = teams.find("invites", e.request.pathValue("id"), "Invite");
  const member = teams.membership(invite.getString("team"), e.auth.id);
  teams.requireManager(member);
  teams.revoke(member, e.auth, invite.id);
  return e.html(200, views.home(e.auth, { team: member.getString("team"), view: "people" }).html);
}, $apis.requireAuth("users"));

routerAdd("POST", "/app/invites/{token}/accept", (e) => {
  const teams = require(`${__hooks}/lib/teams.js`);
  const teamId = teams.accept(e.auth, e.request.pathValue("token"));
  e.response.header().set("HX-Redirect", `/t/${teamId}`);
  return e.json(200, { team: teamId });
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/app/members/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const target = teams.find("members", e.request.pathValue("id"), "Member");
  const actor = teams.membership(target.getString("team"), e.auth.id);
  teams.changeRole(actor, e.auth, target.id, String(e.requestInfo().body.role ?? ""));
  return e.html(200, views.home(e.auth, { team: actor.getString("team"), view: "people" }).html);
}, $apis.requireAuth("users"));

routerAdd("DELETE", "/app/members/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const teams = require(`${__hooks}/lib/teams.js`);
  const target = teams.find("members", e.request.pathValue("id"), "Member");
  const actor = teams.membership(target.getString("team"), e.auth.id);
  const left = teams.remove(actor, e.auth, target.id);
  const result = left ? views.home(e.auth, {}) : views.home(e.auth, { team: actor.getString("team"), view: "people" });
  e.response.header().set("HX-Push-Url", result.url);
  return e.html(200, result.html);
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/teams/new", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.onboarding());
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/projects/{id}/progress", (e) => {
  const views = require(`${__hooks}/views.js`);
  const work = require(`${__hooks}/lib/work.js`);
  const { project } = work.projectFor(e.request.pathValue("id"), e.auth.id);
  return e.html(200, views.progress(project));
}, $apis.requireAuth("users"));
