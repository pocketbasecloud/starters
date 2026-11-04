# Blog starter

A fast, good-looking blog served by PocketBase: a featured post, a grid of
cover cards that loads more as you go, and post pages with reading time.

## Change these first

1. **Name**: set *Application name* in PocketBase settings. The header, titles
   and footer use it.
2. **Tagline**: `TAGLINE` at the top of `pb_hooks/views.js`.
3. **Sample posts**: delete them in the admin under `posts`, then write your own.

## Writing

Each post is a record in `posts`: title, slug (the URL), summary, body (rich
text) and an optional cover image. Only posts with **published** ticked appear,
on the pages and in the API.

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/blog.pb.js` | Routes: `/`, `/blog/more`, `/posts/{slug}` |
| `pb_hooks/views.js` | The HTML templates and page size |
| `pb_public/style.css` | Layout and look |
