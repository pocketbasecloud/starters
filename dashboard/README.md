# Dashboard starter

An internal tool for your team: staff sign in, see key numbers and work
through a filterable, searchable orders table, changing status in place.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Staff**: add people in the admin under `users`. Public sign-up is closed.
3. **Your data**: replace `orders` with your own collection, or keep its
   shape and import your rows from CSV in the admin. Totals are in dollars
   (`129.5`).

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/dashboard.pb.js` | Routes; all `/app/*` routes need a staff token |
| `pb_hooks/views.js` | Metrics, table rows and statuses |
| `pb_public/app.js` | Sign-in with the PocketBase SDK and htmx auth headers |
