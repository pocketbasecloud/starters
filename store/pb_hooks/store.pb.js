/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  return e.html(200, views.home(e, query.get("category"), query.get("sort")));
});

routerAdd("GET", "/shop/catalog", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  e.response.header().set("HX-Push-Url", views.shopUrl(query.get("category"), query.get("sort")));
  return e.html(200, views.catalog(query.get("category"), query.get("sort")));
});

routerAdd("GET", "/products/{slug}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const html = views.product(e, e.request.pathValue("slug"));
  return html === null ? e.html(404, views.notFound(e)) : e.html(200, html);
});

routerAdd("GET", "/thanks", (e) => {
  const views = require(`${__hooks}/views.js`);
  const cart = require(`${__hooks}/lib/cart.js`);
  const order = e.request.url.query().get("order");
  if (order) cart.clear(e);
  return e.html(200, views.thanks(e, order));
});

routerAdd("GET", "/thanks/status", (e) => {
  const views = require(`${__hooks}/views.js`);
  const query = e.request.url.query();
  return e.html(200, views.orderStatus(query.get("order"), query.get("attempt")));
});
