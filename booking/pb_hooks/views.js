const icons = require(`${__hooks}/zen.js`);

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

const HEAD = `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="htmx-config" content='{"responseHandling":[{"code":"204","swap":false},{"code":"[23]..","swap":true},{"code":"422","swap":true},{"code":"[45]..","swap":false,"error":true}]}'>
  <link rel="stylesheet" href="/zen.css">
  <link rel="stylesheet" href="/style.css">
  <script src="/htmx.min.js"></script>`;

const message = (tone, icon, text) => `<div class="zen-inline-message" data-tone="${tone}" role="${tone === "negative" ? "alert" : "status"}"><div class="zen-inline-message__container"><span class="zen-inline-message__icon" aria-hidden="true">${icon}</span><div class="zen-inline-message__content"><div class="zen-inline-message__text"><span class="zen-inline-message__caption zen-type-body-small-regular">${text}</span></div></div></div></div>`;

const field = (id, label, control) => `<div class="zen-input-field" data-size="large" data-state="default">
  <span class="zen-input-label zen-type-body-small-regular" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="${id}">${label}</label></span></span>
  <div class="zen-input__control">${control}</div>
</div>`;

const step = (number, title) => `<legend class="step-title"><span class="step-number zen-type-body-small-bold" aria-hidden="true">${number}</span><span class="zen-text zen-type-body-extra-bold" data-tone="strongest">${title}</span></legend>`;

const TIMES = `{{if .times}}<div class="times">{{range .times}}<label class="time"><input type="radio" name="time" value="{{.value}}" required><span class="zen-type-body-base-medium">{{.label}}</span></label>{{end}}</div>
{{else}}<p class="no-times zen-text zen-type-body-base-regular" data-tone="base">No times left on this day. Pick another day.</p>{{end}}`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  ${HEAD}
  <title>Book a time · {{.site}}</title>
  <meta name="description" content="Pick a service and a time that suits you.">
</head>
<body>
  <div class="zen-provider site" data-paint="true" data-component-theme="brand-s1">
    <header class="topbar"><div class="wrap topbar-row"><a class="brand" href="/"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a></div></header>
    <main class="wrap booking-page">
      <div class="intro">
        <span class="zen-badge" data-size="medium" data-tone="accent" data-background="subtle"><span class="zen-badge__text zen-type-body-base-medium">Book online</span></span>
        <h1 class="zen-text zen-heading zen-type-display-3" data-tone="strongest">Book a time with {{.site}}</h1>
        <p class="zen-text zen-type-body-extra-regular" data-tone="base">Pick a service and a time that suits you. You'll get a confirmation by email right away.</p>
        <ul class="facts">
          <li class="zen-text zen-type-body-base-medium" data-tone="base">${icons.calendar}Instant confirmation</li>
          <li class="zen-text zen-type-body-base-medium" data-tone="base">${icons.clock}Times shown in {{.zone}}</li>
          <li class="zen-text zen-type-body-base-medium" data-tone="base">${icons.mail}Reply to the email to reschedule</li>
        </ul>
      </div>
      <div class="zen-card booking-card" data-tone="shadow" data-spacing="large" id="booking-panel"><div class="zen-card__content">
        {{if .services}}<form id="booking" class="booking-form" hx-post="/book" hx-target="#booking-panel" hx-swap="innerHTML">
          <fieldset class="step">
            ${step(1, "Choose a service")}
            <div class="services">{{range $index, $service := .services}}<label class="service"><input type="radio" class="pick" name="service" value="{{$service.id}}" {{if eq $index 0}}checked{{end}}>
              <span class="service-body">
                <span class="service-row"><span class="zen-text zen-type-body-base-bold" data-tone="strongest">{{$service.name}}</span><span class="zen-text zen-type-body-base-medium" data-tone="strongest">{{$service.price}}</span></span>
                <span class="service-meta zen-text zen-type-body-small-regular" data-tone="base">${icons.clock}{{$service.minutes}} min</span>
                {{if $service.description}}<span class="zen-text zen-type-body-small-regular" data-tone="light">{{$service.description}}</span>{{end}}
              </span>
            </label>{{end}}</div>
          </fieldset>
          <fieldset class="step">
            ${step(2, "Pick a day")}
            <div class="days">{{range $index, $day := .days}}<label class="day"><input type="radio" class="pick" name="date" value="{{$day.key}}" {{if $day.selected}}checked{{end}}><span><small class="zen-type-body-small-medium">{{$day.weekday}}</small><strong class="zen-type-heading-4">{{$day.date}}</strong><small class="zen-type-body-small-regular">{{$day.month}}</small></span></label>{{end}}</div>
          </fieldset>
          <fieldset class="step">
            ${step(3, "Pick a time")}
            <div id="times" hx-target="this" hx-swap="innerHTML" hx-get="/book/times" hx-trigger="change from:.pick, times-changed from:body" hx-include="[name=service],[name=date]" aria-live="polite">{{raw .times}}</div>
          </fieldset>
          <fieldset class="step">
            ${step(4, "Your details")}
            <div class="details">
              <div class="pair">
                ${field("name", "Name", '<input id="name" class="zen-input__native zen-type-body-base-medium" name="name" autocomplete="name" maxlength="100" required>')}
                ${field("email", "Email", '<input id="email" class="zen-input__native zen-type-body-base-medium" name="email" type="email" autocomplete="email" maxlength="254" required>')}
              </div>
              ${field("notes", "Anything we should know? (optional)", '<textarea id="notes" class="zen-input__native zen-input__native--textarea zen-type-body-base-medium" name="notes" rows="3" maxlength="1000"></textarea>')}
              <div class="trap" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
              <div id="booking-error"></div>
              <button type="submit" class="zen-button confirm" data-size="lg" data-appearance="main" data-level="primary" data-variant="primary"><span class="zen-button__label zen-type-button-label-l">Confirm booking</span></button>
            </div>
          </fieldset>
        </form>
        {{else}}<section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">Booking opens soon</h3><p class="zen-empty-state__caption zen-type-body-base-regular">Add a service in your PocketBase and tick <strong>active</strong>.</p></div></div></section>{{end}}
      </div></div>
    </main>
    <footer class="footer"><div class="wrap footer-row"><span class="zen-text zen-type-body-small-regular" data-tone="light">© {{.year}} {{.site}}</span><span class="zen-text zen-type-body-small-regular" data-tone="light">Powered by PocketBase</span></div></footer>
  </div>
</body>
</html>`;

const BOOKED = `<div class="booked">
  <span class="booked-icon" aria-hidden="true">${icons.checkCircle}</span>
  <h2 class="zen-text zen-heading zen-type-heading-2" data-tone="strongest">You're booked</h2>
  <p class="zen-text zen-type-body-base-regular" data-tone="base">We sent the details to <strong>{{.email}}</strong>.</p>
  <dl class="summary">
    <div><dt class="zen-type-body-small-regular">Service</dt><dd class="zen-type-body-base-medium">{{.service}} · {{.minutes}} min</dd></div>
    <div><dt class="zen-type-body-small-regular">When</dt><dd class="zen-type-body-base-medium">{{.day}}, {{.time}}</dd></div>
    <div><dt class="zen-type-body-small-regular">Price</dt><dd class="zen-type-body-base-medium">{{.price}}</dd></div>
  </dl>
  <a class="zen-button" data-size="md" data-appearance="main" data-level="secondary" data-variant="secondary" href="/"><span class="zen-button__label zen-type-button-label-m">Book another time</span></a>
</div>`;

const ERROR = message("negative", icons.alert, "{{.text}}");

const EMAIL_BODY = `<p>Hi {{.name}},</p>
<p>Your <strong>{{.service}}</strong> ({{.minutes}} min) with {{.site}} is booked for <strong>{{.day}} at {{.time}}</strong> ({{.zone}}).</p>
{{if .notes}}<p>Your notes: {{.notes}}</p>{{end}}
<p>Need to change it? Reply to this email.</p>
<p>See you then,<br>{{.site}}</p>`;

const STAFF_PAGE = `<!doctype html>
<html lang="en">
<head>
  ${HEAD}
  <title>Schedule · {{.site}}</title>
  <meta name="robots" content="noindex">
  <script type="module" src="/staff.js"></script>
</head>
<body>
  <template id="alert-icon">${icons.alert}</template>
  <div class="zen-provider site" data-paint="true" data-component-theme="brand-s1">
    <section id="signin" class="auth" hidden>
      <div class="zen-card auth-card" data-tone="shadow" data-spacing="large"><div class="zen-card__content">
        <div class="auth-heading">
          <span class="mark" aria-hidden="true"></span>
          <h1 class="zen-text zen-heading zen-type-heading-2" data-tone="strongest">Staff sign in</h1>
          <p class="zen-text zen-type-body-base-regular" data-tone="base">Staff accounts are added by an admin in PocketBase.</p>
        </div>
        <form id="signin-form" class="stack">
          ${field("staff-email", "Email", '<input id="staff-email" class="zen-input__native zen-type-body-base-medium" name="email" type="email" autocomplete="username" required>')}
          ${field("staff-password", "Password", '<input id="staff-password" class="zen-input__native zen-type-body-base-medium" name="password" type="password" autocomplete="current-password" required>')}
          <div class="error-slot"></div>
          <button type="submit" class="zen-button" data-size="lg" data-appearance="main" data-level="primary" data-variant="primary"><span class="zen-button__label zen-type-button-label-l">Sign in</span></button>
        </form>
      </div></div>
    </section>
    <div id="workspace" hidden>
      <header class="topbar"><div class="wrap topbar-row">
        <a class="brand" href="/staff"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a>
        <div class="account"><span id="who" class="zen-text zen-type-body-small-regular" data-tone="base"></span>
          <button id="signout" type="button" class="zen-button" data-size="sm" data-appearance="main" data-level="secondary" data-variant="secondary"><span class="zen-button__icon" aria-hidden="true">${icons.logOut}</span><span class="zen-button__label zen-type-button-label-s">Sign out</span></button></div>
      </div></header>
      <main class="wrap staff-page">
        <header class="zen-page-header"><div class="zen-page-header__row"><div class="zen-page-header__titles"><h1 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Schedule</h1></div></div><p class="zen-text zen-type-body-base-regular zen-page-header__description" data-tone="base">Confirmed bookings for the next ${DAYS_AHEAD} days, in {{.zone}}.</p></header>
        <div class="error-slot"></div>
        <div id="schedule" hx-get="/staff/schedule" hx-trigger="signed-in from:body, bookings-changed from:body"></div>
      </main>
    </div>
  </div>
</body>
</html>`;

const SCHEDULE = `{{if .days}}{{range .days}}<section class="agenda-day">
  <h2 class="agenda-date zen-text zen-type-body-extra-bold" data-tone="strongest">{{.label}} <span class="zen-text zen-type-body-small-regular" data-tone="light">{{.count}}</span></h2>
  <ul class="agenda">{{range .bookings}}<li class="zen-card agenda-item" data-tone="shadow" data-spacing="medium" id="booking-{{.id}}"><div class="zen-card__content agenda-row">
    <span class="agenda-time"><strong class="zen-type-body-base-bold">{{.time}}</strong><span class="zen-type-body-small-regular">{{.minutes}} min</span></span>
    <span class="agenda-who"><span class="zen-text zen-type-body-base-medium" data-tone="strongest">{{.name}} · {{.service}}</span><a class="zen-link zen-type-body-small-regular" data-tone="hyperlink" data-underline="hover" href="mailto:{{.email}}">{{.email}}</a>{{if .notes}}<span class="zen-text zen-type-body-small-regular agenda-notes" data-tone="base">{{.notes}}</span>{{end}}</span>
    <button type="button" class="zen-button" data-size="sm" data-appearance="main" data-level="secondary" data-variant="secondary" hx-patch="/staff/bookings/{{.id}}/cancel" hx-confirm="Cancel this booking with {{.name}}?" hx-swap="none"><span class="zen-button__label zen-type-button-label-s">Cancel</span></button>
  </div></li>{{end}}</ul>
</section>{{end}}
{{else}}<section class="zen-empty-state"><div class="zen-empty-state__body"><div class="zen-empty-state__content"><h3 class="zen-empty-state__title zen-type-heading-4">No bookings yet</h3><p class="zen-empty-state__caption zen-type-body-base-regular">New bookings appear here as soon as they are made.</p></div></div></section>{{end}}`;

function render(template, data) {
  return $template.loadString(template).render(data);
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
  return render(TIMES, { times: freeSlots($app, activeService($app, serviceId), key) });
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
      html: render(EMAIL_BODY, details),
    });
    $app.newMailClient().send(mail);
  } catch (error) {
    $app.logger().warn("booking confirmation email failed", "error", String(error));
  }
}

function refusal(text, refreshTimes) {
  return { status: 422, html: render(ERROR, { text }), retarget: "#booking-error", refreshTimes };
}

module.exports = {
  times,

  page() {
    const records = $app.findRecordsByFilter("services", "active = true", "sort,name", 50, 0);
    const days = openDays();
    const first = records.length > 0 ? days.find((day) => freeSlots($app, records[0], day.key).length > 0) || days[0] : null;
    return render(PAGE, {
      site: siteName(),
      year: new Date().getFullYear(),
      zone: zone(),
      services: records.map(serviceData),
      days: days.map((day) => ({ ...day, selected: first && day.key === first.key })),
      times: first ? times(records[0].id, first.key) : "",
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
    return { status: 200, html: render(BOOKED, details) };
  },

  staffPage() {
    return render(STAFF_PAGE, { site: siteName(), zone: zone() });
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
    return render(SCHEDULE, { days });
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
