# PAMA website

The plain HTML version of [pan-american.org](https://www.pan-american.org), rebuilt from the Squarespace site in October 2026. There is no build step: every page is a static HTML file, published with GitHub Pages from the `main` branch.

## Layout

- `index.html` is the home page; every other page is a folder with its own `index.html` (for example `about/index.html` serves `/about/`).
- `assets/css/site.css` holds all styles; `assets/js/site.js` runs the mobile menu and the campaign pop-up.
- `assets/img/` holds the site's images, resized for the web.
- `404.html` is the not-found page. Its links resolve from the site root, so it works at any URL depth.
- `cart/`, `more/` and `home/` are redirect pages for old Squarespace URLs.
- `.nojekyll` tells GitHub Pages to serve the files exactly as they are.

All internal links are **relative** (for example `../donate/`), so the same files work at the GitHub test address (`/PAMA/`) and at `www.pan-american.org`. Keep that pattern when adding pages or links.

The header, footer and "Opportunities to serve" band are repeated on every page, so a change to one of them needs to be made in each file.

## Preview locally

From this folder run `python3 -m http.server`, then open http://localhost:8000. In VS Code, the Live Server extension works too.

## Going live on www.pan-american.org

1. Add a file named `CNAME` at the top of the repo containing `www.pan-american.org`.
2. At the domain provider, point `www` to `pan-american-medical-association.github.io` (a CNAME record) and the bare domain to GitHub's four Pages IP addresses (A records).
3. In **Settings → Pages**, confirm the custom domain and tick **Enforce HTTPS** once it's available.

Don't add the `CNAME` file before the DNS change: GitHub would start sending visitors from the test address to www.pan-american.org, which would still show the Squarespace site.

## Before going live

- **Forms:** replace `https://formspree.io/f/YOUR_FORM_ID` on the contact, volunteer, work-application, member and newsletter pages with a real form endpoint.
- **Financial Transparency:** figures come from the "The PAMA- Financial Books" Google Sheet (Totals, Category Summary and Expenses tabs). Update the page when the books change.
- **Blog posts:** the six article pages linked from `/blog/` still need to be built from the Squarespace blog export.
- **Member and SMIT pages:** add membership tiers and the full SMIT text.
- **Member login and shop:** a static site needs an outside service for these (for example Memberstack or Outseta for logins; PayPal, Stripe Payment Links or Snipcart for the shop).