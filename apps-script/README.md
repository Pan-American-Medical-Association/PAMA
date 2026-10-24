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
