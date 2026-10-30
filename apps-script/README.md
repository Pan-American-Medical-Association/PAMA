# PAMA Website Forms — Setup Guide

Spreadsheet: **PAMA Website Submissions** (Drive → PAMA Website Forms)
https://docs.google.com/spreadsheets/d/1Xu3_oxAGN0D-jShCKjek2CiO6KShGT5gDCniKFUgELs/edit

## What happens when someone submits a form
1. A row is added to the matching tab (Contact Us, Volunteer Applications, Work Applications, Membership Applications, Newsletter Signups).
2. admin@pan-american.org and info@pan-american.org get an email with every answer (reply goes straight to the person).
3. The person gets a short confirmation email.
4. If they left "Send me PAMA news" checked, they are added to **donors@pan-american.org**.
5. Résumés are saved to the "Résumés (website applications)" folder and linked in the row.

## One-time setup (about 10 minutes, as admin@pan-american.org)
1. Open the spreadsheet → **Extensions → Apps Script**.
2. Click the gear (**Project Settings**) → tick **Show "appsscript.json" manifest file in editor**.
3. Back in **Editor**: replace the contents of `appsscript.json` with the file in this folder, and replace `Code.gs` with `Code.gs` from this folder. Save.
4. Choose the function **setup** in the toolbar → **Run** → approve the permissions (it needs Sheets, Gmail sending, Drive for résumés, Google Groups, and PayPal verification).
   - The log should say "Group OK: donors@…" and "Group OK: members@…".
5. **Deploy → New deployment → Select type: Web app**
   - Execute as: **Me (admin@pan-american.org)**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
6. The current Web app URL is already set in `assets/js/forms.js` (`ENDPOINT`).

## Google Groups: allow outside email addresses
Most donors and members use Gmail or work addresses, so both groups must accept external members:
- Admin console → **Apps → Google Workspace → Groups for Business → Sharing settings** → allow **Group owners can allow external members**.
- Then for **donors@** and **members@**: Groups → group → **Settings → Allow members outside your organization: On**.

## PayPal memberships → members@pan-american.org
1. PayPal → **Account Settings → Website payments → Instant payment notifications → Update**.
2. Notification URL: the same Web app URL from step 5. Choose **Receive IPN messages (Enabled)** → Save.
3. When you create the membership buttons/links, include the word **Membership** in the item name (for example "PAMA Membership – Physician (Monthly)").

What the script does with PayPal messages (every message is checked with PayPal first, and logged on **PayPal Log**):
| PayPal event | Result |
|---|---|
| New subscription or completed membership payment | Row on **Members** = Active, added to members@, welcome email, team notified |
| Monthly payment | Extends access 31 days (+7-day grace) |
| One-time annual payment | Access for one year |
| Subscription cancelled | Keeps access until the paid period ends |
| Subscription ended / expired, refund or reversal | Removed from members@ |

A daily job (`syncMembersGroup`, 6 AM) removes members whose access has expired and re-adds anyone marked Active. To add someone by hand, add a row to **Members** with Status = Active and an "Access expires" date, then run `syncMembersGroup`.

## Changing the forms later
Edit the form on the website page, and add a matching column header to the sheet tab (the script places answers by header name). After editing `Code.gs`: **Deploy → Manage deployments → Edit → Version: New version → Deploy** (the URL stays the same).

## Live configuration (October 2026)
- Web app URL (forms + PayPal IPN): https://script.google.com/macros/s/AKfycby1f1Q47q7VQ6Ds6yULHwH3TM8vAi_zIMVkr-lnVMXa576JRlMqaUxFAAzOUxU9c_mF/exec
- PayPal IPN: enabled, pointing to the URL above.

### Membership payment options (PayPal product "PAMA Membership")
| Tier | Monthly subscription plan | Annual one-time link |
|---|---|---|
| Physician | $25 — plan P-3W156362404791359NLODANY | $300 — https://www.paypal.com/ncp/payment/EAAS5XWUCHZAS |
| Resident, PA, NP or RN | $20 — plan P-37A50278G67210304NLODBGY | $240 — https://www.paypal.com/ncp/payment/5RXGH76CNCPEL |
| General supporter | $15 — plan P-4W369231Y3881131RNLODCEA | $180 — https://www.paypal.com/ncp/payment/T4VJUZ725TYKA |
| Medical student | $5 — plan P-86E67825UB359114ANLODEEI | $60 — https://www.paypal.com/ncp/payment/3R3BMQGN5H6D6 |

Monthly subscribe link format: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=PLAN_ID

## Member portal (www.pan-american.org/members/)

**How sign-in works:** a member types their email. If it is an active member on the **Members** tab (In members@ group = Yes, not expired), the script emails a 6-digit code that works for 10 minutes. There are no passwords. A signed-in session lasts 30 days on that device (or until the browser closes, if they untick "Keep me signed in"). Every page load re-checks the Members tab, so when a membership lapses, portal access ends at the same time. Emails that aren't active members are sent to the membership page. `admin@` and `info@` can always sign in to preview the portal.

**Install (one time, about 5 minutes):**
1. Open the Apps Script project (Extensions → Apps Script from the PAMA Website Submissions spreadsheet).
2. Replace everything in **Code.gs** with the new `apps-script/Code.gs` (two small changes: it sends portal requests to Portal.gs, and the welcome email links to the portal).
3. Click **+ → Script**, name it **Portal**, and paste in `apps-script/Portal.gs`.
4. Choose **setupPortal** in the function menu and click **Run**. It creates the signing key and confirms the portal tabs.
5. **Deploy → Manage deployments →** pencil icon → Version: **New version** → **Deploy**. The web app URL stays the same, so the website needs no change.

**Managing content — no design work:** edit rows in these tabs. Changes appear in the portal within 5 minutes (run `refreshPortalNow` to show them immediately).

| Tab | What it controls | Tips |
|---|---|---|
| Portal Announcements | Overview announcements | Pinned = Yes keeps it on top; Show = No hides it |
| Portal Events | Events tab and "Next up" | Date as YYYY-MM-DD; past events disappear automatically; members can add events to their calendar |
| Portal Resources | Resources tab | Category creates the filter buttons |
| Portal Opportunities | Opportunities tab and "Get involved" | Type creates the filter buttons; links can be web pages or mailto: |
| Member Profiles | Written by members from "My profile" | Show in directory = Yes lists them for other members |

Each tab has an **EXAMPLE** row (hidden with Show = No) to copy.

## Ask PAMA chat assistant (home page)

The "Ask PAMA" box on the home page sends questions to this same web app (`action: chat_ask`, handled in `Chat.gs`). Claude answers using a private search index of the English website pages and *Medicina General Integral*, Vols. I–V (ECIMED, 2014). Answers cite their sources.

- **Index:** 97 files in the Drive folder **"PAMA Chat Index (private — do not share)"** (ID `1_qxGcGbdhlILZP7vA75hRh7KRdJbb4ds`), owned by admin@. The book text is copyrighted, so never share this folder or commit the index to GitHub.
- **Rebuild the index** after big website changes or when adding books: `python3 tools/chat/build_index.py <folder of pdftotext .raw.txt files> . <out dir>`, then replace the files in the Drive folder.
- **Log:** each question goes to the **Chat Log** tab: time, language, question, sources and token counts. No names, emails or IP addresses are stored.
- **Limits:** 20 questions per visitor per hour. There is also a site-wide daily cap (Script property `CHAT_DAILY_LIMIT`, default 400).

### One-time setup

1. Create an API key at console.anthropic.com (Settings → API keys), signed in with the PAMA account. Add a monthly spend limit under Billing → Limits.
2. In Apps Script, open **Project Settings → Script properties** and add `ANTHROPIC_API_KEY` with the key as its value. Only paste the key here; never put it in website code or email it.
   - Optional: `CHAT_MODEL`, default `claude-sonnet-5-5`; use `claude-haiku-5-5` for a lower cost.
   - Optional: `CHAT_DAILY_LIMIT`.
3. Add a new script file named **Chat** and paste in `apps-script/Chat.gs` from GitHub. Also re-paste `Code.gs`, which adds one routing line.
4. Select `testChatSearch` and click **Run**. Google will ask for two new permissions, Drive (to read the index) and external requests (to call Claude); approve them. The log should list MGI chapters and PAMA pages.
5. Run `testChatAnswer` to confirm Claude responds.
6. Go to **Deploy → Manage deployments → "Website forms" → Edit**, choose **New version**, then **Deploy**. Keep the same URL.

Until the key is set, the chat box shows: "The assistant is almost ready."
