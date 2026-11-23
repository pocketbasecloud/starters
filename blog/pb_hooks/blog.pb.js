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

routerUse((e) => {
  try {
    return e.next();
  } catch (error) {
    const path = e.request.url.path;
    const isSitePage = e.request.method === "GET" && !path.startsWith("/api/") && !path.startsWith("/_/");
    if (error?.value?.status !== 404 || !isSitePage) throw error;
    const views = require(`${__hooks}/views.js`);
    return e.html(404, views.notFound());
  }
});
