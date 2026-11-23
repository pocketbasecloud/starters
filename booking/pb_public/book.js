import { inlineError, OFFLINE, requestFailure } from "/messages.js";

function slotFor(element) {
  return element.closest("#times") || document.querySelector("#booking-error");
}

function show(element, message) {
  slotFor(element)?.replaceChildren(inlineError(message));
}

document.body.addEventListener("htmx:responseError", (event) => show(event.detail.elt, requestFailure(event.detail.xhr)));
document.body.addEventListener("htmx:sendError", (event) => show(event.detail.elt, OFFLINE));
document.body.addEventListener("htmx:beforeRequest", (event) => {
  if (event.detail.elt.id === "booking") document.querySelector("#booking-error")?.replaceChildren();
});
