# PocketBase Cloud starters

Seven small, finished sites that run entirely inside PocketBase. Pages are
rendered by JavaScript hooks with PocketBase's built-in template engine, made
interactive with [htmx](https://htmx.org), and styled with the Zen design
system. There is no separate server, no Node and no build step.

| Starter | For | What you get |
| --- | --- | --- |
| [`blog`](blog) | Blogs, changelogs, docs | Featured post, cover grid, post pages, drafts |
| [`landing`](landing) | Launches and waitlists | Hero, features, FAQ, waitlist and contact forms |
| [`store`](store) | Small shops | Catalogue, categories, product pages, Stripe Payment Links |
| [`booking`](booking) | Appointments | Services, open times, email confirmation, staff schedule |
| [`dashboard`](dashboard) | Internal tools | Staff sign-in, metrics, filterable orders table |
| [`app`](app) | Apps with accounts | Sign-up, per-user tasks, filters |
| [`api`](api) | A backend for your own frontend | Owner-only data, protected files, a custom route |

Each folder is one PocketBase:

```text
pb_migrations/  collections, API rules and sample data
pb_hooks/       routes (*.pb.js) and the HTML they render (views.js)
pb_public/      styles, htmx and fonts
```

## Deploy

From the PocketBase Cloud portal, pick the starter when you create a project.
Or with the CLI, from a starter folder:

```sh
pbc pocketbase deploy --new my-blog
```

## Run locally

Download [PocketBase](https://pocketbase.io/docs/) (the starters are tested with 0.41), then from a starter folder:

```sh
pocketbase serve
```

Open http://127.0.0.1:8090 for the site and http://127.0.0.1:8090/_/ for the
admin. Sample data is added by the first migration; delete it from the admin
when you are ready.

## Change the look

`pb_public/style.css` holds each starter's layout. `pb_public/zen.css` is the
Zen component library: regenerate it rather than editing it.

## Security

- Every collection has explicit API rules. Writes the public must not make are
  closed (`null`), and the hooks validate everything they save.
- Templates escape every value. Only trusted HTML from your own editor fields
  is rendered raw.
- Public forms carry a hidden honeypot field and a rate limit.
- Staff areas sign in with PocketBase auth; public sign-up is closed there.

## License

Starters: MIT. htmx: BSD Zero Clause. Inter: SIL Open Font License (see `pb_public/fonts`).
