import { inlineError, OFFLINE, requestFailure } from "/messages.js";

function show(element, message) {
  element.closest("form")?.querySelector(".error-slot")?.replaceChildren(...(message ? [inlineError(message)] : []));
}

document.body.addEventListener("htmx:beforeRequest", (event) => show(event.detail.elt, ""));
document.body.addEventListener("htmx:responseError", (event) => show(event.detail.elt, requestFailure(event.detail.xhr)));
document.body.addEventListener("htmx:sendError", (event) => show(event.detail.elt, OFFLINE));
