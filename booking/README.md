# Booking starter

Online booking for a small team: visitors pick a service, a person (or anyone
available), a day and a free time, and get a confirmation email. Staff sign in
at `/staff` to see their schedule or everyone's, and cancel bookings. Double
bookings are impossible: times are checked inside a database transaction.

## Change these first

1. **Name and email**: set *Application name*, then configure *Mail settings*
   (SMTP and sender address) in PocketBase so confirmations are delivered.
2. **Your team and hours**: replace the sample people in `staff` (Sam and Alex
   have random passwords; set a real email and password for each person) and
   their weekly hours in `shifts` (weekday, start and end, such as 09:00 to
   17:30).
3. **Services and rules**: edit `services` (length in minutes, price in cents,
   `0` shows as Free, and who offers it). In `settings`, set your time zone as
   minutes from UTC (`-300` for New York in winter; change it when your clocks
   change), how often a booking can start, how far ahead people can book, and
   the shortest notice you accept.

## How times are worked out

For the chosen service and day, each person who offers the service and has a
shift that day gets slots from the start of their shift, every *slot minutes*,
as long as the whole booking fits before the shift ends and does not overlap
one of their bookings. "Anyone available" shows every time at least one person
is free and books the first of them.

## Staff and records

Staff sign in with their own `staff` accounts; there is no public sign-up.
Bookings, shifts and the `audit_log` are only visible to signed-in staff.
Every booking and cancellation is written to `audit_log` with who made it.

## Templates

The booking page is `pb_hooks/views/pages/book.html`, the staff page
`pages/staff.html`, and the confirmation email
`pb_hooks/views/emails/booking-confirmed.html`. The logic is in
`pb_hooks/lib/` (`availability.js` works out free times).

## Spam protection

The form has a honeypot field and a rate limit of 5 bookings per minute per
visitor (*Settings → Rate limits*).
