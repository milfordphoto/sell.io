# Milford Photo Used Gear Quote App

Customer-facing used equipment quote app for Milford Photo.

This static frontend is currently embedded on the Milford Photo Dakis page with an iframe. It calls the Cloudflare Worker backend for quote pricing and quote submission.

## Files

- `index.html` - customer quote app shell
- `styles.css` - customer quote app styles
- `app.js` - customer quote app behavior
- `catalog*.js` - camera/lens category and model catalog data

## Hosting

This repository can be hosted by GitHub Pages for testing. The production plan is to move the live app URL to Cloudflare, likely at `sell.milfordphoto.com`, while keeping this repository as the code source.

## Security

Do not commit API keys, tokens, Shippo credentials, SendGrid keys, Airtable tokens, eBay credentials, or staff passwords to this repository.
