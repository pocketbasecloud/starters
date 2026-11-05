# PocketBase Cloud starters

Nine small, finished sites that run entirely inside PocketBase. Pages are
rendered by JavaScript hooks with PocketBase's built-in template engine, made
interactive with [htmx](https://htmx.org), and styled with the Zen design
system. There is no separate server, no Node and no build step.

| Starter | For | What you get |
| --- | --- | --- |
| [`blog`](blog) | Blogs, changelogs, docs | Featured post, cover grid, post pages, drafts |
| [`landing`](landing) | Launches and waitlists | Hero, features, FAQ, waitlist and contact forms |
| [`store`](store) | Small shops | Catalogue, cart, Stripe Checkout, orders, staff orders page |
| [`booking`](booking) | Appointments | Services, staff and shifts, open times, email confirmation, staff schedule |
| [`messaging`](messaging) | Chat in an app or team | Conversations, live messages, unread counts, notifications |
| [`team`](team) | Team workspaces | Teams, roles, email invites, projects and tasks, activity |
| [`dashboard`](dashboard) | Internal tools | Staff sign-in, metrics, filterable orders table |
| [`app`](app) | Apps with accounts | Sign-up, per-user tasks, filters |
| [`api`](api) | A backend for your own frontend | Owner-only data, protected files, a custom route |

Each folder is one PocketBase:

```text
pb_migrations/        collections, API rules and sample data
pb_hooks/
  *.pb.js             routes
  views.js            reads data and picks the template
  views/
    layout.html       the page shell
    pages/            one template per page
    partials/         pieces shared by pages and htmx responses
    icons.html        Zen icons (generated)
pb_public/            styles, htmx and fonts
```

Templates use PocketBase's built-in engine, Go's `html/template`: every value
is escaped, `{{template "post-meta.html" .}}` includes a partial, and
`{{template "icon-clock"}}` an icon. htmx is the `hx-` attributes in those
templates; each `hx-get` or `hx-post` calls a route in `*.pb.js`, which renders
a partial and sends back just that piece of HTML.

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

Edit the words and markup in `pb_hooks/views/`, the layout in
`pb_public/style.css`. `pb_public/zen.css` and `pb_hooks/views/icons.html` are
generated from the Zen design system: regenerate them rather than editing them.

## Security

- Every collection has explicit API rules. Writes the public must not make are
  closed (`null`), and the hooks validate everything they save.
- Templates escape every value. Only trusted HTML from your own editor fields
  is rendered raw.
- Public forms carry a hidden honeypot field and a rate limit.
- Staff areas sign in with PocketBase auth; public sign-up is closed there.

## License

Starters: MIT. htmx: BSD Zero Clause. Inter: SIL Open Font License (see `pb_public/fonts`).
