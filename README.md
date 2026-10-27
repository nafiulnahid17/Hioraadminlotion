# Hiora Studio — Separate Admin Application

A premium, responsive, dependency-free admin SPA built for **Hiora** customer care, customer attendance (enquiries/calls/follow-ups), and order fulfilment. Designed to deploy separately from the public [Hiora lotion landing page](https://github.com/nafiulnahid17/Hioralotionlanding).

## Project status

- **Frontend**: implemented and ready for Cloudflare Pages.
- **Offline demo**: works without credentials; sample data is saved only in your browser's localStorage.
- **Production database**: schema and RLS are provided in `supabase/schema.sql`, but **no Supabase project has been linked**.
- **Authentication**: email/password through Supabase Auth, with mandatory membership in `hiora_admins`. When configured, the demo disappears and only authorized accounts can enter.
- **Customer-facing checkout**: a *different app*. Do not deploy the admin UI, auth or routes with the public landing page.

## Features

- Dashboard cards for orders, collected revenue, customers and due follow-ups.
- 7-day order activity chart from actual order data.
- Orders table, search and filters, detail drawer, manual order creation, fulfilment and payment updates, courier/tracking details.
- Customer directory, search, customer profile, and order history.
- Customer **attendance**: due/overdue follow-up queue; log calls, messages, WhatsApp, outcomes and next follow-up datetime; recent contact timeline.
- Analytics: order stages, acquisition sources and payment channels.
- CSV export with spreadsheet-formula injection protection.
- Fully responsive desktop/mobile interface; separate mobile nav.
- Strict Cloudflare Pages security response headers and Supabase RLS.

## Run locally

Node.js 20+ is sufficient. There are **no external dependencies**.

```bash
npm run dev
# open http://localhost:4173
```

Or host the directory with any static server. Until Supabase keys are entered, the site opens in a clearly labeled demo mode. Sample records are fictional; no customer messages or orders are sent from demo mode.

## Deploy to Cloudflare Pages

1. Create a **new** GitHub repository named `hiora-admin` (separate from `Hioralotionlanding`), then push this folder.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Choose `Hioraadminlotion`; set **Framework preset: None**, **Build command: blank**, **Build output directory: `.`**, then deploy.
4. After Supabase is ready, edit `config.js` and redeploy. Only enter `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the public anon/publishable key). Do **not** put a `service_role` key in any public asset.
5. Use a separate subdomain such as `admin.your-domain.com`; keep the public order page at its own deployment.

Cloudflare Pages serves `_headers` to add CSP, frame protection, Referrer Policy, etc. The app's SPA rewrite is in `_redirects`.

## Set up Supabase for real orders

1. Create/select your Supabase project.
2. In Supabase → SQL Editor, execute `supabase/schema.sql` **once**.
3. In Authentication → Users, create a staff email/password account. Record its **Auth user UUID**.
4. In SQL Editor (with administrative privileges) authorize the account:

```sql
insert into public.hiora_admins(user_id, name, role)
values ('YOUR-REAL-AUTH-USER-UUID', 'Hiora Admin', 'admin');
```

5. Set the public project URL and publishable/anon key in `config.js`:

```js
window.HIORA_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-SUPABASE-ANON-OR-PUBLISHABLE-KEY',
};
```

6. Deploy again and sign in with the actual Supabase staff account.
7. In Supabase Auth, enable email confirmation and configure secure password policies as appropriate. Use your organization's MFA/SSO option if required.

**Security:** The admin tables have no anonymous policies. An authenticated Supabase account **without a row in `hiora_admins` cannot read or write any admin records**. Only staff records inserted through a trusted administrator in the SQL Editor grant access. This is not just a frontend route check.

## Connect the PUBLIC Hiora landing page later

The existing public app has its own checkout form for APLB lotion orders (offer ৳1,580, Dhaka delivery ৳80, outside Dhaka ৳150; bKash, Nagad and Cash on Delivery). This admin system uses corresponding default pricing for **manual** orders. The admin tables are `hiora_customers`, `hiora_orders` and `hiora_interactions`.

**Do not** give anonymous users direct INSERT/SELECT access to these tables or expose Supabase service-role keys in public JavaScript. Instead deploy a separate validated, rate-limited Cloudflare Worker or Supabase Edge Function for public checkout. On verified orders, that backend should:

1. Validate product, delivery district, order quantity, phone, and payment method; calculate the price and delivery charge server-side (never trust totals sent by the browser).
2. Create or match the customer and safely create an order using server-side privileged credentials only.
3. Return a reference order code to the checkout UI. Add anti-spam/rate limiting and relevant notification logic.
4. Restrict CORS to the public Hiora site; do not leak customer data in API responses.

**No public landing-page order synchronization is enabled yet.** Doing so requires configuring a database project and a secure intake endpoint.

## Git push after creating repo

```bash
git init
git add .
git commit -m "feat: standalone Hiora Studio admin dashboard"
git branch -M main
git remote add origin https://github.com/nafiulnahid17/Hioraadminlotion.git
git push -u origin main
```

Replace remote URL if you choose a different repository name. Do not push `config.js` with secrets; public Supabase anon keys are meant to be exposed, but service keys are not.

## Database model

| Table | Purpose |
|---|---|
| `hiora_admins` | Whitelisted staff linked to Supabase Auth IDs |
| `hiora_customers` | Customer contact info and follow-up statuses |
| `hiora_orders` | Orders, totals, payment and fulfilment progress |
| `hiora_interactions` | Attendance history, contact outcomes and next follow-ups |

The schema uses `numeric(12,2)` for prices and a calculated `total` column to protect order totals against mismatches from admin UI updates. RLS denies all access except authenticated staff.

## Notes

- The brand wordmark is a **typographic placeholder** until the official Hiora logo asset is supplied.
- CSV exports contain personal details; share only with authorized staff.
- This is a working frontend and schema, **not a live paid-order service** until configured and integrated with a secure public checkout endpoint.
