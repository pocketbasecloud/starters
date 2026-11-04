# Booking starter

Online booking for appointments: visitors pick a service, a day and a free
time, and get a confirmation email. Staff see the schedule at `/staff` and can
cancel bookings. Double bookings are impossible: times are checked inside a
database transaction.

## Change these first

1. **Name and email**: set *Application name*, then configure *Mail settings*
   (SMTP and sender address) in PocketBase so confirmations are delivered.
2. **Opening hours**: `OPEN_DAYS`, `OPEN_HOUR`, `CLOSE_HOUR`, `STEP_MINUTES`,
   `DAYS_AHEAD` and `NOTICE_MINUTES` at the top of `pb_hooks/views.js`.
   Set `UTC_OFFSET_MINUTES` to your time zone, for example `-300` for New York
   in winter. Change it when your clocks change.
3. **Services**: edit `services` in the admin (length in minutes, price in
   cents, `0` shows as Free).

## Staff

Add staff in the admin under `users`; there is no public sign-up. Staff sign in
at `/staff`. Bookings are hidden from the public API.

## Spam protection

The form has a honeypot field and a rate limit of 5 bookings per minute per
visitor (*Settings → Rate limits*).
