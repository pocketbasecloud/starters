const DEFAULTS = { offset: 0, slot: 30, daysAhead: 21, notice: 120, currencySymbol: "$" };

function current(app) {
  try {
    const record = (app || $app).findFirstRecordByFilter("settings", "id != ''");
    return {
      offset: record.getInt("utc_offset_minutes"),
      slot: record.getInt("slot_minutes") || DEFAULTS.slot,
      daysAhead: record.getInt("days_ahead") || DEFAULTS.daysAhead,
      notice: record.getInt("notice_minutes"),
      currencySymbol: record.getString("currency_symbol") || DEFAULTS.currencySymbol,
    };
  } catch {
    return DEFAULTS;
  }
}

function zone(config) {
  if (config.offset === 0) return "UTC";
  const minutes = Math.abs(config.offset);
  const rest = minutes % 60 ? `:${String(minutes % 60).padStart(2, "0")}` : "";
  return `UTC${config.offset > 0 ? "+" : "-"}${Math.floor(minutes / 60)}${rest}`;
}

function money(cents, config) {
  if (!cents) return "Free";
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${config.currencySymbol}${whole}${cents % 100 ? `.${String(cents % 100).padStart(2, "0")}` : ""}`;
}

module.exports = { current, zone, money };
