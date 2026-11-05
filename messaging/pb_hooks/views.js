const conversations = require(`${__hooks}/lib/conversations.js`);
const people = require(`${__hooks}/lib/people.js`);

const VIEWS = `${__hooks}/views`;
const PARTIALS = [
  "partials/conversation-list.html",
  "partials/conversation-pane.html",
  "partials/message.html",
  "partials/new-conversation.html",
  "partials/notifications.html",
  "partials/notify-count.html",
  "partials/profile-form.html",
  "partials/avatar.html",
  "icons.html",
];

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
}

function fragment(name, data) {
  const entry = `partials/${name}.html`;
  return render([entry, ...PARTIALS.filter((file) => file !== entry)], data);
}

function parseDate(value) {
  return value ? Date.parse(value.replace(" ", "T")) : 0;
}

function shortTime(value) {
  const at = parseDate(value);
  if (!at) return "";
  const date = new Date(at);
  const age = Date.now() - at;
  if (age < 60000) return "now";
  if (age < 3600000) return `${Math.floor(age / 60000)}m`;
  if (age < 86400000) return `${Math.floor(age / 3600000)}h`;
  if (age < 7 * 86400000) return `${Math.floor(age / 86400000)}d`;
  return date.toISOString().slice(0, 10);
}

function clockTime(value) {
  const date = new Date(parseDate(value));
  const hours = date.getUTCHours();
  return `${hours % 12 || 12}:${String(date.getUTCMinutes()).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"} UTC`;
}

function person(id, name) {
  return { id, name, initials: people.initials(name), hue: people.hueOf(id) };
}

function conversationTitle(conversation, userId, names) {
  const title = conversation.getString("title");
  if (title) return title;
  const others = conversation.getStringSlice("members").filter((id) => id !== userId).map((id) => names[id]);
  return others.length ? others.join(", ") : "Just you";
}

function summary(conversation, userId, names, unread) {
  const others = conversation.getStringSlice("members").filter((id) => id !== userId);
  return {
    id: conversation.id,
    title: conversationTitle(conversation, userId, names),
    preview: conversation.getString("last_message") || "No messages yet",
    when: shortTime(conversation.getString("last_message_at") || conversation.getString("created")),
    unread: unread || 0,
    group: others.length > 1 || !!conversation.getString("title"),
    avatar: others.length > 1 || conversation.getString("title")
      ? person(conversation.id, conversationTitle(conversation, userId, names))
      : person(others[0] || userId, names[others[0]] || names[userId] || "?"),
  };
}

function messageData(message, userId, names) {
  const author = message.getString("author");
  return {
    id: message.id,
    mine: author === userId,
    author: person(author, names[author] || "Someone"),
    body: message.getString("body"),
    time: clockTime(message.getString("created")),
    created: message.getString("created"),
  };
}

module.exports = {
  page(open) {
    return render(["layout.html", "pages/app.html", ...PARTIALS], {
      site: $app.settings().meta.appName || "Messages",
      open: conversations.ID.test(open || "") ? open : "",
    });
  },

  list(user, selected) {
    const { conversations: items, unread } = conversations.listFor(user.id);
    const ids = [...new Set(items.flatMap((item) => item.getStringSlice("members")))];
    const names = people.names($app, ids);
    return fragment("conversation-list", { conversations: items.map((item) => summary(item, user.id, names, unread[item.id])), selected });
  },

  pane(conversation, user) {
    const memberIds = conversation.getStringSlice("members");
    const recent = [...$app.findRecordsByFilter("messages", "conversation = {:c}", "-created", 50, 0, { c: conversation.id })].reverse();
    const names = people.names($app, [...new Set([...memberIds, ...recent.map((message) => message.getString("author"))])]);
    conversations.markRead(conversation.id, user.id);
    return fragment("conversation-pane", {
      id: conversation.id,
      title: conversationTitle(conversation, user.id, names),
      members: memberIds.map((id) => person(id, names[id])),
      messages: recent.map((message) => messageData(message, user.id, names)),
    });
  },

  message(message, user) {
    const author = message.getString("author");
    return fragment("message", messageData(message, user.id, people.names($app, [author])));
  },

  newConversation() {
    return fragment("new-conversation", {});
  },

  empty() {
    return fragment("conversation-pane", { id: "" });
  },

  notifications(userId) {
    const items = $app.findRecordsByFilter("notifications", "user = {:u}", "-created", 30, 0, { u: userId });
    return fragment("notifications", {
      notifications: items.map((item) => ({ text: item.getString("text"), link: item.getString("link"), read: item.getBool("read"), when: shortTime(item.getString("created")) })),
    });
  },

  notifyCount(userId) {
    const count = $app.countRecords("notifications", $dbx.hashExp({ user: userId, read: false }));
    return fragment("notify-count", { count });
  },

  profileForm(user, saved) {
    const profile = people.ensureProfile($app, user);
    return fragment("profile-form", { display_name: profile.getString("display_name"), about: profile.getString("about"), email: user.getString("email"), saved });
  },
};
