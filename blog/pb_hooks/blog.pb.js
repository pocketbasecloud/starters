/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{$}", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.home());
});

routerAdd("GET", "/blog/more", (e) => {
  const views = require(`${__hooks}/views.js`);
  return e.html(200, views.more(e.request.url.query().get("page")));
});

routerAdd("GET", "/posts/{slug}", (e) => {
  const views = require(`${__hooks}/views.js`);
  const html = views.post(e.request.pathValue("slug"));
  return html === null ? e.html(404, views.notFound()) : e.html(200, html);
});
