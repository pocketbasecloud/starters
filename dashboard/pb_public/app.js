import PocketBase from "/pocketbase.es.mjs";

const htmxReady = new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));

const pb = new PocketBase(location.origin);
const signin = document.querySelector("#signin");
const dashboard = document.querySelector("#dashboard");
const who = document.querySelector("#who");
const status = document.querySelector("#status");
const TOO_MANY = "Too many tries. Wait a minute and try again.";
const OFFLINE = "Can't reach the server. Check your connection and try again.";

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

function signInFailure(caught) {
  if (caught?.status === 0) return OFFLINE;
  if (caught?.status === 429) return TOO_MANY;
  if (caught?.status === 400) return "That email and password don't match a staff account.";
  return caught?.response?.message || "Could not sign in. Try again.";
}

function undoChange(element) {
  if (element.tagName !== "SELECT") return;
  element.value = [...element.options].find((option) => option.defaultSelected)?.value ?? element.value;
}

function signedIn() {
  return pb.authStore.isValid && pb.authStore.record?.collectionName === "users";
}

function render() {
  const inside = signedIn();
  signin.hidden = inside;
  dashboard.hidden = !inside;
  who.textContent = inside ? pb.authStore.record.email : "";
  if (inside) htmxReady.then(() => htmx.trigger(document.body, "signed-in"));
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

for (const item of document.querySelectorAll(".zen-segmented__item")) {
  item.addEventListener("click", () => {
    for (const other of item.parentElement.children) {
      const selected = other === item;
      other.dataset.selected = String(selected);
      other.setAttribute("aria-pressed", String(selected));
    }
    status.value = item.dataset.value;
    htmx.trigger("#filters", "change");
  });
}

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const button = event.target.querySelector("button[type=submit]");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    await pb.collection("users").authWithPassword(form.get("email"), form.get("password"));
    showError("");
    render();
  } catch (caught) {
    showError(signInFailure(caught));
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
});

document.querySelector("#signout").addEventListener("click", () => {
  pb.authStore.clear();
  render();
});

render();
