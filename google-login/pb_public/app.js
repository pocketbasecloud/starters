import PocketBase from "/pocketbase.es.mjs";

const GOOGLE = "Google";
const pb = new PocketBase(location.origin);
const users = pb.collection("users");
const welcome = document.querySelector("#welcome");
const workspace = document.querySelector("#workspace");
const googleButton = document.querySelector("#google");
const notReady = document.querySelector("#not-ready");
let provider = null;

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
  const caption = document.createElement("span");
  caption.className = "zen-inline-message__caption zen-type-body-small-regular";
  caption.textContent = message;
  const content = document.createElement("div");
  content.className = "zen-inline-message__content";
  content.append(caption);
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
  if (inside) htmx.ajax("GET", "/app/me", "#profile");
}

async function findGoogle() {
  try {
    const { oauth2 } = await users.listAuthMethods();
    provider = oauth2.providers.find((item) => item.displayName === GOOGLE || item.name === "google") ?? null;
  } catch {
    provider = null;
  }
  googleButton.disabled = !provider;
  notReady.hidden = Boolean(provider);
}

googleButton.addEventListener("click", async () => {
  showError("");
  try {
    await users.authWithOAuth2({ provider: provider.name });
    render();
  } catch (caught) {
    if (caught?.isAbort) return;
    showError(caught?.response?.message || "Google sign-in did not finish. Try again.");
  }
});

document.querySelector("#signout").addEventListener("click", () => {
  pb.authStore.clear();
  render();
});

document.body.addEventListener("htmx:configRequest", (event) => {
  if (pb.authStore.isValid) event.detail.headers["Authorization"] = pb.authStore.token;
});

document.body.addEventListener("htmx:responseError", (event) => {
  if (event.detail.xhr.status === 401) {
    pb.authStore.clear();
    render();
    showError("Your session ended. Sign in again.");
    return;
  }
  showError("Something went wrong. Try again.");
});

render();
findGoogle();
