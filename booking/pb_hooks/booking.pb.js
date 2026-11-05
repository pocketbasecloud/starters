/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page());
});

routerAdd("GET", "/book/times", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  return e.html(200, views.times(query.get("service"), query.get("staff"), query.get("date")));
});

routerAdd("POST", "/book", (e) => {
  const views = require(`${__hooks}/views.js`);
  const result = views.book(e.requestInfo().body);
  if (result.retarget) {
    e.response.header().set("HX-Retarget", result.retarget);
    e.response.header().set("HX-Reswap", "innerHTML");
  }
  if (result.refreshTimes) e.response.header().set("HX-Trigger", "times-changed");
  return e.html(result.status, result.html);
});

routerAdd("GET", "/staff", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.staffPage());
});

routerAdd("GET", "/staff/schedule", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.schedule(e.auth.id, e.request.url.query().get("scope")));
}, $apis.requireAuth("staff"));

routerAdd("PATCH", "/staff/bookings/{id}/cancel", (e) => {
  const views = require(`${__hooks}/views.js`);
  views.cancel(e.request.pathValue("id"), e.auth.getString("email"));
  e.response.header().set("HX-Trigger", "bookings-changed");
  return e.noContent(204);
}, $apis.requireAuth("staff"));
