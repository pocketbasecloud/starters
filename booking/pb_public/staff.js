import PocketBase from "/pocketbase.es.mjs";

const pb = new PocketBase(location.origin);
const signin = document.querySelector("#signin");
const workspace = document.querySelector("#workspace");
const who = document.querySelector("#who");

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
  signin.hidden = inside;
  workspace.hidden = !inside;
  who.textContent = inside ? pb.authStore.record.email : "";
  if (inside) htmx.trigger(document.body, "signed-in");
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
  let message = "Something went wrong. Try again.";
  try {
    message = JSON.parse(event.detail.xhr.responseText).message || message;
  } catch {}
  showError(message);
});

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    await pb.collection("users").authWithPassword(form.get("email"), form.get("password"));
    showError("");
    render();
  } catch {
    showError("That email and password don't match a staff account.");
  }
});

document.querySelector("#signout").addEventListener("click", () => {
  pb.authStore.clear();
  render();
});

render();
