/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page());
});

routerAdd("GET", "/app/stats", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.stats());
}, $apis.requireAuth("users"));

routerAdd("GET", "/app/orders", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  return e.html(200, views.rows(query.get("status"), query.get("q")));
}, $apis.requireAuth("users"));

routerAdd("PATCH", "/app/orders/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const order = views.order(e);
  const status = String(e.requestInfo().body.status ?? "");
  if (!views.STATUSES.includes(status)) throw new BadRequestError("Choose a valid status");
  order.set("status", status);
  $app.save(order);
  e.response.header().set("HX-Trigger", "orders-changed");
  return e.html(200, views.row(order));
}, $apis.requireAuth("users"));
