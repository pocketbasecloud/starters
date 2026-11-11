const audit = require(`${__hooks}/lib/audit.js`);
const people = require(`${__hooks}/lib/people.js`);
const settings = require(`${__hooks}/lib/settings.js`);

const ID = /^[a-z0-9]{15}$/;
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;
const MANAGERS = ["owner", "admin"];

function now() {
  return new Date().toISOString().replace("T", " ");
}

function find(collection, id, label) {
  if (!ID.test(id || "")) throw new NotFoundError(`${label} not found`);
  try {
    return $app.findRecordById(collection, id);
  } catch {
    throw new NotFoundError(`${label} not found`);
  }
}

function membership(teamId, userId) {
  if (!ID.test(teamId || "")) throw new NotFoundError("Team not found");
  try {
    return $app.findFirstRecordByFilter("members", "team = {:team} && user = {:user}", { team: teamId, user: userId });
  } catch {
    throw new NotFoundError("Team not found");
  }
}

function isMember(teamId, email) {
  let user;
  try {
    user = $app.findAuthRecordByEmail("users", email);
  } catch {
    return false;
  }
  try {
    $app.findFirstRecordByFilter("members", "team = {:team} && user = {:user}", { team: teamId, user: user.id });
    return true;
  } catch {
    return false;
  }
}

function pendingInvite(teamId, email) {
  try {
    return $app.findFirstRecordByFilter("invites", "team = {:team} && email = {:email} && accepted = ''", { team: teamId, email });
  } catch {
    return new Record($app.findCollectionByNameOrId("invites"));
  }
}

function requireManager(member) {
  if (!MANAGERS.includes(member.getString("role"))) throw new ForbiddenError("Only owners and admins can do that.");
}

function teamsFor(userId) {
  const rows = $app.findRecordsByFilter("members", "user = {:user}", "created", 100, 0, { user: userId });
  return rows.map((row) => ({ member: row, team: $app.findRecordById("teams", row.getString("team")) }));
}

function create(user, name) {
  const clean = String(name ?? "").trim().slice(0, 60);
  if (!clean) throw new BadRequestError("Give your team a name.");
  let team;
  $app.runInTransaction((txApp) => {
    team = new Record(txApp.findCollectionByNameOrId("teams"));
    team.set("name", clean);
    team.set("created_by", user.id);
    txApp.save(team);
    const member = new Record(txApp.findCollectionByNameOrId("members"));
    member.set("team", team.id);
    member.set("user", user.id);
    member.set("role", "owner");
    txApp.save(member);
    audit.record(txApp, { team: team.id, actor: user.getString("email"), action: "team.created", target: `teams/${team.id}`, detail: clean });
  });
  return team;
}

function invite(manager, user, { email, role }) {
  const address = String(email ?? "").trim().toLowerCase();
  if (address.length > 254 || !EMAIL.test(address)) throw new BadRequestError("Enter a valid email address.");
  const wanted = role === "admin" ? "admin" : "member";
  if (wanted === "admin" && manager.getString("role") !== "owner") throw new ForbiddenError("Only owners can invite admins.");
  const teamId = manager.getString("team");
  const config = settings.current();
  if ($app.countRecords("members", $dbx.hashExp({ team: teamId })) >= config.maxMembers) throw new BadRequestError(`A team can have at most ${config.maxMembers} people.`);
  if (isMember(teamId, address)) throw new BadRequestError("That person is already in the team.");
  const token = $security.randomString(40);
  const record = pendingInvite(teamId, address);
  record.set("team", teamId);
  record.set("email", address);
  record.set("role", wanted);
  record.set("token_hash", $security.sha256(token));
  record.set("invited_by", user.id);
  record.set("expires", new Date(Date.now() + config.inviteDays * 86400000).toISOString().replace("T", " "));
  $app.save(record);
  audit.record($app, { team: teamId, actor: user.getString("email"), action: "invite.sent", target: `invites/${record.id}`, detail: `${address} as ${wanted}` });
  return { record, token };
}

function accept(user, token) {
  if (!/^[A-Za-z0-9]{40}$/.test(token || "")) throw new NotFoundError("This invite link is not valid.");
  let invite;
  try {
    invite = $app.findFirstRecordByFilter("invites", "token_hash = {:hash}", { hash: $security.sha256(token) });
  } catch {
    throw new NotFoundError("This invite link is not valid.");
  }
  if (invite.getString("accepted")) throw new BadRequestError("This invite has already been used.");
  if (Date.parse(invite.getString("expires").replace(" ", "T")) < Date.now()) throw new BadRequestError("This invite has expired. Ask for a new one.");
  if (invite.getString("email") !== user.getString("email").toLowerCase()) {
    throw new ForbiddenError(`This invite is for ${invite.getString("email")}. Sign in with that email to accept it.`);
  }
  const teamId = invite.getString("team");
  $app.runInTransaction((txApp) => {
    const fresh = txApp.findRecordById("invites", invite.id);
    if (fresh.getString("accepted")) throw new BadRequestError("This invite has already been used.");
    fresh.set("accepted", now());
    txApp.save(fresh);
    try {
      txApp.findFirstRecordByFilter("members", "team = {:team} && user = {:user}", { team: teamId, user: user.id });
    } catch {
      const member = new Record(txApp.findCollectionByNameOrId("members"));
      member.set("team", teamId);
      member.set("user", user.id);
      member.set("role", fresh.getString("role"));
      txApp.save(member);
    }
    audit.record(txApp, { team: teamId, actor: user.getString("email"), action: "invite.accepted", target: `invites/${invite.id}`, detail: `joined as ${fresh.getString("role")}` });
  });
  return teamId;
}

function revoke(manager, user, inviteId) {
  const record = find("invites", inviteId, "Invite");
  if (record.getString("team") !== manager.getString("team")) throw new NotFoundError("Invite not found");
  $app.delete(record);
  audit.record($app, { team: record.getString("team"), actor: user.getString("email"), action: "invite.revoked", target: `invites/${record.id}`, detail: record.getString("email") });
}

function owners(teamId) {
  return $app.countRecords("members", $dbx.hashExp({ team: teamId, role: "owner" }));
}

function changeRole(actor, user, memberId, role) {
  if (!["owner", "admin", "member"].includes(role)) throw new BadRequestError("Choose owner, admin or member.");
  const target = find("members", memberId, "Member");
  if (target.getString("team") !== actor.getString("team")) throw new NotFoundError("Member not found");
  if (actor.getString("role") !== "owner") throw new ForbiddenError("Only owners can change roles.");
  if (target.getString("role") === "owner" && role !== "owner" && owners(target.getString("team")) === 1) {
    throw new BadRequestError("A team needs at least one owner.");
  }
  const previous = target.getString("role");
  target.set("role", role);
  $app.save(target);
  audit.record($app, { team: target.getString("team"), actor: user.getString("email"), action: "member.role", target: `members/${target.id}`, detail: `${previous} → ${role}` });
  return target;
}

function remove(actor, user, memberId) {
  const target = find("members", memberId, "Member");
  const teamId = target.getString("team");
  if (teamId !== actor.getString("team")) throw new NotFoundError("Member not found");
  const self = target.id === actor.id;
  if (!self) {
    requireManager(actor);
    if (target.getString("role") === "owner" && actor.getString("role") !== "owner") throw new ForbiddenError("Only owners can remove an owner.");
  }
  if (target.getString("role") === "owner" && owners(teamId) === 1) throw new BadRequestError("A team needs at least one owner. Make someone else owner first.");
  $app.delete(target);
  audit.record($app, { team: teamId, actor: user.getString("email"), action: self ? "member.left" : "member.removed", target: `members/${target.id}`, detail: "" });
  return self;
}

module.exports = { ID, MANAGERS, find, membership, requireManager, teamsFor, create, invite, accept, revoke, changeRole, remove };
