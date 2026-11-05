const VIEWS = `${__hooks}/views`;
const PARTIALS = [
  "partials/waitlist-form.html",
  "partials/contact-form.html",
  "partials/message.html",
  "partials/honeypot.html",
  "icons.html",
];
const PITCH = "A short sentence on what you are building and who it is for. Join the waitlist and be first in when we open the doors.";
const SOCIAL_PROOF_FROM = 25;
const EMAIL = /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/;

function render(files, data) {
  return $template.loadFiles(...files.map((file) => `${VIEWS}/${file}`)).render(data);
}

function fragment(name, data) {
  const entry = `partials/${name}.html`;
  return render([entry, ...PARTIALS.filter((file) => file !== entry)], data);
}

function negative(text) {
  return { tone: "negative", text };
}

function positive(text) {
  return { tone: "positive", text };
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

function thousands(count) {
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
  home(ref) {
    const count = $app.countRecords("waitlist");
    return render(["layout.html", "pages/home.html", ...PARTIALS], {
      site: $app.settings().meta.appName || "Launch",
      year: new Date().getFullYear(),
      pitch: PITCH,
      proof: count >= SOCIAL_PROOF_FROM ? thousands(count) : "",
      waitlist: { email: "", source: text(ref, 100), error: null },
      contact: { name: "", email: "", message: "", error: null, errors: {} },
    });
  },

  join(body) {
    const email = text(body.email, 300).toLowerCase();
    const source = text(body.source, 100);
    if (!validEmail(email)) {
      return { ok: false, html: fragment("waitlist-form", { email, source, error: negative("Enter a valid email address.") }) };
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
    return { ok: true, html: fragment("waitlist-joined", { message: positive(`You're on the list. We'll email ${email} when your spot opens.`) }) };
  },

  contact(body) {
    const values = { name: text(body.name, 100), email: text(body.email, 300).toLowerCase(), message: text(body.message, 5000) };
    const errors = {};
    if (!values.name) errors.name = true;
    if (!validEmail(values.email)) errors.email = true;
    if (!values.message) errors.message = true;
    if (Object.keys(errors).length > 0) {
      return { ok: false, html: fragment("contact-form", { ...values, errors, error: negative("Fill in your name, a valid email and a message.") }) };
    }
    if (!isBot(body)) {
      const entry = new Record($app.findCollectionByNameOrId("messages"));
      entry.set("name", values.name);
      entry.set("email", values.email);
      entry.set("message", values.message);
      $app.save(entry);
    }
    return { ok: true, html: fragment("contact-sent", { message: positive(`Thanks, ${values.name}. We read every message and reply within two working days.`) }) };
  },
};
