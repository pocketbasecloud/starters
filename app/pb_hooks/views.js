const icons = require(`${__hooks}/zen.js`);

const SHOW = ["all", "open", "done"];
const LIMIT = 200;

const field = (id, label, input, hideLabel) => `<div class="zen-input-field" data-size="medium" data-state="default">
  <span class="zen-input-label zen-type-body-small-regular${hideLabel ? " zen-visually-hidden" : ""}" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="${id}">${label}</label></span></span>
  <div class="zen-input__control">${input}</div>
</div>`;

const input = (id, name, type, autocomplete, extra) =>
  `<input id="${id}" class="zen-input__native zen-type-body-base-medium" name="${name}" type="${type}" autocomplete="${autocomplete}" ${extra || ""} required>`;

const submit = (label) =>
  `<button type="submit" class="zen-button" data-size="md" data-appearance="main" data-level="primary" data-variant="primary"><span class="zen-button__label zen-type-button-label-m">${label}</span></button>`;

const segmented = (name, items, label) => `<div class="zen-segmented" data-level="secondary" data-size="medium" role="group" aria-label="${label}" data-name="${name}">${
  items.map(([value, text], index) => `<button type="button" class="zen-segmented__item" data-size="medium" data-state="default" data-value="${value}" data-selected="${index === 0}" aria-pressed="${index === 0}"><span class="zen-segmented__label zen-type-body-base-bold">${text}</span></button>`).join("")
}</div>`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.site}}</title>
  <link rel="stylesheet" href="/zen.css">
  <link rel="stylesheet" href="/style.css">
  <script src="/htmx.min.js"></script>
  <script type="module" src="/app.js"></script>
</head>
<body>
  <template id="alert-icon">${icons.alert}</template>
  <div class="zen-provider app" data-paint="true" data-component-theme="brand-s1">
    <section id="welcome" class="auth" hidden>
      <div class="zen-card auth-card" data-tone="shadow" data-spacing="large"><div class="zen-card__content">
        <div class="auth-heading">
          <span class="mark" aria-hidden="true"></span>
          <h1 class="zen-text zen-heading zen-type-heading-2" data-tone="strongest">{{.site}}</h1>
          <p class="zen-text zen-type-body-base-regular" data-tone="base">Keep track of what matters, on every device.</p>
        </div>
        ${segmented("auth", [["signin", "Sign in"], ["signup", "Create account"]], "Account")}
        <form id="signin-form" class="stack" data-auth="signin">
          ${field("signin-email", "Email", input("signin-email", "email", "email", "username"))}
          ${field("signin-password", "Password", input("signin-password", "password", "password", "current-password"))}
          <div class="error-slot"></div>
          ${submit("Sign in")}
        </form>
        <form id="signup-form" class="stack" data-auth="signup" hidden>
          ${field("signup-email", "Email", input("signup-email", "email", "email", "email"))}
          ${field("signup-password", "Password", input("signup-password", "password", "password", "new-password", 'minlength="8"'))}
          <div class="error-slot"></div>
          ${submit("Create account")}
        </form>
      </div></div>
    </section>

    <div id="workspace" hidden>
      <header class="topbar">
        <div class="wrap topbar-row">
          <a class="brand" href="/"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a>
          <div class="account">
            <span id="who" class="zen-text zen-type-body-small-regular" data-tone="base"></span>
            <button id="signout" type="button" class="zen-button" data-size="sm" data-appearance="main" data-level="secondary" data-variant="secondary"><span class="zen-button__icon" aria-hidden="true">${icons.logOut}</span><span class="zen-button__label zen-type-button-label-s">Sign out</span></button>
          </div>
        </div>
      </header>

      <main class="wrap page">
        <header class="zen-page-header"><div class="zen-page-header__row"><div class="zen-page-header__titles"><h1 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">My tasks</h1></div></div><p class="zen-text zen-type-body-base-regular zen-page-header__description" data-tone="base" id="summary" hx-get="/app/summary" hx-trigger="signed-in from:body, tasks-changed from:body">&nbsp;</p></header>

        <div class="error-slot"></div>

        <div class="zen-card" data-tone="shadow" data-spacing="medium"><div class="zen-card__content">
          <form class="add" hx-post="/app/tasks" hx-swap="none" hx-on::after-request="if (event.detail.successful) this.reset()">
            ${field("new-task", "New task", '<input id="new-task" class="zen-input__native zen-type-body-base-medium" name="title" placeholder="Add a task" maxlength="200" autocomplete="off" required>', true)}
            <button type="submit" class="zen-button" data-size="md" data-appearance="main" data-level="primary" data-variant="primary"><span class="zen-button__icon" aria-hidden="true">${icons.plus}</span><span class="zen-button__label zen-type-button-label-m">Add</span></button>
          </form>
          <form id="show" class="filters" onsubmit="return false">
            <input type="hidden" id="show-value" name="show" value="all">
            ${segmented("show", [["all", "All"], ["open", "Open"], ["done", "Done"]], "Show tasks")}
          </form>
          <ul id="tasks" class="tasks" hx-get="/app/tasks" hx-include="#show" hx-disinherit="hx-include"
            hx-trigger="signed-in from:body, change from:#show, tasks-changed from:body"></ul>
        </div></div>
      </main>
    </div>
  </div>
</body>
</html>`;

const ITEM = `<li class="task" id="task-{{.id}}">
  <label class="zen-checkbox" data-side="left" data-state="default" data-checked="{{.done}}" data-indeterminate="false">
    <span class="zen-checkbox__row">
      <span class="zen-checkbox__mark" aria-hidden="true"><span class="zen-checkbox__box">{{if .done}}${icons.check.replace('data-size="base"', 'data-size="xs"')}{{end}}</span></span>
      <span class="zen-checkbox__content"><span class="zen-checkbox__label zen-type-body-base-regular">{{.title}}</span></span>
    </span>
    <input type="checkbox" aria-label="Done: {{.title}}" {{if .done}}checked{{end}}
      hx-patch="/app/tasks/{{.id}}" hx-target="#task-{{.id}}" hx-swap="outerHTML">
  </label>
  <button type="button" class="zen-button zen-button--icon-only delete" data-size="sm" data-appearance="flat" data-level="primary" data-variant="primary" aria-label="Delete {{.title}}"
    hx-delete="/app/tasks/{{.id}}" hx-target="#task-{{.id}}" hx-swap="outerHTML"><span class="zen-button__icon" aria-hidden="true">${icons.trash}</span></button>
</li>`;

const EMPTY = {
  all: ["No tasks yet", "Add your first task above."],
  open: ["All caught up", "Nothing left to do."],
  done: ["Nothing done yet", "Tick a task when it's finished."],
};

const EMPTY_ITEM = `<li class="task-empty"><section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">{{.title}}</h3><p class="zen-empty-state__caption zen-type-body-base-regular">{{.caption}}</p></div></div></section></li>`;

const SUMMARY = `{{.open}} open · {{.done}} done`;

function render(template, data) {
  return $template.loadString(template).render(data);
}

function item(task) {
  return render(ITEM, { id: task.id, title: task.getString("title"), done: task.getBool("done") });
}

function countFor(userId, done) {
  const result = new DynamicModel({ count: 0 });
  $app.db()
    .newQuery("SELECT COUNT(*) AS count FROM tasks WHERE user = {:user} AND done = {:done}")
    .bind({ user: userId, done })
    .one(result);
  return result.count;
}

module.exports = {
  item,
  SHOW,

  page() {
    return render(PAGE, { site: $app.settings().meta.appName || "Tasks" });
  },

  list(userId, show) {
    const mode = SHOW.includes(show) ? show : "all";
    const filter = mode === "open" ? " && done = false" : mode === "done" ? " && done = true" : "";
    const tasks = $app.findRecordsByFilter("tasks", `user = {:user}${filter}`, "-created", LIMIT, 0, { user: userId });
    if (tasks.length > 0) return tasks.map(item).join("");
    const [title, caption] = EMPTY[mode];
    return render(EMPTY_ITEM, { title, caption });
  },

  summary(userId) {
    return render(SUMMARY, { open: countFor(userId, false), done: countFor(userId, true) });
  },

  owned(e) {
    let task;
    try {
      task = $app.findRecordById("tasks", e.request.pathValue("id"));
    } catch {
      throw new NotFoundError("Task not found");
    }
    if (task.getString("user") !== e.auth.id) throw new NotFoundError("Task not found");
    return task;
  },
};
