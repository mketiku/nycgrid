import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — nycgrid",
  description: "How nycgrid handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: June 2026</p>

      <p>
        NYC Grid is a free, open exploration tool built on 100% public data. We collect as little as
        possible and store even less.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Nothing deliberately.</strong> There are no accounts, no sign-ups, and no login.
          We do not ask for your name, email, or any personal identifier.
        </li>
        <li>
          <strong>Theme preference</strong> is stored in your browser&apos;s{" "}
          <code>localStorage</code> only. It never leaves your device.
        </li>
      </ul>

      <h2>Camera images</h2>
      <p>
        Live camera images are fetched directly from the NYC Department of Transportation public
        API. We proxy these requests through our server solely to enable browser canvas features
        (photobooth, GIF export). We do not store, log, or analyse any camera images.
      </p>

      <h2>Hosting logs</h2>
      <p>
        The app is hosted on Vercel. Like any web host, Vercel may process standard metadata,
        including IP address, user agent, and requested URL, in order to serve the app, operate the
        platform, and troubleshoot failures. We use Vercel Analytics to count visitors and page
        views — it collects no cookies, no fingerprints, and no personal data.
      </p>

      <h2>Product analytics</h2>
      <p>
        We use PostHog to understand how features are used — for example, whether people who open
        the map go on to view a camera feed. PostHog records behavioural events such as page views,
        camera interactions, ambient mode entry, and photobooth use. It does not collect your name,
        email address, or IP address. No cookies are set. The only data stored on your device is a
        random anonymous identifier in your browser&apos;s <code>localStorage</code>, which cannot
        be linked to you as a person. Session recordings are disabled.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>NYC DOT Webcam API</strong> — public traffic camera images. No account required.
          See{" "}
          <a href="https://webcams.nyctmc.org" target="_blank" rel="noopener noreferrer">
            webcams.nyctmc.org
          </a>
          .
        </li>
        <li>
          <strong>CARTO / OpenFreeMap</strong> — map tiles and fonts. Your IP is visible to their
          tile CDN as with any mapping service.
        </li>
        <li>
          <strong>Google Fonts</strong> — JetBrains Mono and Inter typefaces are loaded from
          Google&apos;s CDN.
        </li>
        <li>
          <strong>PostHog</strong> — product analytics (US region). Events are sent to{" "}
          <code>us.i.posthog.com</code>. No cookies; no PII.
        </li>
      </ul>

      <h2>Geolocation</h2>
      <p>
        The &ldquo;Find me&rdquo; feature on the map requests your device location via the browser
        Geolocation API. Your coordinates are used only to find the nearest camera on your device —
        they are never sent to our servers or stored anywhere.
      </p>

      <h2>Photobooth</h2>
      <p>
        Photos you create in the photobooth are composed entirely in your browser and downloaded
        directly to your device. No images are uploaded to or stored on our servers.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? <a href="https://github.com/mketiku/nycgrid/issues">Open a GitHub issue</a>.
      </p>

      <p className="updated">
        This policy may be updated as the project evolves. Material changes will be noted here.
      </p>
    </>
  );
}
