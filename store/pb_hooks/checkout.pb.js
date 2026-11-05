/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/cart", (e) => {
  const http = require(`${__hooks}/lib/http.js`);
  http.requireCart();
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.cartPage(e));
});

routerAdd("GET", "/cart/link", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.cartLink(e));
});

routerAdd("POST", "/cart/items", (e) => {
  const http = require(`${__hooks}/lib/http.js`);
  http.requireCart();
  const views = require(`${__hooks}/views.js`);
  const cart = require(`${__hooks}/lib/cart.js`);
  const product = views.activeProduct(String(e.requestInfo().body.product ?? ""));
  if (!product) throw new NotFoundError("Product not found");
  cart.add(e, product.id);
  e.response.header().set("HX-Trigger", "cart-changed");
  return e.html(200, views.addButton(product, true));
});

routerAdd("PATCH", "/cart/items/{product}", (e) => {
  const http = require(`${__hooks}/lib/http.js`);
  http.requireCart();
  const views = require(`${__hooks}/views.js`);
  const cart = require(`${__hooks}/lib/cart.js`);
  const productId = e.request.pathValue("product");
  if (!/^[a-z0-9]{15}$/.test(productId)) throw new BadRequestError("Unknown product");
  const lines = cart.setQuantity(e, productId, e.requestInfo().body.quantity);
  e.response.header().set("HX-Trigger", "cart-changed");
  return e.html(200, views.cartPanel(e, lines));
});

routerAdd("POST", "/checkout", (e) => {
  const http = require(`${__hooks}/lib/http.js`);
  http.requireCart();
  const cart = require(`${__hooks}/lib/cart.js`);
  const orders = require(`${__hooks}/lib/orders.js`);
  const settings = require(`${__hooks}/lib/settings.js`);
  const stripe = require(`${__hooks}/lib/stripe.js`);
  const lines = cart.resolve(cart.read(e));
  if (lines.length === 0) return http.refuse(e, 422, "Your cart is empty.");
  const currency = settings.current().currency;
  const order = orders.createPending(lines, currency);
  const origin = require(`${__hooks}/lib/origin.js`).siteOrigin(e);
  let session;
  try {
    session = stripe.createCheckoutSession({
      mode: "payment",
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      success_url: `${origin}/thanks?order=${order.id}`,
      cancel_url: `${origin}/cart`,
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: { currency, unit_amount: line.price, product_data: { name: line.product.getString("name") } },
      })),
    });
  } catch (error) {
    $app.logger().error("stripe checkout failed", "error", String(error), "order", order.id);
    order.set("status", "cancelled");
    $app.save(order);
    return http.refuse(e, 502, "Checkout is unavailable right now. Try again in a minute.");
  }
  order.set("stripe_session", String(session.id).slice(0, 255));
  $app.save(order);
  e.response.header().set("HX-Redirect", session.url);
  return e.html(200, "");
});

routerAdd("POST", "/stripe/webhook", (e) => {
  const orders = require(`${__hooks}/lib/orders.js`);
  const stripe = require(`${__hooks}/lib/stripe.js`);
  const raw = toString(e.request.body);
  const event = stripe.verifiedEvent(raw, e.request.header.get("Stripe-Signature"), $os.getenv("STRIPE_WEBHOOK_SECRET"));
  if (!event) return e.json(400, { message: "Invalid signature" });
  return e.json(200, { received: true, outcome: orders.applyStripeEvent(event) });
});
