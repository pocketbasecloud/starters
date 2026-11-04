# Store starter

A clean catalogue for a small shop: category filters, sorting, product pages
with an image gallery, and checkout through Stripe Payment Links. No cart code
and no card data on your server.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Products**: replace the samples in `products`. Price is in cents
   (`2800` is $28.00); upload up to four images; tick **active** to show it.
3. **Checkout**: in Stripe, create a Payment Link for each product and paste
   it into the product's **checkout** field. Set the link's confirmation page to
   `https://<your site>/thanks`.

Currency symbol and tagline are at the top of `pb_hooks/views.js`.

## Orders

Stripe keeps the orders, receipts and customer emails. See them in your Stripe
dashboard. Products without a checkout link show "Not on sale yet".

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/store.pb.js` | Routes: `/`, `/shop/catalog`, `/products/{slug}`, `/thanks` |
| `pb_hooks/views.js` | Templates, sorting and price formatting |
| `pb_public/style.css` | Layout and look |
