import PocketBase from "/pocketbase.es.mjs";

const pb = new PocketBase(location.origin);
const welcome = document.querySelector("#welcome");
const workspace = document.querySelector("#workspace");

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

const chat = document.querySelector("#chat");
const panel = document.querySelector("#panel");
let subscribed = false;

function signedIn() {
  return pb.authStore.isValid && pb.authStore.record?.collectionName === "users";
}

function currentConversation() {
  return document.querySelector("#pane [data-conversation]")?.dataset.conversation || "";
}

function highlight() {
  const current = currentConversation();
  for (const link of document.querySelectorAll(".conversation-link")) {
    if (link.dataset.id === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  chat.classList.toggle("is-open", Boolean(document.querySelector("#pane .conversation")));
}

function dropDuplicateMessages() {
  const seen = new Set();
  for (const item of document.querySelectorAll("#messages .message")) {
    if (seen.has(item.id)) item.remove();
    else seen.add(item.id);
  }
  if (seen.size > 0) document.querySelector("#messages .messages-empty")?.remove();
}

function scrollToEnd() {
  const list = document.querySelector("#messages");
  if (list) list.scrollTop = list.scrollHeight;
}

async function subscribe() {
  if (subscribed) return;
  subscribed = true;
  await pb.collection("messages").subscribe("*", (event) => {
    if (event.action !== "create") return;
    htmx.trigger(document.body, "conversations-changed");
    if (event.record.conversation !== currentConversation()) return;
    if (document.querySelector(`#message-${event.record.id}`)) return;
    htmx.ajax("GET", `/app/messages/${event.record.id}`, { target: "#messages", swap: "beforeend" });
  });
  await pb.collection("notifications").subscribe("*", () => htmx.trigger(document.body, "notifications-changed"));
  await pb.collection("conversations").subscribe("*", () => htmx.trigger(document.body, "conversations-changed"));
}

async function unsubscribe() {
  if (!subscribed) return;
  subscribed = false;
  await pb.realtime.unsubscribe();
}

function render() {
  const inside = signedIn();
  welcome.hidden = inside;
  workspace.hidden = !inside;
  if (!inside) {
    unsubscribe();
    return;
  }
  htmx.trigger(document.body, "signed-in");
  subscribe();
  const open = workspace.dataset.open;
  if (open && !currentConversation()) htmx.ajax("GET", `/app/conversations/${open}`, { target: "#pane" });
}

function messageOf(caught, fallback) {
  const fields = caught?.response?.data ?? {};
  const first = Object.values(fields)[0];
  return first?.message || caught?.response?.message || fallback;
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
  let message = "Something went wrong. Try again.";
  try {
    message = JSON.parse(event.detail.xhr.responseText).message || message;
  } catch {}
  showError(message);
});

document.querySelector("#signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get("email");
  const password = form.get("password");
  try {
    await pb.collection("users").create({ email, password, passwordConfirm: password, name: form.get("name") });
    await pb.collection("users").authWithPassword(email, password);
    showError("");
    render();
  } catch (caught) {
    showError(messageOf(caught, "Could not create the account."));
  }
});

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    await pb.collection("users").authWithPassword(form.get("email"), form.get("password"));
    showError("");
    render();
  } catch {
    showError("Wrong email or password.");
  }
});

document.querySelector("#signout").addEventListener("click", () => {
  pb.authStore.clear();
  history.replaceState(null, "", "/");
  render();
});

document.body.addEventListener("htmx:afterSwap", (event) => {
  if (event.detail.target.id === "pane" || event.detail.target.id === "messages") {
    dropDuplicateMessages();
    highlight();
    scrollToEnd();
  }
  if (event.detail.target.id === "conversations") highlight();
  if (event.detail.target.id === "panel-body" && !panel.open) panel.showModal();
});

document.body.addEventListener("click", (event) => {
  if (event.target.closest("[data-back]")) {
    chat.classList.remove("is-open");
    history.pushState(null, "", "/");
  }
});

document.body.addEventListener("keydown", (event) => {
  if (event.target.matches(".composer-input") && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    event.target.form.requestSubmit();
  }
});

document.querySelector("#close-panel").addEventListener("click", () => panel.close());

render();
