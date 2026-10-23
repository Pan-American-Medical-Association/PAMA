# PAMA website

The plain HTML version of [pan-american.org](https://www.pan-american.org), rebuilt from the Squarespace site in October 2026. There is no build step: every page is a static HTML file.

## Layout

- `index.html` is the home page; every other page is a folder with its own `index.html` (for example `about/index.html` serves `/about`).
- `assets/css/site.css` holds all styles; `assets/js/site.js` runs the mobile menu and the campaign pop-up.
- `404.html` is the not-found page.
- `_redirects` maps old Squarespace URLs (`/cart`, `/more`, `/home`). It works on Netlify and Cloudflare Pages, not on GitHub Pages.

The header, footer and "Opportunities to serve" band are repeated on every page, so a change to one of them needs to be made in each file.

## Preview locally

From this folder run `python3 -m http.server`, then open http://localhost:8000. In VS Code, the Live Server extension works too.

## Before going live

- **Forms:** replace `https://formspree.io/f/YOUR_FORM_ID` on the contact, volunteer, work-application, member and newsletter pages with a real form endpoint.
- **Images:** images still load from Squarespace's servers. Download them into `assets/img/` and update the links before canceling Squarespace.
- **Blog posts:** the six article pages linked from `/blog` still need to be built from the Squarespace blog export.
- **Member and SMIT pages:** add membership tiers and the full SMIT text.
- **Charts:** paste the two Google Sheets chart embeds on the Financial Transparency page where the comments mark them.
