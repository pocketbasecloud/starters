const audit = require(`${__hooks}/lib/audit.js`);
const availability = require(`${__hooks}/lib/availability.js`);
const clock = require(`${__hooks}/lib/clock.js`);
const mail = require(`${__hooks}/lib/mail.js`);
const settings = require(`${__hooks}/lib/settings.js`);

const VIEWS = `${__hooks}/views`;
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;

function render(files, data) {
  return $template.loadFiles(...[...files, "icons.html"].map((file) => `${VIEWS}/${file}`)).render(data);
}

function siteName() {
  return $app.settings().meta.appName || "Bookings";
}

function page(name, title, data) {
  return render(["layout.html", `pages/${name}.html`, "partials/times.html"], { ...data, title, site: siteName(), year: new Date().getFullYear() });
}

function text(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function staffData(member) {
  const name = member.getString("name");
  return { id: member.id, name, title: member.getString("title"), initials: initials(name) };
}

function serviceData(service, config) {
  return {
    id: service.id,
    name: service.getString("name"),
    minutes: service.getInt("minutes"),
    price: settings.money(service.getInt("price"), config),
    description: service.getString("description"),
  };
}

function timesData(app, config, serviceId, choice, key) {
  const service = availability.activeService(app, serviceId);
  if (!service) return { times: [], reason: "Pick a service." };
  const staffChoice = /^[a-z0-9]{15}$/.test(choice || "") ? choice : "";
  if (staffChoice && availability.eligibleStaff(app, service, staffChoice).length === 0) {
    return { times: [], reason: "This person doesn't offer that service. Pick someone else or anyone available." };
  }
  const times = availability.freeSlots(app, config, service, staffChoice, key);
  return { times, reason: times.length ? "" : "No times left on this day. Pick another day." };
}

function refusal(text, refreshTimes) {
  return { status: 422, html: render(["partials/error.html"], { text }), retarget: "#booking-error", refreshTimes };
}

function staffName(app, id) {
  try {
    return app.findRecordById("staff", id).getString("name");
  } catch {
    return "";
  }
}

module.exports = {
  page() {
    const config = settings.current();
    const services = $app.findRecordsByFilter("services", "active = true", "sort,name", 50, 0);
    const days = availability.openDays($app, config);
    const first = services.length > 0
      ? days.find((day) => availability.freeSlots($app, config, services[0], "", day.key).length > 0) || days[0]
      : null;
    return page("book", `Book a time · ${siteName()}`, {
      zone: settings.zone(config),
      services: services.map((service) => serviceData(service, config)),
      staff: availability.activeStaff($app).map(staffData),
      days: days.map((day) => ({ ...day, selected: first && day.key === first.key })),
      ...(first ? timesData($app, config, services[0].id, "", first.key) : { times: [], reason: "" }),
    });
  },

  times(serviceId, choice, key) {
    return render(["partials/times.html"], timesData($app, settings.current(), serviceId, choice, key));
  },

  book(body) {
    const name = text(body.name, 100);
    const email = text(body.email, 300).toLowerCase();
    const notes = text(body.notes, 1000);
    const startIso = text(body.time, 40);
    const choice = text(body.staff, 15);
    const isBot = text(body.website, 200) !== "";
    if (!name || email.length > 254 || !EMAIL.test(email)) return refusal("Enter your name and a valid email.");
    if (!startIso) return refusal("Pick a time.");
    const config = settings.current();
    const staffChoice = /^[a-z0-9]{15}$/.test(choice) ? choice : "";
    let booked = null;
    let unavailable = "";
    $app.runInTransaction((txApp) => {
      const service = availability.activeService(txApp, text(body.service, 15));
      if (!service) {
        unavailable = "That service isn't available. Pick another one.";
        return;
      }
      if (staffChoice && availability.eligibleStaff(txApp, service, staffChoice).length === 0) {
        unavailable = "That person isn't available for this service. Pick someone else or anyone available.";
        return;
      }
      const slot = availability.freeSlots(txApp, config, service, staffChoice, text(body.date, 10))
        .find((candidate) => candidate.value === startIso);
      if (!slot) return;
      const staffId = slot.staff[0];
      booked = { service, staffId, start: slot.start, end: slot.start + service.getInt("minutes") * 60000 };
      if (isBot) return;
      const booking = new Record(txApp.findCollectionByNameOrId("bookings"));
      booking.set("service", service.id);
      booking.set("staff", staffId);
      booking.set("name", name);
      booking.set("email", email);
      booking.set("notes", notes);
      booking.set("starts", clock.dbDate(booked.start));
      booking.set("ends", clock.dbDate(booked.end));
      booking.set("status", "confirmed");
      txApp.save(booking);
      audit.record(txApp, { actor: email, action: "booking.created", target: `bookings/${booking.id}`, detail: `${service.getString("name")} on ${clock.dayLabel(booked.start, config)} at ${clock.timeLabel(booked.start, config)}` });
    });
    if (unavailable) return refusal(unavailable, true);
    if (!booked) return refusal("That time was just taken. Pick another one.", true);
    const details = {
      site: siteName(),
      zone: settings.zone(config),
      name,
      email,
      notes,
      ...serviceData(booked.service, config),
      service: booked.service.getString("name"),
      staff: staffName($app, booked.staffId),
      day: clock.dayLabel(booked.start, config),
      time: clock.timeLabel(booked.start, config),
    };
    if (!isBot) {
      mail.send($app, {
        to: email,
        name,
        subject: `Booked: ${details.service} on ${details.day} at ${details.time}`,
        html: render(["emails/booking-confirmed.html"], details),
      });
    }
    return { status: 200, html: render(["partials/booked.html"], details) };
  },

  staffPage() {
    const config = settings.current();
    return page("staff", `Schedule · ${siteName()}`, { zone: settings.zone(config), daysAhead: config.daysAhead });
  },

  schedule(staffId, scope) {
    const config = settings.current();
    const now = Date.now();
    const mine = scope !== "all";
    const records = $app.findRecordsByFilter(
      "bookings",
      `status = 'confirmed' && ends > {:from} && starts < {:to}${mine ? " && staff = {:staff}" : ""}`,
      "starts",
      500,
      0,
      { from: clock.dbDate(now), to: clock.dbDate(now + config.daysAhead * clock.DAY_MS), staff: staffId },
    );
    const services = {};
    for (const service of $app.findRecordsByFilter("services", "", "", 200, 0)) services[service.id] = service.getString("name");
    const people = {};
    for (const member of $app.findRecordsByFilter("staff", "", "", 200, 0)) people[member.id] = member.getString("name");
    const days = [];
    for (const booking of records) {
      const start = clock.parseDbDate(booking.getString("starts"));
      const label = clock.dayLabel(start, config);
      if (days.length === 0 || days[days.length - 1].label !== label) days.push({ label, bookings: [] });
      days[days.length - 1].bookings.push({
        id: booking.id,
        time: clock.timeLabel(start, config),
        minutes: Math.round((clock.parseDbDate(booking.getString("ends")) - start) / 60000),
        name: booking.getString("name"),
        email: booking.getString("email"),
        notes: booking.getString("notes"),
        service: services[booking.getString("service")] || "Service",
        staff: mine ? "" : people[booking.getString("staff")] || "",
      });
    }
    for (const day of days) day.count = `${day.bookings.length} booking${day.bookings.length === 1 ? "" : "s"}`;
    return render(["partials/schedule.html"], { days, mine });
  },

  cancel(id, actor) {
    let booking;
    try {
      booking = $app.findRecordById("bookings", id);
    } catch {
      throw new NotFoundError("Booking not found");
    }
    if (booking.getString("status") === "cancelled") return;
    booking.set("status", "cancelled");
    $app.save(booking);
    audit.record($app, { actor, action: "booking.cancelled", target: `bookings/${booking.id}`, detail: `Booking for ${booking.getString("name")} cancelled` });
  },
};
