# App starter

A web app with accounts: people sign up, sign in and keep their own task list.
Every task belongs to its owner; nobody can see or change anyone else's.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Your data**: rename `tasks` and add the fields your app needs in
   `pb_migrations`. Keep the `user` field and the owner rules.
3. **Email**: configure *Mail settings* in PocketBase to send password resets.

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/tasks.pb.js` | Routes; every `/app/*` route needs a signed-in user |
| `pb_hooks/views.js` | Templates and the owner check |
| `pb_public/app.js` | Sign-up and sign-in with the PocketBase SDK |
