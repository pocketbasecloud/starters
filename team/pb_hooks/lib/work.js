const audit = require(`${__hooks}/lib/audit.js`);
const teams = require(`${__hooks}/lib/teams.js`);

function projectFor(projectId, userId) {
  const project = teams.find("projects", projectId, "Project");
  const member = teams.membership(project.getString("team"), userId);
  return { project, member };
}

function taskFor(taskId, userId) {
  const task = teams.find("tasks", taskId, "Task");
  const { project, member } = projectFor(task.getString("project"), userId);
  return { task, project, member };
}

function createProject(member, user, { name, description }) {
  const clean = String(name ?? "").trim().slice(0, 80);
  if (!clean) throw new BadRequestError("Give the project a name.");
  const project = new Record($app.findCollectionByNameOrId("projects"));
  project.set("team", member.getString("team"));
  project.set("name", clean);
  project.set("description", String(description ?? "").trim().slice(0, 300));
  $app.save(project);
  audit.record($app, { team: member.getString("team"), actor: user.getString("email"), action: "project.created", target: `projects/${project.id}`, detail: clean });
  return project;
}

function validAssignee(teamId, assignee) {
  if (!assignee) return "";
  try {
    $app.findFirstRecordByFilter("members", "team = {:team} && user = {:user}", { team: teamId, user: assignee });
    return assignee;
  } catch {
    throw new BadRequestError("Assign tasks to people in this team.");
  }
}

function createTask(project, user, { title, assignee }) {
  const clean = String(title ?? "").trim().slice(0, 200);
  if (!clean) throw new BadRequestError("Write the task first.");
  const task = new Record($app.findCollectionByNameOrId("tasks"));
  task.set("project", project.id);
  task.set("title", clean);
  task.set("assignee", validAssignee(project.getString("team"), String(assignee ?? "")));
  task.set("created_by", user.id);
  $app.save(task);
  return task;
}

function updateTask(task, project, body) {
  if (body.done !== undefined) task.set("done", String(body.done) === "true");
  if (body.assignee !== undefined) task.set("assignee", validAssignee(project.getString("team"), String(body.assignee)));
  $app.save(task);
  return task;
}

module.exports = { projectFor, taskFor, createProject, createTask, updateTask };
