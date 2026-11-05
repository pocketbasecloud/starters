const people = require(`${__hooks}/lib/people.js`);
const teams = require(`${__hooks}/lib/teams.js`);

const VIEWS = `${__hooks}/views`;
const PARTIALS = [
  "partials/workspace.html",
  "partials/onboarding.html",
  "partials/project.html",
  "partials/task.html",
  "partials/people.html",
  "partials/avatar.html",
  "partials/error.html",
  "icons.html",
];
const ROLE_LABELS = { owner: "Owner", admin: "Admin", member: "Member" };

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
}

function fragment(name, data) {
  const entry = `partials/${name}.html`;
  return render([entry, ...PARTIALS.filter((file) => file !== entry)], data);
}

function person(id, name) {
  return { id, name, initials: people.initials(name), hue: people.hueOf(id) };
}

function shortTime(value) {
  const at = Date.parse(String(value).replace(" ", "T"));
  const age = Date.now() - at;
  if (age < 60000) return "just now";
  if (age < 3600000) return `${Math.floor(age / 60000)} min ago`;
  if (age < 86400000) return `${Math.floor(age / 3600000)} h ago`;
  return new Date(at).toISOString().slice(0, 10);
}

function teamMembers(teamId) {
  const rows = $app.findRecordsByFilter("members", "team = {:team}", "created", 500, 0, { team: teamId });
  const names = people.names($app, rows.map((row) => row.getString("user")));
  return rows.map((row) => ({
    id: row.id,
    user: row.getString("user"),
    role: row.getString("role"),
    roleLabel: ROLE_LABELS[row.getString("role")],
    ...person(row.getString("user"), names[row.getString("user")]),
    memberId: row.id,
  }));
}

function taskData(task, membersById, canAssign) {
  const assignee = task.getString("assignee");
  return {
    id: task.id,
    title: task.getString("title"),
    done: task.getBool("done"),
    assignee: assignee && membersById[assignee] ? membersById[assignee] : null,
    options: canAssign ? Object.values(membersById).map((member) => ({ id: member.user, name: member.name, selected: member.user === assignee })) : [],
  };
}

function projectData(project, members) {
  const membersById = Object.fromEntries(members.map((member) => [member.user, member]));
  const tasks = $app.findRecordsByFilter("tasks", "project = {:project}", "done,-created", 500, 0, { project: project.id });
  const done = tasks.filter((task) => task.getBool("done")).length;
  return {
    id: project.id,
    name: project.getString("name"),
    description: project.getString("description"),
    tasks: tasks.map((task) => taskData(task, membersById, true)),
    total: tasks.length,
    done,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    members: members.map((member) => ({ id: member.user, name: member.name })),
  };
}

function peopleData(member, flash) {
  const teamId = member.getString("team");
  const manager = teams.MANAGERS.includes(member.getString("role"));
  const owner = member.getString("role") === "owner";
  const members = teamMembers(teamId).map((item) => ({
    ...item,
    self: item.memberId === member.id,
    canChangeRole: owner,
    canRemove: item.memberId !== member.id && manager && (item.role !== "owner" || owner),
    roles: ["owner", "admin", "member"].map((role) => ({ value: role, label: ROLE_LABELS[role], selected: role === item.role })),
  }));
  const invites = manager
    ? $app.findRecordsByFilter("invites", "team = {:team} && accepted = ''", "-created", 100, 0, { team: teamId }).map((invite) => ({
      id: invite.id,
      email: invite.getString("email"),
      role: ROLE_LABELS[invite.getString("role")],
      expires: invite.getString("expires").slice(0, 10),
    }))
    : [];
  const activity = $app.findRecordsByFilter("audit_log", "team = {:team}", "-created", 15, 0, { team: teamId }).map((entry) => ({
    actor: entry.getString("actor"),
    action: entry.getString("action").replace(".", " "),
    detail: entry.getString("detail"),
    when: shortTime(entry.getString("created")),
  }));
  return { team: teamId, manager, owner, members, invites, activity, flash: flash || null };
}

function canonical(teamId, view, projectId) {
  if (view === "people") return `/t/${teamId}/people`;
  if (projectId) return `/t/${teamId}/p/${projectId}`;
  return `/t/${teamId}`;
}

module.exports = {
  page(open) {
    return render(["layout.html", "pages/app.html", ...PARTIALS], {
      site: $app.settings().meta.appName || "Workspace",
      open: {
        team: teams.ID.test(open.team || "") ? open.team : "",
        project: teams.ID.test(open.project || "") ? open.project : "",
        view: open.view === "people" ? "people" : "",
        invite: /^[A-Za-z0-9]{40}$/.test(open.invite || "") ? open.invite : "",
      },
    });
  },

  home(user, { team, project, view, flash }) {
    const mine = teams.teamsFor(user.id);
    if (mine.length === 0) return { html: fragment("onboarding", {}), url: "/" };
    const current = mine.find((item) => item.team.id === team) || mine[0];
    const teamId = current.team.id;
    const projects = $app.findRecordsByFilter("projects", "team = {:team} && archived = false", "created", 200, 0, { team: teamId });
    const selected = view === "people" ? null : projects.find((item) => item.id === project) || null;
    const members = teamMembers(teamId);
    const data = {
      teams: mine.map((item) => ({ id: item.team.id, name: item.team.getString("name"), selected: item.team.id === teamId })),
      team: { id: teamId, name: current.team.getString("name"), role: ROLE_LABELS[current.member.getString("role")] },
      projects: projects.map((item) => ({ id: item.id, name: item.getString("name"), selected: selected && selected.id === item.id })),
      memberCount: members.length,
      view: view === "people" ? "people" : selected ? "project" : "overview",
      project: selected ? projectData(selected, members) : null,
      people: view === "people" ? peopleData(current.member, flash) : null,
    };
    return { html: fragment("workspace", data), url: canonical(teamId, view, selected ? selected.id : "") };
  },

  task(task, project) {
    const members = teamMembers(project.getString("team"));
    return fragment("task", taskData(task, Object.fromEntries(members.map((member) => [member.user, member])), true));
  },

  onboarding() {
    return fragment("onboarding", {});
  },

  progress(project) {
    const data = projectData(project, teamMembers(project.getString("team")));
    return render(["partials/progress.html", ...PARTIALS], data);
  },

  error(text) {
    return fragment("error", { text });
  },
};
