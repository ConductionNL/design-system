# Cutover runbook: connext.conduction.nl → conduction.nl

The new Conduction hub site lives in `sites/www/`. Until cutover it deploys to `connext.conduction.nl` (the existing CNAME). Cutover repoints `conduction.nl` at this repo's GitHub Pages build, retires the old `conduction-website` repo's claim, and switches on the Cloudflare Worker that 301-redirects the two vanity domains.

Outage during DNS propagation is acceptable per agreement with the user (we are migrating anyway).

## Pre-flight

- [ ] **Phase 3 PR (#4 brand-strip) merged into `main`**
- [ ] **Phase 4 PR (#5 NL translations) merged into `main`**
- [ ] **Phase 5 PR (this branch, `phase-5-cutover`) reviewed but NOT merged yet** — merging it flips the `static/CNAME` and triggers GitHub Pages to claim `conduction.nl`. Hold the merge until step 4 below.
- [ ] **Conduction-website CNAME-removal PR opened and reviewed but NOT merged yet** — merging it removes the existing `conduction-website` claim. Hold until step 4.

## Order of operations on cutover day

The flips below need to land in this order. The whole sequence is roughly 5 minutes of clock time; DNS propagation tail can run for an hour or two but is invisible to most visitors.

1. **Merge the conduction-website CNAME-removal PR.** GitHub Pages on `conduction-website` releases its claim on `conduction.nl` within ~30 seconds. The domain is briefly unowned by any GitHub Pages site.
2. **Merge Phase 5 cutover PR (this branch).** GitHub Pages on `design-system` claims `conduction.nl`. Within a minute the new site at `https://conduction.nl/` is live, served from `sites/www/build/`.
3. **Smoke-test the canonical:**
   - `https://conduction.nl/` shows the Public Tech landing
   - `https://conduction.nl/connext` shows ConNext-flavoured landing, navbar wordmark switches
   - `https://conduction.nl/commonground` shows Common Ground landing, navbar wordmark switches
   - `https://conduction.nl/nl/` shows the Dutch home
4. **Deploy the Cloudflare Worker** (only after step 3 confirms canonical works):
   ```bash
   cd sites/www/cloudflare
   wrangler login                    # if not already
   wrangler deploy
   ```
   `wrangler.toml` declares the routes (`connext.conduction.nl/*` and `commonground.conduction.nl/*`). Deployment is idempotent.
5. **Smoke-test the vanity domains:**
   - `https://connext.conduction.nl/` 301s to `https://conduction.nl/connext` (or `/nl/connext` for `Accept-Language: nl-NL,...`)
   - `https://commonground.conduction.nl/` 301s to `https://conduction.nl/commonground` (or `/nl/commonground`)
   - Trailing slashes, sub-paths, and query strings preserved
6. **Update DNS for the vanity hosts** (only required if they aren't already proxied through Cloudflare; check the current setup before touching DNS):
   - `connext.conduction.nl` → CNAME flatten or A record into Cloudflare's anycast
   - `commonground.conduction.nl` → same
   - Cloudflare's "Route a request to a Worker" pages do this automatically when the route binding is added if the host already passes through Cloudflare.

## Rollback

If something goes wrong and the canonical site is broken on `conduction.nl`:

1. Revert the Phase 5 cutover commit (or merge a revert PR), or change `sites/www/static/CNAME` back to `connext.conduction.nl` and push.
2. Revert the conduction-website CNAME-removal commit so the old marketing site comes back online.
3. Delete the Worker route in Cloudflare (or `wrangler delete --name conduction-vanity-redirects`).

DNS propagation will take a few minutes to flip back; in the worst case the canonical is unreachable for ~10 minutes during the rollback. The vanity domains stay reachable as long as the Worker is active.

## Open items (decisions for cutover day, not part of this PR)

- **Cloudflare account / zone owner.** Confirm who has admin rights on the `conduction.nl` zone and the Worker namespace.
- **Wrangler version pinning.** The `wrangler.toml` works with Wrangler 3.x. CI/CD wrappers can pin to a specific version if you want reproducible deploys.
- **Worker observability.** Cloudflare's Workers analytics give 301 counts per route for free. If you want per-locale split, add a `cf.cacheKey` log line or wire up Logpush.
- **Should the Worker also handle bare `conduction.nl/` redirects?** Currently no, because the canonical IS `conduction.nl/`. If a future scenario emerges (e.g., temporary maintenance redirect), extend `VANITY_TO_SECTION` and add a route binding for `conduction.nl/*`.

## What changed in this PR

- `sites/www/cloudflare/worker.js`: the redirect Worker, ~100 lines.
- `sites/www/cloudflare/wrangler.toml`: route bindings for both vanity domains.
- `sites/www/static/CNAME`: flipped from `connext.conduction.nl` to `conduction.nl`. This is the one change that actually triggers the GitHub Pages cutover when this PR is merged.
- `briefs/cutover-runbook.md`: this document.

## What did NOT change

- The conduction-website repo CNAME removal is a separate PR on that repo (link will go in this PR's description).
- Cloudflare DNS records for `connext.conduction.nl` and `commonground.conduction.nl` are managed in the Cloudflare console; they don't need to move unless you previously had them point straight at GitHub Pages and want them off the Pages stack now that the Worker handles them.
