/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/staff", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.staffPage(e));
});

routerAdd("GET", "/staff/orders", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.staffOrders(e.request.url.query().get("status")));
}, $apis.requireAuth("staff"));

routerAdd("PATCH", "/staff/orders/{id}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const orders = require(`${__hooks}/lib/orders.js`);
  const order = orders.setStatus(e.request.pathValue("id"), String(e.requestInfo().body.status ?? ""), e.auth.getString("email"));
  return e.html(200, views.orderRow(order));
}, $apis.requireAuth("staff"));
