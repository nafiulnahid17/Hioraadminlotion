# Deploy Hiora Admin on Cloudflare Pages

**Hiora Admin is a standalone static Cloudflare Pages app**, separate from the customer-facing Hiora Worker. Do not select Workers Builds or use Wrangler deploy for this app.

## Cloudflare Pages settings

- Repository: `nafiulnahid17/Hioraadminlotion`
- Production branch: `main`
- Framework preset: **None**
- Root directory: `/` (repository root)
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22.16.0` (`.node-version`)
- npm: `10.x`
- Environment variable to fix dependency-installation errors: **`SKIP_DEPENDENCY_INSTALL=1`** (set for production and preview). This is safe because the app has **zero third-party dependencies** and uses only Node.js built-in modules for its build.

Cloudflare Pages automatic install can be skipped using `SKIP_DEPENDENCY_INSTALL=1` according to the Cloudflare build-image docs: https://developers.cloudflare.com/pages/configuration/build-image/

Cloudflare build reference: https://developers.cloudflare.com/pages/configuration/build-configuration/

## What the build does

The deterministic `node scripts/build.mjs` build creates `dist/` containing only `index.html`, `config.js`, `assets/*`, `_headers`, and `_redirects`. Other repository content (SQL schema, tests, scripts, README, package configuration) is deliberately not included in public hosting.

The static frontend has no npm dependencies. A committed `package-lock.json` allows `npm ci --offline` and GitHub Actions CI to work without downloading packages.

## Fixing a previously failing Cloudflare deployment

1. In Cloudflare dashboard > Workers & Pages > select the **Pages** project that should host Hiora Admin. If an unrelated Workers project was selected, set up this repository as Pages instead.
2. Check Settings > Builds & deployments and set the root directory, branch, build command and output folder shown above.
3. Go to Settings > Environment variables and add `SKIP_DEPENDENCY_INSTALL` with value `1` for the deployment environments. If `NODE_VERSION` already exists and conflicts with `.node-version`, remove it or set `22.16.0`.
4. Redeploy the newest commit on `main`. The build log should show `Hiora Admin Pages build complete` and deploy the `dist` folder.
5. Check that the admin page loads and assets work on the `*.pages.dev` URL. Test the demo dashboard before connecting live data.

GitHub's build check (Syntax + smoke tests + asset build): https://github.com/nafiulnahid17/Hioraadminlotion/actions

## Supabase not connected yet

`config.js` currently has empty `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The app is **demo-only** until a real Supabase project, database schema, authorized staff account, and public config are set up. Do not use the sample records as real orders.

When the production project is ready, use only a **public Supabase publishable/anon key** in browser config; never commit a service-role or secret key. Admin row-level security policies are provided in `supabase/schema.sql`. Set up the public landing page's order ingestion separately and securely.

Do not merge Hiora Admin routes, auth or files into `Hioralotionlanding`.
