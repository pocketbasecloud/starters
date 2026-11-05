# Notes for coding agents

This is the `api` starter: one PocketBase whose API is the product.
Read this before changing it.

## Where things are

- `pb_migrations/`: collections (notes), API rules and sample data. Add a
  new migration for a change; never edit one that has run.
- `pb_hooks/api.pb.js`: routes. A handler runs in its own context, so `require()` helpers
  inside it; top-level functions in a `.pb.js` file are not visible to handlers.
- `pb_hooks/`: the custom route and record hooks.

## Rules that keep it safe

- There are no pages: the API rules are the security boundary. Keep `owner = @request.auth.id` and the rule that stops handing a note to someone else.
- Templates escape every value; use `{{raw}}` only for HTML the owner wrote.
- Copy a list PocketBase returns (`[...records]`) before sorting or reversing it.

## Changing a running app

Its owner's users depend on it. Change a copy first: on PocketBase Cloud, make a
preview (`create_preview`), change the preview, send the owner its link, and
ship it when they agree. Change live only when the owner asks for that.

## Tests

From the starters folder of the PocketBase Cloud repository:
`node tests/starters.test.mjs api` runs this starter's tests on a real PocketBase.
