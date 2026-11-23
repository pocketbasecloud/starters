import { inlineError, OFFLINE, requestFailure } from "/messages.js";

const ERROR_SLOTS = [
  ["#cart", "#cart-error"],
  [".buy", "#buy-error"],
  ["#catalog", "#catalog-error"],
];

function slotFor(element) {
  const match = ERROR_SLOTS.find(([region]) => element.closest(region));
  return match ? document.querySelector(match[1]) : null;
}

function show(element, message) {
  slotFor(element)?.replaceChildren(...(message ? [inlineError(message)] : []));
}

function fail(element, message) {
  if (element instanceof HTMLSelectElement) element.value = [...element.options].find((option) => option.defaultSelected)?.value ?? element.value;
  show(element, message);
}

document.body.addEventListener("htmx:beforeRequest", (event) => show(event.detail.elt, ""));
document.body.addEventListener("htmx:responseError", (event) => fail(event.detail.elt, requestFailure(event.detail.xhr)));
document.body.addEventListener("htmx:sendError", (event) => fail(event.detail.elt, OFFLINE));
