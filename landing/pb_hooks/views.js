const icons = require(`${__hooks}/zen.js`);

const HEADLINE = "Ship the thing your customers keep asking for";
const PITCH = "A short sentence on what you are building and who it is for. Join the waitlist and be first in when we open the doors.";
const SOCIAL_PROOF_FROM = 25;
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;

const FEATURES = [
  [icons.lightning, "Fast from day one", "Pages render on the server and arrive ready to read. No spinners, no layout jumps."],
  [icons.shield, "Private by default", "Sign-ups and messages are stored in your own PocketBase. Nobody else can read them."],
  [icons.globe, "Works everywhere", "Phones, tablets and wide screens get the same careful layout."],
];

const STEPS = [
  ["Join the list", "Leave your email. It takes five seconds and you can leave any time."],
  ["Get early access", "We invite people in the order they joined, a few at a time."],
  ["Tell us what you think", "Early users shape what we build next."],
];

const FAQ = [
  ["When do you launch?", "We open the doors in small batches. Everyone on the waitlist hears from us first."],
  ["What does it cost?", "Early users get the first months free and a founding price after that."],
  ["What do you do with my email?", "We only use it to tell you about the launch. One click unsubscribes you."],
  ["Can I talk to the team?", "Yes. Use the contact form below and a real person replies."],
];

const field = (id, label, control) => `<div class="zen-input-field" data-size="large" data-state="{{if .errors.${id}}}error{{else}}default{{end}}">
  <span class="zen-input-label zen-type-body-small-regular" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="${id}">${label}</label></span></span>
  <div class="zen-input__control">${control}</div>
</div>`;

const message = (tone, icon, text) => `<div class="zen-inline-message" data-tone="${tone}" role="${tone === "negative" ? "alert" : "status"}"><div class="zen-inline-message__container"><span class="zen-inline-message__icon" aria-hidden="true">${icon}</span><div class="zen-inline-message__content"><div class="zen-inline-message__text"><span class="zen-inline-message__caption zen-type-body-small-regular">${text}</span></div></div></div></div>`;

const primary = (label, icon) => `<button type="submit" class="zen-button" data-size="lg" data-appearance="main" data-level="primary" data-variant="primary"><span class="zen-button__label zen-type-button-label-l">${label}</span>${icon ? `<span class="zen-button__icon" aria-hidden="true">${icon}</span>` : ""}</button>`;

const HONEYPOT = `<div class="trap" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>`;

const WAITLIST = `<form class="join" id="join" hx-post="/waitlist" hx-swap="outerHTML">
  <div class="join-row">
    <div class="zen-input-field join-field" data-size="large" data-state="{{if .error}}error{{else}}default{{end}}">
      <span class="zen-input-label zen-type-body-small-regular zen-visually-hidden" data-state="default"><span class="zen-input-label__content"><label class="zen-input-label__text" for="join-email">Email</label></span></span>
      <div class="zen-input__control"><input id="join-email" class="zen-input__native zen-type-body-base-medium" name="email" type="email" placeholder="you@company.com" autocomplete="email" maxlength="254" value="{{.email}}" required></div>
    </div>
    ${primary("Join the waitlist", icons.arrowRight)}
  </div>
  <input type="hidden" name="source" value="{{.source}}">
  ${HONEYPOT}
  {{if .error}}${message("negative", icons.alert, "{{.error}}")}{{else}}<p class="zen-text zen-type-body-small-regular fineprint" data-tone="light">No spam. Unsubscribe with one click.</p>{{end}}
</form>`;

const JOINED = `<div class="join joined" id="join">${message("positive", icons.checkCircle, "You're on the list. We'll email {{.email}} when your spot opens.")}</div>`;

const CONTACT = `<form class="zen-card contact-card" data-tone="shadow" data-spacing="large" id="contact-form" hx-post="/contact" hx-swap="outerHTML"><div class="zen-card__content contact-form">
  <div class="contact-row">
    ${field("name", "Name", '<input id="name" class="zen-input__native zen-type-body-base-medium" name="name" autocomplete="name" maxlength="100" value="{{.name}}" required>')}
    ${field("email", "Email", '<input id="email" class="zen-input__native zen-type-body-base-medium" name="email" type="email" autocomplete="email" maxlength="254" value="{{.email}}" required>')}
  </div>
  ${field("message", "Message", '<textarea id="message" class="zen-input__native zen-input__native--textarea zen-type-body-base-medium" name="message" rows="5" maxlength="5000" required>{{.message}}</textarea>')}
  ${HONEYPOT}
  {{if .error}}${message("negative", icons.alert, "{{.error}}")}{{end}}
  <div>${primary("Send message")}</div>
</div></form>`;

const SENT = `<div class="zen-card contact-card" data-tone="shadow" data-spacing="large" id="contact-form"><div class="zen-card__content">${message("positive", icons.checkCircle, "Thanks, {{.name}}. We read every message and reply within two working days.")}</div></div>`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.site}}</title>
  <meta name="description" content="${PITCH}">
  <meta property="og:title" content="{{.site}}">
  <meta property="og:description" content="${PITCH}">
  <meta name="htmx-config" content='{"responseHandling":[{"code":"204","swap":false},{"code":"[23]..","swap":true},{"code":"422","swap":true},{"code":"429","swap":false,"error":true},{"code":"[45]..","swap":false,"error":true}]}'>
  <link rel="stylesheet" href="/zen.css">
  <link rel="stylesheet" href="/style.css">
  <script src="/htmx.min.js"></script>
</head>
<body>
  <div class="zen-provider site" data-paint="true" data-component-theme="brand-s1">
    <header class="topbar">
      <div class="wrap topbar-row">
        <a class="brand" href="/"><span class="mark" aria-hidden="true"></span><span class="zen-text zen-type-heading-4" data-tone="strongest">{{.site}}</span></a>
        <nav class="nav" aria-label="Sections">
          <a class="nav-link zen-type-body-base-medium" href="#features">Features</a>
          <a class="nav-link zen-type-body-base-medium" href="#faq">FAQ</a>
          <a class="nav-link zen-type-body-base-medium" href="#contact">Contact</a>
          <a class="zen-button" data-size="sm" data-appearance="main" data-level="primary" data-variant="primary" href="#top"><span class="zen-button__label zen-type-button-label-s">Get early access</span></a>
        </nav>
      </div>
    </header>

    <main>
      <section class="hero" id="top">
        <div class="wrap hero-inner">
          <span class="zen-badge" data-size="medium" data-tone="accent" data-background="subtle"><span class="zen-badge__text zen-type-body-base-medium">Early access is open</span></span>
          <h1 class="zen-text zen-heading zen-type-display-1" data-tone="strongest">${HEADLINE}</h1>
          <p class="zen-text zen-type-body-extra-regular lead" data-tone="base">${PITCH}</p>
          {{raw .form}}
          {{if .proof}}<p class="proof zen-text zen-type-body-small-medium" data-tone="base"><span class="avatars" aria-hidden="true"><i></i><i></i><i></i></span>Join {{.proof}} people already on the list</p>{{end}}
        </div>
      </section>

      <section class="section" id="features">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">Why it's different</span>
            <h2 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Everything you need, nothing you don't</h2>
          </div>
          <ul class="features">
            ${FEATURES.map(([icon, title, text]) => `<li class="zen-card feature" data-tone="shadow" data-spacing="large"><div class="zen-card__content"><span class="feature-icon" aria-hidden="true">${icon}</span><h3 class="zen-text zen-heading zen-type-heading-4" data-tone="strongest">${title}</h3><p class="zen-text zen-type-body-base-regular" data-tone="base">${text}</p></div></li>`).join("")}
          </ul>
        </div>
      </section>

      <section class="section section--alt">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">How it works</span>
            <h2 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Three steps to get started</h2>
          </div>
          <ol class="steps">
            ${STEPS.map(([title, text], index) => `<li class="step"><span class="step-number zen-type-heading-4" aria-hidden="true">${index + 1}</span><h3 class="zen-text zen-heading zen-type-heading-4" data-tone="strongest">${title}</h3><p class="zen-text zen-type-body-base-regular" data-tone="base">${text}</p></li>`).join("")}
          </ol>
        </div>
      </section>

      <section class="section" id="faq">
        <div class="wrap narrow">
          <div class="section-head">
            <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">Questions</span>
            <h2 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Frequently asked</h2>
          </div>
          <div class="faq">
            ${FAQ.map(([question, answer]) => `<details class="faq-item"><summary class="zen-type-body-extra-bold">${question}</summary><p class="zen-text zen-type-body-base-regular" data-tone="base">${answer}</p></details>`).join("")}
          </div>
        </div>
      </section>

      <section class="section section--alt" id="contact">
        <div class="wrap narrow">
          <div class="section-head">
            <span class="eyebrow zen-text zen-type-all-caps-s" data-tone="accent">Contact</span>
            <h2 class="zen-text zen-heading zen-type-heading-1" data-tone="strongest">Talk to the team</h2>
            <p class="zen-text zen-type-body-base-regular" data-tone="base">Questions, partnerships or press. We reply within two working days.</p>
          </div>
          {{raw .contact}}
        </div>
      </section>

      <section class="cta">
        <div class="wrap cta-inner">
          <h2 class="zen-text zen-heading zen-type-heading-1">Be first in line</h2>
          <a class="zen-button" data-size="lg" data-appearance="main" data-level="secondary" data-variant="secondary" href="#top"><span class="zen-button__label zen-type-button-label-l">Join the waitlist</span></a>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="wrap footer-row">
        <span class="zen-text zen-type-body-small-regular" data-tone="light">© {{.year}} {{.site}}</span>
        <span class="zen-text zen-type-body-small-regular" data-tone="light">Powered by PocketBase</span>
      </div>
    </footer>
  </div>
</body>
</html>`;

function render(template, data) {
  return $template.loadString(template).render(data);
}

function text(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function validEmail(email) {
  return email.length <= 254 && EMAIL.test(email);
}

function isBot(body) {
  return text(body.website, 200) !== "";
}

module.exports = {
  home(ref) {
    const count = $app.countRecords("waitlist");
    return render(PAGE, {
      site: $app.settings().meta.appName || "Launch",
      year: new Date().getFullYear(),
      proof: count >= SOCIAL_PROOF_FROM ? String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "",
      form: render(WAITLIST, { email: "", source: text(ref, 100), error: "" }),
      contact: render(CONTACT, { name: "", email: "", message: "", error: "", errors: {} }),
    });
  },

  join(body) {
    const email = text(body.email, 300).toLowerCase();
    const source = text(body.source, 100);
    if (!validEmail(email)) {
      return { ok: false, html: render(WAITLIST, { email, source, error: "Enter a valid email address." }) };
    }
    if (!isBot(body)) {
      try {
        $app.findFirstRecordByData("waitlist", "email", email);
      } catch {
        const entry = new Record($app.findCollectionByNameOrId("waitlist"));
        entry.set("email", email);
        entry.set("source", source);
        try {
          $app.save(entry);
        } catch (error) {
          $app.logger().warn("waitlist save failed", "error", String(error));
        }
      }
    }
    return { ok: true, html: render(JOINED, { email }) };
  },

  contact(body) {
    const values = { name: text(body.name, 100), email: text(body.email, 300).toLowerCase(), message: text(body.message, 5000) };
    const errors = {};
    if (!values.name) errors.name = true;
    if (!validEmail(values.email)) errors.email = true;
    if (!values.message) errors.message = true;
    if (Object.keys(errors).length > 0) {
      return { ok: false, html: render(CONTACT, { ...values, errors, error: "Fill in your name, a valid email and a message." }) };
    }
    if (!isBot(body)) {
      const entry = new Record($app.findCollectionByNameOrId("messages"));
      entry.set("name", values.name);
      entry.set("email", values.email);
      entry.set("message", values.message);
      $app.save(entry);
    }
    return { ok: true, html: render(SENT, values) };
  },
};
