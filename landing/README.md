# Landing page starter

A launch page with a waitlist: hero, features, how it works, FAQ and a contact
form. Sign-ups and messages land in your PocketBase.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Words**: the headline, features, steps and FAQ in
   `pb_hooks/views/pages/home.html`; the one-line pitch is `PITCH` in
   `pb_hooks/views.js`.
3. **Social proof**: "Join N people" shows once the list reaches
   `SOCIAL_PROOF_FROM` (25).

## Your sign-ups

Open the admin and look at `waitlist` (email, source, date) and `messages`
(contact form). Export either as CSV from the admin. Add `?ref=twitter` to
links you share and the `source` column tells you where people came from.

## Spam protection

Both forms have a hidden honeypot field and a rate limit (5 sign-ups and
3 messages per minute per visitor, under *Settings → Rate limits*). A repeat
sign-up gets the same answer as a new one, so the form never reveals who is
already on the list. Nobody but superusers can read either collection.
