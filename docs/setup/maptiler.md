# MapTiler Setup

> [!IMPORTANT]
> **MapTiler is currently disabled** in favor of [OpenFreeMap](https://openfreemap.org). This documentation is preserved for reference should we decide to switch back.

MapTiler provides the map tiles for the explore page. The free tier covers **75,000 tile requests per month** — more than enough for a hobby project.

The alternative is [OpenFreeMap](https://openfreemap.org) (completely free, no account), but MapTiler tiles are higher quality and have better NYC coverage.

---

## 1. Create an account

Go to [cloud.maptiler.com](https://cloud.maptiler.com) and sign up with GitHub or email.

---

## 2. Get your API key

1. After signing in, go to **Account → Keys**.
2. A default key is created automatically — copy it.
3. Add it to `.env.local`:

```
NEXT_PUBLIC_MAPTILER_KEY=your_key_here
```

---

## 3. How it's used

The key is read in `src/features/map/useMapSetup.ts` when initialising MapLibre GL:

```ts
const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
```

The `NEXT_PUBLIC_` prefix makes it available in the browser bundle. This is intentional — MapTiler keys are designed to be public and are protected by domain allowlisting instead.

---

## 4. Lock the key to your domain (production)

Before going public, restrict your key so it only works from your domain:

1. **Account → Keys → your key → Edit**.
2. Under **Allowed HTTP origins**, add:
   - `https://your-domain.vercel.app`
   - `https://yourdomain.com` (if you have a custom domain)
   - `http://localhost:3100` (for local dev — remove before shipping if desired)
3. Save.

Without this restriction, anyone who finds your key can use your tile quota.

---

## 5. CSP — no changes needed

`api.maptiler.com` is already included in the `img-src` and `connect-src` directives in `src/lib/security/headers.ts`. Switching to MapTiler requires no CSP edits.

---

## Using OpenFreeMap instead (default)

The app ships with OpenFreeMap as the default tile provider — no account or key needed:

```ts
const style = "https://tiles.openfreemap.org/styles/liberty";
```

To switch back to OpenFreeMap after trying MapTiler: remove `NEXT_PUBLIC_MAPTILER_KEY` from `.env.local` and restore the OpenFreeMap style URL in `useMapSetup.ts`.
