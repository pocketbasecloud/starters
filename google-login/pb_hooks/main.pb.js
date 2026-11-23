/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.page());
});

routerAdd("GET", "/app/me", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.profile(e.auth));
}, $apis.requireAuth("users"));
