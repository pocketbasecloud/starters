# Store starter

A clean shop for a small business: category filters, sorting, product pages
with a gallery, a cart, Stripe Checkout, and an orders page for your team.
Card details never touch your server.

## Change these first

1. **Name and look**: set *Application name* in PocketBase settings, and the
   currency, tagline and shipping note in the `settings` collection.
2. **Products**: replace the samples in `products`. Price is in cents
   (`2800` is 28.00); upload up to four images; tick **active** to show it.
3. **Checkout**: choose one of the two ways below.

## Checkout

**Cart and Stripe Checkout (recommended).** Set these environment variables on
the PocketBase instance, then redeploy:

| Variable | Where to find it |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_live_…` or `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → add endpoint `https://<your site>/stripe/webhook` with the events `checkout.session.completed` and `checkout.session.expired`; copy its signing secret (`whsec_…`) |

Also set *Application URL* in PocketBase settings so Stripe sends buyers back
to the right address.

With the key set, product pages show **Add to cart**. The cart lives in a
cookie, prices are always read from your database, and checkout creates a
pending order before sending the buyer to Stripe. The signed webhook marks the
order paid, records the customer and writes the audit log. Forged, stale or
repeated webhooks are ignored.

**Payment Links (no setup).** Without a Stripe key there is no cart. Paste a
Stripe Payment Link into a product's **checkout** field and its page shows
**Buy now**. Stripe keeps those orders.

## Your team

Add staff in the admin under `staff`; there is no public sign-up. Staff sign
in at `/staff` to see paid orders and mark them fulfilled or cancelled. Every
change is written to `audit_log` with who made it.

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/store.pb.js` | Shop pages: `/`, `/shop/catalog`, `/products/{slug}`, `/thanks` |
| `pb_hooks/checkout.pb.js` | Cart, `/checkout` and `/stripe/webhook` |
| `pb_hooks/staff.pb.js` | `/staff` orders page; its data routes need a staff token |
| `pb_hooks/lib/` | Cart cookie, Stripe calls and signature check, orders, settings, audit log |
| `pb_hooks/views/` | Templates: `pages/`, `partials/` and the layout |
| `pb_public/style.css` | Layout and look |

`STRIPE_API_URL` is only for tests: it points the starter at a fake Stripe.
