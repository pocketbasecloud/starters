function displayName(user) {
  return user.getString("name") || user.getString("email").split("@")[0];
}

function ensureProfile(app, user) {
  try {
    return app.findFirstRecordByData("profiles", "user", user.id);
  } catch {
    const profile = new Record(app.findCollectionByNameOrId("profiles"));
    profile.set("user", user.id);
    profile.set("display_name", displayName(user).slice(0, 60));
    app.save(profile);
    return profile;
  }
}

function names(app, userIds) {
  const result = {};
  if (userIds.length === 0) return result;
  for (const profile of app.findRecordsByFilter("profiles", userIds.map((_, index) => `user = {:u${index}}`).join(" || "), "", userIds.length, 0, Object.fromEntries(userIds.map((id, index) => [`u${index}`, id])))) {
    result[profile.getString("user")] = profile.getString("display_name");
  }
  for (const id of userIds) if (!result[id]) result[id] = "Someone";
  return result;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
}

function hueOf(text) {
  let hash = 0;
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}

module.exports = { displayName, ensureProfile, names, initials, hueOf };
