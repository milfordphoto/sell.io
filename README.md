# sell.io
Sell Camera Gear

# Milford Photo Used Gear Quote Prototype
This is a static prototype to test a custom used-gear quote app between the Milford Photo header and footer.

## What This Prototype Does
- Simulates an instant offer pending physical verification.
- Lets a customer choose gear, condition, accessories, payout preference, and delivery method.
- Shows shipping eligibility based on the working policy:
  - Free inbound label at $250+ estimated cash value.
  - Staff approval for $1,500+ labels.
  - Manual review for vintage, rare, damaged, estate, or unknown gear.
- Shows a customer receipt preview.
- Shows a Milford Photo staff notice preview.
- Sends iframe height updates to the parent page.

## What This Prototype Does Not Do Yet
- It does not send real emails.
- It does not generate real UPS/FedEx labels.
- It does not store customer data.
- It does not connect to Dakis, Amber, PayPal, Stripe, or eBay.
- It does not use real Milford Photo pricing data yet.

## Dakis Test Instructions
1. Host this folder somewhere public, such as Netlify, Cloudflare Pages, GitHub Pages, or a temporary staging domain.
2. Open `embed-snippet.html`.
3. Replace:
   `https://YOUR-PROTOTYPE-URL-HERE/index.html`
   with the public URL where `index.html` is hosted.
4. Paste the full snippet into a Dakis custom HTML section on a hidden test page.
5. Test desktop and mobile page behavior.

## Local Preview
From this folder, run:
```bash
python3 -m http.server 4173
```

Then open:
```text
http://localhost:4173
```

## Recommended Test Checklist
- The iframe appears between the Dakis header and footer.
- The iframe is full width and does not show double scrollbars.
- The iframe height adjusts while moving between steps.
- The app works on mobile inside Dakis.
- Dakis does not block the iframe or strip the script.
- The styling is not broken by Dakis page CSS.
- The Sell Your Gear page can keep Milford Photo's existing trust copy above or below the app.
