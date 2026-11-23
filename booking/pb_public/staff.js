import PocketBase from "/pocketbase.es.mjs";
import { inlineError, OFFLINE, requestFailure, TOO_MANY } from "/messages.js";

const htmxReady = new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));

const pb = new PocketBase(location.origin);
const signin = document.querySelector("#signin");
const workspace = document.querySelector("#workspace");
const who = document.querySelector("#who");

function showError(message) {
  for (const slot of document.querySelectorAll(".error-slot")) {
    slot.replaceChildren(...(message ? [inlineError(message)] : []));
  }
}

function signInFailure(error) {
  if (error.status === 0) return OFFLINE;
  if (error.status === 429) return TOO_MANY;
  if (error.status === 400) return "That email and password don't match a staff account.";
  return error.response?.message || "Couldn't sign in. Try again.";
}

function signedIn() {
  return pb.authStore.isValid && pb.authStore.record?.collectionName === "staff";
}

function render() {
  const inside = signedIn();
  signin.hidden = inside;
  workspace.hidden = !inside;
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
  showError(requestFailure(event.detail.xhr));
});

document.body.addEventListener("htmx:sendError", () => showError(OFFLINE));

document.querySelector("#signin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const button = event.target.querySelector("button[type=submit]");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    await pb.collection("staff").authWithPassword(form.get("email"), form.get("password"));
    showError("");
    render();
  } catch (error) {
    showError(signInFailure(error));
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
