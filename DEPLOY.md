# Deploying LearnNextDoor to Vercel + Supabase

End-to-end runbook. Total time: ~25 minutes, mostly waiting for DNS and the first Vercel build.

Order matters — set up the database **before** Vercel, because Vercel needs the DB URL at build time.

---

## 1. Create the Supabase project (5 min)

1. Go to https://supabase.com and sign up (GitHub sign-in is fastest).
2. Click **New project**.
3. Fill in:
   - **Project name:** `learnnextdoor`
   - **Database password:** click "Generate a password" and **save it somewhere safe** (1Password, Bitwarden, a note — you'll never see it again). You'll paste it into two connection strings in a moment.
   - **Region:** pick the one closest to your users. For Pitampura, Delhi → **ap-south-1 (Mumbai)**.
   - **Pricing plan:** Free tier is fine for MVP.
4. Wait ~2 minutes for the project to provision. You'll get a green checkmark when it's ready.

---

## 2. Grab the two connection strings (2 min)

Prisma on a serverless platform (Vercel) needs two URLs — one for runtime queries (through PgBouncer's pooler), one for schema operations (direct connection).

1. In your Supabase project, go to **Project Settings** (gear icon) → **Database** → **Connection string**.
2. Find the **Connection string** section. You'll see tabs or a dropdown with different modes. You need:
   - **Transaction** mode (port **6543**) — this is your `DATABASE_URL`
   - **Session** mode OR the **Direct connection** (port **5432**) — this is your `DIRECT_URL`
3. Copy each one and **replace `[YOUR-PASSWORD]`** with the password you saved in step 1.
4. For `DATABASE_URL` (the pooler), **append** this to the end: `?pgbouncer=true&connection_limit=1`

You should end up with something like:

```bash
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

> If your password contains special characters (`@`, `#`, `%`, etc.), URL-encode them. The safest option is to regenerate a password with only letters and numbers.

---

## 3. Push the schema + seed demo data (locally, against Supabase) (3 min)

Still on your Mac, in the project folder:

```bash
cd ~/Desktop/LearnNextDoorProduction

# Put the two URLs into your local .env (overwrite whatever's there)
cat > .env <<'EOF'
DATABASE_URL="postgresql://postgres.XXX:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.XXX:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
SESSION_SECRET="$(openssl rand -hex 32)"
OTP_DEV_MODE=true
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY
EOF

# Install + generate Prisma client with the new Postgres schema
npm install

# Create the tables on Supabase
npx prisma db push

# Populate demo data (8 providers, 8 classes, sample student, etc.)
npm run db:seed
```

Verify in the Supabase dashboard: **Table Editor** should now show all your tables (User, Provider, Class, Batch, etc.) populated with rows.

Smoke test locally: `npm run dev` and log in at http://localhost:3000/login with `aryan@example.com` (sample student). Since your local `.env` has `OTP_DEV_MODE=true`, the 6-digit code prints to your terminal and also appears as a yellow "Dev mode" banner in the UI. You should land on `/my-bookings` with sample bookings. If that works, your code is ready to deploy.

---

## 4. Push the code to GitHub (3 min)

Vercel deploys from a Git repo. If you haven't already:

```bash
cd ~/Desktop/LearnNextDoorProduction

# Make sure .env is ignored (it already is — verify)
cat .gitignore | grep -q "^.env$" && echo "OK, .env is ignored" || echo '.env' >> .gitignore

git init
git add -A
git commit -m "Initial commit — LearnNextDoor MVP"

# Create a new empty repo on github.com (do this in the browser), then:
git remote add origin git@github.com:YOUR-USERNAME/learnnextdoor.git
git branch -M main
git push -u origin main
```

**Double-check your `.env` is NOT in the commit.** Run `git log -p | grep DATABASE_URL` — if it finds anything, you leaked credentials. Rotate the Supabase password and the Anthropic key before continuing.

---

## 5. Import the repo on Vercel (5 min)

1. Go to https://vercel.com and sign up (GitHub sign-in).
2. **Add New → Project** → pick the `learnnextdoor` repo.
3. Vercel auto-detects Next.js. Leave the framework preset as-is.
4. **Root directory:** leave blank (the repo root is the project).
5. **Build & output settings:** leave defaults (`npm run build`, output `.next`).
6. **Environment Variables** — click "Add" for each of these:

| Name                | Value                                                  | Environments          |
|---------------------|--------------------------------------------------------|-----------------------|
| `DATABASE_URL`      | your pooled Supabase URL (port 6543, with pgbouncer flags) | Production, Preview, Development |
| `DIRECT_URL`        | your direct Supabase URL (port 5432)                   | Production, Preview, Development |
| `SESSION_SECRET`    | a fresh `openssl rand -hex 32` value (different from local!) | Production, Preview, Development |
| `OTP_DEV_MODE`      | `false` (see section 6.5 for Resend; use `true` only if you haven't wired email yet) | Production, Preview, Development |
| `RESEND_API_KEY`    | your Resend key (`re_xxxxxxxx`) — see section 6.5      | Production, Preview, Development |
| `EMAIL_FROM`        | `LearnNextDoor <onboarding@resend.dev>` or your verified sender | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | your key (`sk-ant-...`)                                | Production, Preview, Development |
| `ADMIN_SEED_USERNAME` | your first Super Admin username (e.g. `superadmin`) | Production, Preview, Development |
| `ADMIN_SEED_PASSWORD` | a strong 12+ char password with upper/lower/digit/symbol | Production, Preview, Development |
| `ADMIN_SEED_EMAIL`    | admin contact email (e.g. `admin@learnnextdoor.in`)  | Production, Preview, Development |
| `ADMIN_SEED_NAME`     | display name shown in the admin shell                | Production, Preview, Development |

For real WhatsApp / SMS delivery later, add: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.

> **Admin portal note:** the Super Admin account is **seeded on demand the first time someone visits `/admin/login`** and no admin rows exist. Set the four `ADMIN_SEED_*` vars before your first login, then sign in at `https://yourdomain.com/admin/login`. The portal is excluded from the public `robots.txt` and has no homepage link — you reach it only by typing the URL.

7. Click **Deploy**. Watch the build log. First build takes ~2 minutes.

---

## 6. Smoke-test the deployment (3 min)

Vercel gives you a `https://learnnextdoor-xxx.vercel.app` URL when the build finishes. Click through:

- `/` — landing page loads with trending classes (8 seed classes)
- `/browse` — all classes render, search works
- `/login` — enter `aryan@example.com` (sample student). If `OTP_DEV_MODE=true`, check **Vercel Logs** (Deployments → latest → Runtime Logs) for the printed code. If `OTP_DEV_MODE=false` + Resend is wired (section 6.5), change the email to your real address to receive the code.
- `/my-bookings` — should show the seed student's bookings
- `/provider/login` — log in as `sunita@nritya.com` → Nritya Academy dashboard
- **Ask Zoe** button → ask "something for my 8-year-old" → should stream back real class recommendations linking to real class pages

If the homepage throws a 500, check the Vercel logs for a Prisma error. Most common causes are covered in section 8.

---

## 6.5. Turn on real Email OTP via Resend (5 min)

Until you do this step, OTPs only print to the Vercel function logs — real users can't sign in. Do this before inviting anyone.

1. Go to https://resend.com and sign up (GitHub sign-in works). The free tier gives 3,000 emails/month and 100/day — fine for MVP.
2. In the Resend dashboard → **API Keys** → **Create API Key**. Copy the key (starts with `re_`). You only see it once.
3. In Vercel → **Settings → Environment Variables**, add or update:
   - `RESEND_API_KEY` = the `re_...` key you just copied.
   - `EMAIL_FROM` = `LearnNextDoor <onboarding@resend.dev>` (the pre-verified test sender Resend gives everyone — use this until step 4).
   - `OTP_DEV_MODE` = `false`.
4. (Recommended before launch) Verify your own sending domain in Resend:
   - Resend → **Domains** → **Add Domain** → enter `learnnextdoor.com` (or whatever you own).
   - Resend shows you 3 DNS records (SPF, DKIM, DMARC). Add them at your domain registrar.
   - Wait 5–30 minutes, click **Verify** — you should see green checks.
   - Change `EMAIL_FROM` in Vercel to `LearnNextDoor <noreply@learnnextdoor.com>`.
5. Redeploy (Vercel → Deployments → ⋯ → Redeploy) to pick up the new env vars.
6. Smoke test: go to `/login`, enter a real email (your own), click Send code. You should receive a branded OTP email within ~10 seconds. Enter the code and confirm you land on the home page.

> **Why `onboarding@resend.dev` first?** Without a verified domain, Resend rejects emails from arbitrary `from` addresses. `onboarding@resend.dev` works out-of-the-box so you can test delivery immediately — but mail sent from it gets flagged as Resend marketing in some inboxes. Verify your domain before a public launch.

**Troubleshooting email delivery:**
- `[OTP] Resend API error: 401` → wrong/missing `RESEND_API_KEY`.
- `[OTP] Resend API error: 403` with "domain not verified" → `EMAIL_FROM` points at a domain you haven't verified. Switch to `onboarding@resend.dev` or finish verification.
- User never gets the email → check Resend → **Logs** (shows every send with delivery status). If Resend says "delivered" but the user sees nothing, ask them to check spam.
- `OTP_DEV_MODE` is `true` by accident → the `/api/auth/send-otp` response will include a `devCode` field and the app shows a yellow "Dev mode" banner in the OTP step. Switch the env var to `false` and redeploy.

---

## 7. (Optional) Wire your domain

1. In Vercel → **Settings → Domains**, add `learnnextdoor.com` (or whatever you own).
2. Vercel shows you a DNS record to add (either an A record or a CNAME).
3. Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) and add that record.
4. Wait 5–60 minutes for DNS to propagate. Vercel auto-issues a free Let's Encrypt cert.

---

## 8. Troubleshooting

**Build fails with `PrismaClientInitializationError` or `libquery_engine-rhel-openssl-3.0.x.so.node not found`**
→ Your schema is missing `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in the generator block. It's in the v3 schema — if you're on an older copy, update `prisma/schema.prisma` and redeploy.

**`Can't reach database server at ...`**
→ Check `DATABASE_URL` is the **pooler** URL (port 6543) and includes `?pgbouncer=true&connection_limit=1`. Vercel serverless functions exhaust connection pools in seconds without these flags.

**`prisma db push` fails with "Tenant or user not found" or auth errors**
→ Your password has special characters that need URL-encoding, or the password is wrong. Regenerate a password in Supabase (Settings → Database → Reset database password) using only letters and numbers.

**Homepage renders but every page is slow on first hit**
→ Serverless cold start. First request to a new lambda is 1–2s. Subsequent requests are <100ms. For a real app, consider Vercel's Edge runtime for reads — but not for Prisma routes.

**OTP code doesn't appear anywhere when I try to log in on prod**
→ Check the Vercel Function logs (Deployments → latest → Runtime Logs) and search for `[DEV] OTP`. The seed users exist in the DB but you still need an OTP to sign in. For real production, set `OTP_DEV_MODE=false` and wire Twilio WhatsApp.

**"Ask Zoe" returns an error immediately**
→ Either `ANTHROPIC_API_KEY` is missing/wrong in Vercel's env vars, or you hit the free-tier rate limit on your Anthropic account. Check Vercel logs.

**I changed the schema and Vercel's DB is out of date**
→ SSH out of the Vercel mental model — don't ever push schema from Vercel. Run `DIRECT_URL=... npx prisma db push` locally, pointed at the production DB. Schema changes stay a local-tool operation.

**I need to wipe and re-seed production data**
```bash
# From your Mac, with production URLs in .env:
npx prisma db push --force-reset
npm run db:seed
```
> ⚠️ This deletes every row in your Supabase DB. Only do this during MVP, never after you have real users.

**`/admin/login` shows "Invalid username or password" but I set ADMIN_SEED_* vars**
→ The seed runs **on-demand** the first time `/admin/login` receives a POST, not at build time. If you changed the `ADMIN_SEED_PASSWORD` after the first login attempt, the existing row won't be updated. Either use the password you originally set, or clear the AdminUser table (see section 8.5) to re-seed.

**I added fields for the admin portal and Vercel's build fails with "Unknown field 'liveStatus' / 'suspended' / 'kycDocUrl'"**
→ You need to push the new schema to Supabase before the build picks up a matching Prisma client. Run `npx prisma db push` locally against prod `DIRECT_URL`, then redeploy.

---

## 8.5. First-time admin access

After the first deploy:

1. Visit `https://yourdomain.com/admin/login`.
2. Sign in with the `ADMIN_SEED_USERNAME` and `ADMIN_SEED_PASSWORD` you set in Vercel.
3. The first login triggers a mandatory password reset — pick a new 12+ char password.
4. From the admin shell → **Settings → Admin Credentials** you can invite more Admin (non-Super) accounts. Super Admin privileges are seeded once and cannot be escalated through the UI.

Idle sessions log you out after 60 minutes (matches PRD §2). Logging in from a second device invalidates the first — this is intentional.

If you lose the Super Admin password, connect to the DB directly and clear the `AdminUser` table; the next hit to `/admin/login` re-seeds from env.

```sql
DELETE FROM "AdminSession";
DELETE FROM "AdminUser";
```

---

## 9. What's next after deploy

1. **Rotate the Anthropic API key** you shared in chat. Generate a fresh one in the console, update Vercel env var, redeploy.
2. **Real OTP delivery** — sign up for Twilio WhatsApp Business API (or MSG91 for India), set `OTP_DEV_MODE=false` and the Twilio env vars.
3. **Connection pooling headroom** — Supabase free tier gives you 60 pooler connections. Vercel spins one lambda per concurrent request. For ~500 concurrent users on Hobby plan, you're fine. If you hit connection limits, upgrade Supabase's pooler plan.
4. **Database backups** — Supabase free tier backs up daily. Paid plans add point-in-time restore.
5. **Monitoring** — Vercel's Analytics tab tracks page views and function errors. For error tracking, drop in Sentry (~10 lines).
6. **Custom domain + redirects** — point `www.learnnextdoor.com` and `learnnextdoor.com` at Vercel; add a redirect from `www` → apex (or vice versa) in Vercel's Domains settings.

---

## Appendix: what exactly changes between local SQLite and prod Postgres

For your reference, these are the only changes between v2 (SQLite) and v3 (Postgres). Nothing else in the app code changes.

1. `prisma/schema.prisma`
   - `provider = "sqlite"` → `provider = "postgresql"`
   - Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to generator
   - Added `directUrl = env("DIRECT_URL")` to datasource
2. `package.json`
   - `"build": "next build"` → `"build": "prisma generate && next build"` (belt-and-braces for Vercel's build cache)
3. `src/app/browse/page.tsx`
   - Added `mode: "insensitive"` to the `contains` queries (Postgres defaults to case-sensitive `LIKE`; SQLite didn't)
4. `.env.example`
   - Replaced `DATABASE_URL="file:./dev.db"` with the two Supabase URLs and a comment block

Everything else — all routes, components, auth, the Zoe chatbot — is portable and works on both databases unchanged.
