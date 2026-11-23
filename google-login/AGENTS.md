# Notes for coding agents

This is the `google-login` starter: one PocketBase whose hooks render every
page and whose users sign in with Google. Read this before changing it.

## Where things are

- `pb_migrations/`: turns password sign-in off and maps Google's name and
  photo to `name` and `avatar`. Add a new migration for a change; never edit
  one that has run.
- `pb_hooks/main.pb.js`: routes. A handler runs in its own context, so
  `require()` helpers inside it.
- `pb_hooks/views.js`: reads the signed-in user and picks a template.
- `pb_hooks/views/`: HTML templates (Go `html/template`) and the generated
  `icons.html`.
- `pb_public/app.js`: finds the provider whose display name is `Google` (or
  named `google`) and calls `authWithOAuth2`. Do not hard-code `oidc`: the
  slot can be `oidc2` or `oidc3`.

## Rules that keep it safe

- Never configure the Google provider from a migration or hook: PocketBase
  Cloud's Google sign-in is managed by the platform, and an own Google app's
  secret does not belong in the repository.
- Routes that show user data use `$apis.requireAuth("users")` and read only
  `e.auth`.
- Templates escape every value.

## Changing a running app

Its owner's users depend on it. Change a copy first: on PocketBase Cloud, make a
preview (`create_preview`), change the preview, send the owner its link, and
ship it when they agree. Change live only when the owner asks for that.

## Tests

From the starters folder of the PocketBase Cloud repository:
`node tests/starters.test.mjs googleLogin` runs this starter's tests on a real
PocketBase with a fake Google.
