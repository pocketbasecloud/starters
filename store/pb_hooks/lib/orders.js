const audit = require(`${__hooks}/lib/audit.js`);

const STATUSES = ["pending", "paid", "fulfilled", "cancelled"];
const STAFF_STATUSES = ["paid", "fulfilled", "cancelled"];

function number(order) {
  return order.id.slice(0, 6).toUpperCase();
}

function createPending(lines, currency) {
  let order = null;
  $app.runInTransaction((txApp) => {
    order = new Record(txApp.findCollectionByNameOrId("orders"));
    order.set("status", "pending");
    order.set("currency", currency);
    order.set("total", lines.reduce((sum, line) => sum + line.price * line.quantity, 0));
    txApp.save(order);
    const items = txApp.findCollectionByNameOrId("order_items");
    for (const line of lines) {
      const item = new Record(items);
      item.set("order", order.id);
      item.set("product", line.product.id);
      item.set("name", line.product.getString("name"));
      item.set("price", line.price);
      item.set("quantity", line.quantity);
      txApp.save(item);
    }
  });
  return order;
}

function upsertCustomer(txApp, email, name) {
  try {
    const existing = txApp.findFirstRecordByData("customers", "email", email);
    if (name && !existing.getString("name")) {
      existing.set("name", name);
      txApp.save(existing);
    }
    return existing;
  } catch {
    const customer = new Record(txApp.findCollectionByNameOrId("customers"));
    customer.set("email", email);
    customer.set("name", name);
    txApp.save(customer);
    return customer;
  }
}

function sessionOrder(txApp, session) {
  const orderId = String((session.metadata && session.metadata.order_id) || session.client_reference_id || "");
  if (!/^[a-z0-9]{15}$/.test(orderId)) return null;
  try {
    const order = txApp.findRecordById("orders", orderId);
    return order.getString("stripe_session") === session.id ? order : null;
  } catch {
    return null;
  }
}

function applyStripeEvent(event) {
  const session = event && event.data && event.data.object;
  if (!session || session.object !== "checkout.session") return "ignored";
  let outcome = "ignored";
  $app.runInTransaction((txApp) => {
    const order = sessionOrder(txApp, session);
    if (!order || order.getString("status") !== "pending") return;
    if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
      const details = session.customer_details || {};
      const email = String(details.email || "").toLowerCase().slice(0, 254);
      if (email) {
        order.set("customer", upsertCustomer(txApp, email, String(details.name || "").slice(0, 200)).id);
        order.set("email", email);
      }
      order.set("payment_intent", String(session.payment_intent || "").slice(0, 255));
      order.set("status", "paid");
      txApp.save(order);
      audit.record(txApp, { actor: "stripe", action: "order.paid", target: `orders/${order.id}`, detail: `Order ${number(order)} paid` });
      outcome = "paid";
    }
    if (event.type === "checkout.session.expired") {
      order.set("status", "cancelled");
      txApp.save(order);
      audit.record(txApp, { actor: "stripe", action: "order.expired", target: `orders/${order.id}`, detail: `Checkout for order ${number(order)} expired` });
      outcome = "cancelled";
    }
  });
  return outcome;
}

function setStatus(orderId, status, actor) {
  if (!STAFF_STATUSES.includes(status)) throw new BadRequestError("Choose paid, fulfilled or cancelled");
  let order;
  try {
    order = $app.findRecordById("orders", orderId);
  } catch {
    throw new NotFoundError("Order not found");
  }
  if (order.getString("status") === "pending") throw new BadRequestError("This order has not been paid yet");
  const previous = order.getString("status");
  if (previous === status) return order;
  order.set("status", status);
  $app.save(order);
  audit.record($app, { actor, action: `order.${status}`, target: `orders/${order.id}`, detail: `Order ${number(order)}: ${previous} → ${status}` });
  return order;
}

module.exports = { STATUSES, STAFF_STATUSES, number, createPending, applyStripeEvent, setStatus };
