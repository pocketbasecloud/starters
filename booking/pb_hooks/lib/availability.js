const clock = require(`${__hooks}/lib/clock.js`);

const ID = /^[a-z0-9]{15}$/;

function activeStaff(app) {
  return app.findRecordsByFilter("staff", "active = true", "name", 200, 0);
}

function activeService(app, id) {
  if (!ID.test(id || "")) return null;
  try {
    const service = app.findRecordById("services", id);
    return service.getBool("active") ? service : null;
  } catch {
    return null;
  }
}

function eligibleStaff(app, service, choice) {
  const offered = service.getStringSlice("staff");
  return activeStaff(app).filter((member) =>
    (offered.length === 0 || offered.includes(member.id)) && (!choice || member.id === choice));
}

function openDays(app, config) {
  const working = new Set(app.findRecordsByFilter("shifts", "staff.active = true", "", 2000, 0).map((shift) => shift.getString("weekday")));
  return clock.days(config).filter((day) => working.has(day.weekday));
}

function freeSlots(app, config, service, choice, key) {
  if (!service) return [];
  const day = clock.days(config).find((candidate) => candidate.key === key);
  if (!day) return [];
  const length = service.getInt("minutes") * 60000;
  const step = config.slot * 60000;
  const earliest = Date.now() + config.notice * 60000;
  const slots = new Map();
  for (const member of eligibleStaff(app, service, choice)) {
    const shifts = app.findRecordsByFilter("shifts", "staff = {:staff} && weekday = {:weekday}", "start", 20, 0, { staff: member.id, weekday: day.weekday });
    if (shifts.length === 0) continue;
    const busy = app
      .findRecordsByFilter("bookings", "staff = {:staff} && status = 'confirmed' && starts < {:to} && ends > {:from}", "starts", 500, 0, {
        staff: member.id,
        from: clock.dbDate(day.midnight - clock.DAY_MS),
        to: clock.dbDate(day.midnight + 2 * clock.DAY_MS),
      })
      .map((booking) => [clock.parseDbDate(booking.getString("starts")), clock.parseDbDate(booking.getString("ends"))]);
    for (const shift of shifts) {
      const open = clock.utcAt(day, shift.getString("start"), config);
      const close = clock.utcAt(day, shift.getString("end"), config);
      for (let start = open; start + length <= close; start += step) {
        if (start < earliest) continue;
        if (busy.some(([from, to]) => start < to && start + length > from)) continue;
        if (!slots.has(start)) slots.set(start, []);
        if (!slots.get(start).includes(member.id)) slots.get(start).push(member.id);
      }
    }
  }
  return [...slots.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, staff]) => ({ value: new Date(start).toISOString(), label: clock.timeLabel(start, config), start, staff }));
}

module.exports = { activeStaff, activeService, eligibleStaff, openDays, freeSlots };
