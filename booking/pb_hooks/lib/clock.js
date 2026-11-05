const DAY_MS = 86400000;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function local(utcMs, config) {
  return new Date(utcMs + config.offset * 60000);
}

function dbDate(utcMs) {
  return new Date(utcMs).toISOString().replace("T", " ");
}

function parseDbDate(value) {
  return Date.parse(value.replace(" ", "T"));
}

function minutesOf(clockText) {
  const [hours, minutes] = clockText.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeLabel(utcMs, config) {
  const at = local(utcMs, config);
  const hours = at.getUTCHours();
  return `${hours % 12 || 12}:${String(at.getUTCMinutes()).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

function dayLabel(utcMs, config) {
  const at = local(utcMs, config);
  return `${LONG_DAYS[at.getUTCDay()]} ${at.getUTCDate()} ${LONG_MONTHS[at.getUTCMonth()]}`;
}

function days(config) {
  const today = local(Date.now(), config);
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: config.daysAhead }, (_, index) => {
    const midnight = start + index * DAY_MS;
    const at = new Date(midnight);
    return {
      key: at.toISOString().slice(0, 10),
      midnight,
      weekday: WEEKDAYS[at.getUTCDay()],
      short: SHORT_DAYS[at.getUTCDay()],
      date: at.getUTCDate(),
      month: SHORT_MONTHS[at.getUTCMonth()],
    };
  });
}

function utcAt(day, clockText, config) {
  return day.midnight + minutesOf(clockText) * 60000 - config.offset * 60000;
}

module.exports = { DAY_MS, dbDate, parseDbDate, timeLabel, dayLabel, days, utcAt };
