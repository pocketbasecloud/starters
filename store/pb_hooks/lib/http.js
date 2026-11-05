function requireCart() {
  const stripe = require(`${__hooks}/lib/stripe.js`);
  if (!stripe.configured()) throw new NotFoundError("The cart is not enabled");
}

function refuse(e, status, text) {
  const views = require(`${__hooks}/views.js`);
  e.response.header().set("HX-Retarget", "#cart-error");
  e.response.header().set("HX-Reswap", "innerHTML");
  return e.html(status, views.error(text));
}

module.exports = { requireCart, refuse };
