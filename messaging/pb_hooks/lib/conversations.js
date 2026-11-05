const audit = require(`${__hooks}/lib/audit.js`);
const people = require(`${__hooks}/lib/people.js`);
const settings = require(`${__hooks}/lib/settings.js`);

const ID = /^[a-z0-9]{15}$/;
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;

function now() {
  return new Date().toISOString().replace("T", " ");
}

function forMember(id, userId) {
  if (!ID.test(id || "")) throw new NotFoundError("Conversation not found");
  let conversation;
  try {
    conversation = $app.findRecordById("conversations", id);
  } catch {
    throw new NotFoundError("Conversation not found");
  }
  if (!conversation.getStringSlice("members").includes(userId)) throw new NotFoundError("Conversation not found");
  return conversation;
}

function listFor(userId) {
  const conversations = $app.findRecordsByFilter("conversations", "members.id ?= {:user}", "-last_message_at,-created", 100, 0, { user: userId });
  const rows = arrayOf(new DynamicModel({ id: "", unread: 0 }));
  $app.db().newQuery(`
    SELECT c.id AS id, COUNT(m.id) AS unread
    FROM conversations c
    JOIN json_each(c.members) AS member ON member.value = {:user}
    LEFT JOIN reads r ON r.conversation = c.id AND r.user = {:user}
    LEFT JOIN messages m ON m.conversation = c.id AND m.author != {:user} AND m.created > COALESCE(r.read_at, '')
    GROUP BY c.id
  `).bind({ user: userId }).all(rows);
  const unread = Object.fromEntries(rows.map((row) => [row.id, row.unread]));
  return { conversations, unread };
}

function markRead(conversationId, userId) {
  try {
    const read = $app.findFirstRecordByFilter("reads", "conversation = {:c} && user = {:u}", { c: conversationId, u: userId });
    read.set("read_at", now());
    $app.save(read);
  } catch {
    const read = new Record($app.findCollectionByNameOrId("reads"));
    read.set("conversation", conversationId);
    read.set("user", userId);
    read.set("read_at", now());
    $app.save(read);
  }
}

function notify(app, userId, text, link) {
  const notification = new Record(app.findCollectionByNameOrId("notifications"));
  notification.set("user", userId);
  notification.set("text", text.slice(0, 200));
  notification.set("link", link);
  app.save(notification);
}

function parseEmails(raw) {
  return [...new Set(String(raw ?? "").toLowerCase().split(/[\s,;]+/).map((email) => email.trim()).filter(Boolean))];
}

function start(author, { emails, title, body }) {
  const wanted = parseEmails(emails).filter((email) => email !== author.getString("email").toLowerCase());
  const limit = settings.current().maxMembers;
  if (wanted.length === 0) throw new BadRequestError("Add the email of at least one person.");
  if (wanted.length + 1 > limit) throw new BadRequestError(`A conversation can have at most ${limit} people.`);
  const invalid = wanted.filter((email) => email.length > 254 || !EMAIL.test(email));
  if (invalid.length) throw new BadRequestError(`${invalid[0]} is not an email address.`);
  const others = [];
  for (const email of wanted) {
    try {
      others.push($app.findAuthRecordByEmail("users", email));
    } catch {
      throw new BadRequestError(`Nobody has signed up with ${email} yet.`);
    }
  }
  const memberIds = [author.id, ...others.map((user) => user.id)];
  const cleanTitle = String(title ?? "").trim().slice(0, 80);
  if (others.length === 1 && !cleanTitle) {
    const existing = $app
      .findRecordsByFilter("conversations", "members ~ {:a} && members ~ {:b} && title = ''", "-created", 20, 0, { a: author.id, b: others[0].id })
      .find((conversation) => conversation.getStringSlice("members").length === 2);
    if (existing) {
      if (String(body ?? "").trim()) send(existing, author, body);
      return existing;
    }
  }
  let conversation;
  $app.runInTransaction((txApp) => {
    conversation = new Record(txApp.findCollectionByNameOrId("conversations"));
    conversation.set("title", cleanTitle);
    conversation.set("members", memberIds);
    conversation.set("created_by", author.id);
    txApp.save(conversation);
    const name = people.names(txApp, [author.id])[author.id];
    for (const other of others) notify(txApp, other.id, `${name} started a conversation with you`, `/c/${conversation.id}`);
    audit.record(txApp, { actor: author.getString("email"), action: "conversation.created", target: `conversations/${conversation.id}`, detail: `${memberIds.length} people` });
  });
  if (String(body ?? "").trim()) send(conversation, author, body);
  return conversation;
}

function send(conversation, author, body) {
  const text = String(body ?? "").trim().slice(0, 4000);
  if (!text) throw new BadRequestError("Write a message first.");
  let message;
  $app.runInTransaction((txApp) => {
    message = new Record(txApp.findCollectionByNameOrId("messages"));
    message.set("conversation", conversation.id);
    message.set("author", author.id);
    message.set("body", text);
    txApp.save(message);
    const fresh = txApp.findRecordById("conversations", conversation.id);
    fresh.set("last_message", text.replace(/\s+/g, " ").slice(0, 140));
    fresh.set("last_message_at", now());
    txApp.save(fresh);
  });
  markRead(conversation.id, author.id);
  return message;
}

function leave(conversation, user) {
  const remaining = conversation.getStringSlice("members").filter((id) => id !== user.id);
  $app.runInTransaction((txApp) => {
    const fresh = txApp.findRecordById("conversations", conversation.id);
    if (remaining.length === 0) {
      txApp.delete(fresh);
    } else {
      fresh.set("members", remaining);
      txApp.save(fresh);
    }
    audit.record(txApp, { actor: user.getString("email"), action: "conversation.left", target: `conversations/${conversation.id}`, detail: `${remaining.length} people remain` });
  });
}

module.exports = { ID, forMember, listFor, markRead, start, send, leave };
