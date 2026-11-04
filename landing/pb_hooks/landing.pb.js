/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.home(e.request.url.query().get("ref")));
});

routerAdd("POST", "/waitlist", (e) => {
  const views = require(`${__hooks}/views.js`);
  const result = views.join(e.requestInfo().body);
  return e.html(result.ok ? 200 : 422, result.html);
});

routerAdd("POST", "/contact", (e) => {
  const views = require(`${__hooks}/views.js`);
  const result = views.contact(e.requestInfo().body);
  return e.html(result.ok ? 200 : 422, result.html);
});
