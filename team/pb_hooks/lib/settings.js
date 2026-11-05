const DEFAULTS = { inviteDays: 7, maxMembers: 50 };

function current(app) {
  try {
    const record = (app || $app).findFirstRecordByFilter("settings", "id != ''");
    return { inviteDays: record.getInt("invite_days") || DEFAULTS.inviteDays, maxMembers: record.getInt("max_members") || DEFAULTS.maxMembers };
  } catch {
    return DEFAULTS;
  }
}

module.exports = { current };
