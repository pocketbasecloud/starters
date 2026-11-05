const VIEWS = `${__hooks}/views`;
const UTC_OFFSET_MINUTES = 0;
const OPEN_DAYS = [1, 2, 3, 4, 5];
const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const STEP_MINUTES = 30;
const DAYS_AHEAD = 21;
const NOTICE_MINUTES = 120;
const CURRENCY_SYMBOL = "$";
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;

const DAY_MS = 86400000;
const OFFSET_MS = UTC_OFFSET_MINUTES * 60000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function render(files, data) {
  return $template.loadFiles(...[...files, "icons.html"].map((file) => `${VIEWS}/${file}`)).render(data);
}

function page(name, title, data) {
  return render(["layout.html", `pages/${name}.html`, "partials/times.html"], { ...data, title, site: siteName(), year: new Date().getFullYear() });
}

function siteName() {
  return $app.settings().meta.appName || "Bookings";
}

function zone() {
  if (UTC_OFFSET_MINUTES === 0) return "UTC";
  const sign = UTC_OFFSET_MINUTES > 0 ? "+" : "-";
  const minutes = Math.abs(UTC_OFFSET_MINUTES);
  return `UTC${sign}${Math.floor(minutes / 60)}${minutes % 60 ? `:${String(minutes % 60).padStart(2, "0")}` : ""}`;
}

function money(cents) {
  if (!cents) return "Free";
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${CURRENCY_SYMBOL}${whole}${cents % 100 ? `.${String(cents % 100).padStart(2, "0")}` : ""}`;
}

function local(utcMs) {
  return new Date(utcMs + OFFSET_MS);
}

function dbDate(utcMs) {
  return new Date(utcMs).toISOString().replace("T", " ");
}

function parseDbDate(value) {
  return Date.parse(value.replace(" ", "T"));
}

function timeLabel(utcMs) {
  const at = local(utcMs);
  const hours = at.getUTCHours();
  return `${hours % 12 || 12}:${String(at.getUTCMinutes()).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

function dayLabel(utcMs) {
  const at = local(utcMs);
  return `${WEEKDAYS_LONG[at.getUTCDay()]} ${at.getUTCDate()} ${MONTHS_LONG[at.getUTCMonth()]}`;
}

function dayKey(localMidnight) {
  return new Date(localMidnight).toISOString().slice(0, 10);
}

function openDays() {
  const today = local(Date.now());
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = [];
  for (let index = 0; index < DAYS_AHEAD; index++) {
    const midnight = start + index * DAY_MS;
    const at = new Date(midnight);
    if (!OPEN_DAYS.includes(at.getUTCDay())) continue;
    days.push({ key: dayKey(midnight), midnight, weekday: WEEKDAYS[at.getUTCDay()], date: at.getUTCDate(), month: MONTHS[at.getUTCMonth()] });
  }
  return days;
}

function activeService(app, id) {
  if (!id) return null;
  try {
    const service = app.findRecordById("services", id);
    return service.getBool("active") ? service : null;
  } catch {
    return null;
  }
}

function freeSlots(app, service, key) {
  const day = openDays().find((candidate) => candidate.key === key);
  if (!service || !day) return [];
  const length = service.getInt("minutes") * 60000;
  const first = day.midnight + OPEN_HOUR * 3600000 - OFFSET_MS;
  const close = day.midnight + CLOSE_HOUR * 3600000 - OFFSET_MS;
  const busy = app
    .findRecordsByFilter("bookings", "status = 'confirmed' && starts < {:to} && ends > {:from}", "starts", 500, 0, { from: dbDate(first), to: dbDate(close) })
    .map((booking) => [parseDbDate(booking.getString("starts")), parseDbDate(booking.getString("ends"))]);
  const earliest = Date.now() + NOTICE_MINUTES * 60000;
  const slots = [];
  for (let start = first; start + length <= close; start += STEP_MINUTES * 60000) {
    if (start < earliest) continue;
    if (busy.some(([from, to]) => start < to && start + length > from)) continue;
    slots.push({ value: new Date(start).toISOString(), label: timeLabel(start), start });
  }
  return slots;
}

function serviceData(service) {
  return { id: service.id, name: service.getString("name"), minutes: service.getInt("minutes"), price: money(service.getInt("price")), description: service.getString("description") };
}

function times(serviceId, key) {
  return render(["partials/times.html"], { times: freeSlots($app, activeService($app, serviceId), key) });
}

function text(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function sendConfirmation(details) {
  const settings = $app.settings();
  try {
    const mail = new MailerMessage({
      from: { address: settings.meta.senderAddress, name: settings.meta.senderName || details.site },
      to: [{ address: details.email, name: details.name }],
      subject: `Booked: ${details.service} on ${details.day} at ${details.time}`,
      html: render(["emails/booking-confirmed.html"], details),
    });
    $app.newMailClient().send(mail);
  } catch (error) {
    $app.logger().warn("booking confirmation email failed", "error", String(error));
  }
}

function refusal(text, refreshTimes) {
  return { status: 422, html: render(["partials/error.html"], { text }), retarget: "#booking-error", refreshTimes };
}

module.exports = {
  times,

  page() {
    const records = $app.findRecordsByFilter("services", "active = true", "sort,name", 50, 0);
    const days = openDays();
    const first = records.length > 0 ? days.find((day) => freeSlots($app, records[0], day.key).length > 0) || days[0] : null;
    return page("book", `Book a time · ${siteName()}`, {
      zone: zone(),
      services: records.map(serviceData),
      days: days.map((day) => ({ ...day, selected: first && day.key === first.key })),
      times: first ? freeSlots($app, records[0], first.key) : [],
    });
  },

  book(body) {
    const name = text(body.name, 100);
    const email = text(body.email, 300).toLowerCase();
    const notes = text(body.notes, 1000);
    const startIso = text(body.time, 40);
    if (!name || email.length > 254 || !EMAIL.test(email)) return refusal("Enter your name and a valid email.");
    if (!startIso) return refusal("Pick a time.");
    let booked = null;
    $app.runInTransaction((txApp) => {
      const service = activeService(txApp, text(body.service, 30));
      const slot = freeSlots(txApp, service, text(body.date, 10)).find((candidate) => candidate.value === startIso);
      if (!slot) return;
      const booking = new Record(txApp.findCollectionByNameOrId("bookings"));
      booking.set("service", service.id);
      booking.set("name", name);
      booking.set("email", email);
      booking.set("notes", notes);
      booking.set("starts", dbDate(slot.start));
      booking.set("ends", dbDate(slot.start + service.getInt("minutes") * 60000));
      booking.set("status", "confirmed");
      if (text(body.website, 200) === "") txApp.save(booking);
      booked = { ...serviceData(service), start: slot.start };
    });
    if (!booked) return refusal("That time was just taken. Pick another one.", true);
    const details = {
      site: siteName(),
      zone: zone(),
      name,
      email,
      notes,
      service: booked.name,
      minutes: booked.minutes,
      price: booked.price,
      day: dayLabel(booked.start),
      time: timeLabel(booked.start),
    };
    if (text(body.website, 200) === "") sendConfirmation(details);
    return { status: 200, html: render(["partials/booked.html"], details) };
  },

  staffPage() {
    return page("staff", `Schedule · ${siteName()}`, { zone: zone(), daysAhead: DAYS_AHEAD });
  },

  schedule() {
    const now = Date.now();
    const records = $app.findRecordsByFilter(
      "bookings",
      "status = 'confirmed' && ends > {:from} && starts < {:to}",
      "starts",
      500,
      0,
      { from: dbDate(now), to: dbDate(now + DAYS_AHEAD * DAY_MS) },
    );
    const services = {};
    for (const service of $app.findRecordsByFilter("services", "", "", 200, 0)) services[service.id] = service;
    const days = [];
    for (const booking of records) {
      const start = parseDbDate(booking.getString("starts"));
      const label = dayLabel(start);
      if (days.length === 0 || days[days.length - 1].label !== label) days.push({ label, bookings: [] });
      const service = services[booking.getString("service")];
      days[days.length - 1].bookings.push({
        id: booking.id,
        time: timeLabel(start),
        minutes: Math.round((parseDbDate(booking.getString("ends")) - start) / 60000),
        name: booking.getString("name"),
        email: booking.getString("email"),
        notes: booking.getString("notes"),
        service: service ? service.getString("name") : "Service",
      });
    }
    for (const day of days) day.count = `${day.bookings.length} booking${day.bookings.length === 1 ? "" : "s"}`;
    return render(["partials/schedule.html"], { days });
  },

  cancel(id) {
    let booking;
    try {
      booking = $app.findRecordById("bookings", id);
    } catch {
      throw new NotFoundError("Booking not found");
    }
    booking.set("status", "cancelled");
    $app.save(booking);
  },
};
