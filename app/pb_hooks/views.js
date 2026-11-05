const VIEWS = `${__hooks}/views`;
const SHOW = ["all", "open", "done"];
const LIMIT = 200;
const EMPTY = {
  all: { title: "No tasks yet", caption: "Add your first task above." },
  open: { title: "All caught up", caption: "Nothing left to do." },
  done: { title: "Nothing done yet", caption: "Tick a task when it's finished." },
};

function render(files, data) {
  return $template.loadFiles(...[...files, "icons.html"].map((file) => `${VIEWS}/${file}`)).render(data);
}

function taskData(task) {
  return { id: task.id, title: task.getString("title"), done: task.getBool("done") };
}

function item(task) {
  return render(["partials/task.html"], taskData(task));
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
    return render(["layout.html", "pages/tasks.html"], { site: $app.settings().meta.appName || "Tasks" });
  },

  list(userId, show) {
    const mode = SHOW.includes(show) ? show : "all";
    const filter = mode === "open" ? " && done = false" : mode === "done" ? " && done = true" : "";
    const tasks = $app.findRecordsByFilter("tasks", `user = {:user}${filter}`, "-created", LIMIT, 0, { user: userId });
    return render(["partials/task-list.html", "partials/task.html"], { tasks: tasks.map(taskData), empty: EMPTY[mode] });
  },

  summary(userId) {
    return render(["partials/summary.html"], { open: countFor(userId, false), done: countFor(userId, true) });
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
