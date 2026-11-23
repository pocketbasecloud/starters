export const TOO_MANY = "Too many tries. Wait a minute and try again.";

export const OFFLINE = "Can't reach the server. Check your connection and try again.";

export function inlineError(message) {
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

export function requestFailure(xhr) {
  if (xhr.status === 429) return TOO_MANY;
  try {
    return JSON.parse(xhr.responseText).message || "Something went wrong. Try again.";
  } catch {
    return "Something went wrong. Try again.";
  }
}
