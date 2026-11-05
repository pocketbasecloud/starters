const DEFAULTS = { maxMembers: 20, retentionDays: 0 };

function current(app) {
  try {
    const record = (app || $app).findFirstRecordByFilter("settings", "id != ''");
    return { maxMembers: record.getInt("max_members") || DEFAULTS.maxMembers, retentionDays: record.getInt("retention_days") };
  } catch {
    return DEFAULTS;
  }
}

module.exports = { current };
