# Google login starter

The smallest app with "Sign in with Google": one button, a profile page, and a
route that only signed-in users can open. No passwords.

It works with either Google option on PocketBase Cloud:

- **PocketBase Cloud's Google sign-in**: open the PocketBase in the portal, go
  to **Auth** and turn on **Google sign-in**. No Google Cloud project needed.
- **Your own Google app**: on the same page, choose **Use my own Google app
  instead** and follow the steps.

Until one of them is on, the page says so and the button stays disabled.

Guide: https://pocketbasecloud.com/docs/pocketbase/google-sign-in/

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Your data**: add collections in `pb_migrations` with an owner field, like
   the `app` starter's `tasks`.
3. **Other sign-in methods**: the first migration turns password sign-in off.
   Turn it back on in the Auth page if you want both.

## Where things are

| File | What it does |
| --- | --- |
| `pb_public/app.js` | Finds the Google provider and signs in with the PocketBase SDK |
| `pb_hooks/main.pb.js` | Routes; `/app/me` needs a signed-in user |
| `pb_hooks/views.js` | Reads the signed-in user for the profile |
| `pb_hooks/views/` | Templates: `pages/home.html`, `partials/profile.html` |
| `pb_migrations/` | Google-only users: password sign-in off, Google name and photo copied to `name` and `avatar` |
