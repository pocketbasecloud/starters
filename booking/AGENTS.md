# Notes for coding agents

This is the `booking` starter: one PocketBase whose hooks render every page.
Read this before changing it.

## Where things are

- `pb_migrations/`: collections (services, staff (auth), shifts, bookings, settings, audit_log), API rules and sample data. Add a
  new migration for a change; never edit one that has run.
- `pb_hooks/booking.pb.js`: routes. A handler runs in its own context, so `require()` helpers
  inside it; top-level functions in a `.pb.js` file are not visible to handlers.
- `pb_hooks/views.js`: reads data and picks a template; `pb_hooks/lib/` holds the logic.
- `pb_hooks/views/`: HTML templates (Go `html/template`): `layout.html`, `pages/`,
  `partials/` (pieces an htmx request gets back) and the generated `icons.html`.
- `pb_public/`: styles, htmx and the Zen design system (`zen.css` is generated).

## Rules that keep it safe

- A booking is saved only inside `runInTransaction` after `freeSlots` is recomputed, so two visitors can never take the same time.
- Templates escape every value; use `{{raw}}` only for HTML the owner wrote.
- Copy a list PocketBase returns (`[...records]`) before sorting or reversing it.

## Changing a running app

Its owner's users depend on it. Change a copy first: on PocketBase Cloud, make a
preview (`create_preview`), change the preview, send the owner its link, and
ship it when they agree. Change live only when the owner asks for that.

## Tests

From the starters folder of the PocketBase Cloud repository:
`node tests/starters.test.mjs booking` runs this starter's tests on a real PocketBase.
