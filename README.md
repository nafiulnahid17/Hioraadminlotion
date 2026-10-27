# Hiora Admin — Customer Attendance & Orders

Independent admin application for Hiora, separate from the customer-facing `Hioralotionlanding` website.

Features include order fulfilment, customer directory, attendance/follow-ups, sales analytics, CSV exports and Supabase-ready authentication/database policy. The frontend supports a local demo mode until Supabase is configured.

The full source files are published in this repository. Cloudflare Pages: framework `None`, build command blank, output directory `.`. Set public Supabase project URL and publishable/anon key in `config.js` only when ready; never expose a service role key in frontend assets.

This repository is for Hiora staff only; do not deploy admin code or auth in the public checkout site.
