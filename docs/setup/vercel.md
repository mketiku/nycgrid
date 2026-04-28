# Vercel Setup

Vercel hosts the Next.js app. The **Hobby plan** (free) is sufficient for NycGrid.

---

## 1. Create an account

Go to [vercel.com](https://vercel.com) and sign up with GitHub.

---

## 2. Import the repository

1. From the Vercel dashboard, click **Add New → Project**.
2. Select your GitHub repository (`nycgrid` or whatever you named it).
3. Vercel auto-detects Next.js — no framework config needed.
4. Click **Deploy**. The first deploy will fail because env vars aren't set yet — that's fine.

---

## 3. Add environment variables

Go to **Project → Settings → Environment Variables** and add every variable from `.env.example`.

**Required for the app to start:**

| Variable              | Guide                                                          |
| --------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Set to your production URL, e.g. `https://nycgrid.mketiku.com` |

**Optional (features degrade gracefully without these):**

| Variable                  | What it enables                            |
| ------------------------- | ------------------------------------------ |
| `NYC_OPEN_DATA_APP_TOKEN` | Permitted events in "What's Happening Now" |
| `NYC_511_API_KEY`         | MTA transit alerts in camera context panel |
| `MTA_BUS_TIME_KEY`        | Bus arrivals in camera context panel       |
| `NEXT_PUBLIC_SENTRY_DSN`  | Browser error reporting                    |
| `SENTRY_ORG`              | Source map uploads at build time           |
| `SENTRY_PROJECT`          | Source map uploads at build time           |
| `SENTRY_AUTH_TOKEN`       | Source map uploads at build time           |

> Set environment scope to **Production** for production-only values, or **All Environments** if you also want them in preview deployments.

---

## 4. Redeploy

After adding env vars, trigger a new deploy:  
**Project → Deployments → latest deploy → ... → Redeploy**

---

## 5. Add a custom domain (optional)

1. **Project → Settings → Domains**.
2. Add your domain (e.g. `nycgrid.mketiku.com`).
3. Follow the DNS instructions Vercel provides (usually a CNAME or A record).

Once the domain is set, update `NEXT_PUBLIC_APP_URL` to match.

---

## 6. Preview deployments

Every pull request and push to a non-main branch gets its own preview URL automatically. These inherit your env vars if you set them to **All Environments** in step 3.

---

## Build & function limits (Hobby plan)

| Limit                           | Value           |
| ------------------------------- | --------------- |
| Build time                      | 45 minutes      |
| Serverless function execution   | 300 seconds max |
| Bandwidth                       | 100 GB/month    |
| Serverless function invocations | 100,000/month   |

NycGrid is a read-heavy app (map tiles, camera images) — the function invocation limit is rarely a concern. Camera images are fetched directly from the NYC DOT API by the browser, not through Vercel functions.

---

## Checking function logs

If a crowd report or context fetch fails in production, check the logs:

```bash
vercel logs --app nycgrid --since 1h
```

Or in the dashboard: **Project → Functions → select a function → Logs**.
