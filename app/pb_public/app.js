import PocketBase from "/pocketbase.es.mjs";

const htmxReady = new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));

const pb = new PocketBase(location.origin);
const welcome = document.querySelector("#welcome");
const workspace = document.querySelector("#workspace");
const who = document.querySelector("#who");
const TOO_MANY = "Too many tries. Wait a minute and try again.";
const OFFLINE = "Can't reach the server. Check your connection and try again.";
const FIELD_LABELS = { email: "Email", password: "Password", passwordConfirm: "Password" };

function inlineError(message) {
  const box = document.createElement("div");
  box.className = "zen-inline-message";
  box.dataset.tone = "negative";
  box.setAttribute("role", "alert");
  const container = document.createElement("div");
  container.className = "zen-inline-message__container";
  const icon = document.createElement("span");
  icon.className = "zen-inline-message__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.append(document.querySelector("#alert-icon").content.cloneNode(true));
  const content = document.createElement("div");
  content.className = "zen-inline-message__content";
  const text = document.createElement("div");
  text.className = "zen-inline-message__text";
  const caption = document.createElement("span");
  caption.className = "zen-inline-message__caption zen-type-body-small-regular";
  caption.textContent = message;
  text.append(caption);
  content.append(text);
  container.append(icon, content);
  box.append(container);
  return box;
}

function showError(message) {
  for (const slot of document.querySelectorAll(".error-slot")) {
    slot.replaceChildren(...(message ? [inlineError(message)] : []));
  }
}

function signedIn() {
  return pb.authStore.isValid && pb.authStore.record?.collectionName === "users";
}

function render() {
  const inside = signedIn();
  welcome.hidden = inside;
  workspace.hidden = !inside;
  who.textContent = inside ? pb.authStore.record.email : "";
  if (inside) htmxReady.then(() => htmx.trigger(document.body, "signed-in"));
}

function messageOf(caught, fallback) {
  if (caught?.status === 0) return OFFLINE;
  if (caught?.status === 429) return TOO_MANY;
  const [field, error] = Object.entries(caught?.response?.data ?? {})[0] ?? [];
  if (field === "email" && error.code === "validation_not_unique") return "An account with that email already exists. Sign in instead.";
  if (error) return `${FIELD_LABELS[field] ?? field}: ${error.message}`;
  return caught?.response?.message || fallback;
}

async function whileBusy(form, work) {
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    await work();
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function undoChange(element) {
  if (element.type === "checkbox") element.checked = !element.checked;
}

function select(group, value) {
  for (const item of group.querySelectorAll(".zen-segmented__item")) {
    const selected = item.dataset.value === value;
    item.dataset.selected = String(selected);
    item.setAttribute("aria-pressed", String(selected));
  }
}

for (const group of document.querySelectorAll(".zen-segmented")) {
  group.addEventListener("click", (event) => {
    const item = event.target.closest(".zen-segmented__item");
    if (!item) return;
    select(group, item.dataset.value);
    if (group.dataset.name === "auth") {
      showError("");
      for (const form of document.querySelectorAll("[data-auth]")) {
        form.hidden = form.dataset.auth !== item.dataset.value;
      }
    }
    if (group.dataset.name === "show") {
      document.querySelector("#show-value").value = item.dataset.value;
      htmx.trigger("#show", "change");
    }
  });
}

document.body.addEventListener("htmx:configRequest", (event) => {
  if (pb.authStore.isValid) event.detail.headers["Authorization"] = pb.authStore.token;
});

document.body.addEventListener("htmx:afterRequest", (event) => {
  if (event.detail.successful) showError("");
});

document.body.addEventListener("htmx:responseError", (event) => {
  if (event.detail.xhr.status === 401) {
    pb.authStore.clear();
    render();
    showError("Your session ended. Sign in again.");
    return;
  }
  undoChange(event.detail.elt);
  if (event.detail.xhr.status === 429) {
    showError(TOO_MANY);
    return;
  }
  let message = "Something went wrong. Try again.";
  try {
    message = JSON.parse(event.detail.xhr.responseText).message || message;
  } catch {}
  showError(message);
});

document.body.addEventListener("htmx:sendError", (event) => {
  undoChange(event.detail.elt);
  showError(OFFLINE);
});

document.querySelector("#signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get("email");
  const password = form.get("password");
  await whileBusy(event.target, async () => {
    try {
      await pb.collection("users").create({ email, password, passwordConfirm: password });
      await pb.collection("users").authWithPassword(email, password);
      showError("");
      render();
    } catch (caught) {
      showError(messageOf(caught, "Could not create the account."));
    }
  });
});

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  await whileBusy(event.target, async () => {
    try {
      await pb.collection("users").authWithPassword(form.get("email"), form.get("password"));
      showError("");
      render();
    } catch (caught) {
      showError(caught?.status === 400 ? "Wrong email or password." : messageOf(caught, "Could not sign in. Try again."));
    }
  });
});

document.querySelector("#signout").addEventListener("click", () => {
  pb.authStore.clear();
  render();
});

render();
