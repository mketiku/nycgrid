import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — nycgrid",
  description: "Terms of use for nycgrid.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="lead">Last updated: April 2026</p>

      <p>
        By using nycgrid (&ldquo;the Service&rdquo;) you agree to these terms. If you don&apos;t
        agree, please don&apos;t use it.
      </p>

      <h2>What is it</h2>
      <p>
        NYC Grid is a free, non-commercial tool for exploring New York City through its public
        traffic camera network. All camera imagery is sourced from the NYC Department of
        Transportation&apos;s public API and is public infrastructure data.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use the Service for personal, non-commercial exploration and creativity.</li>
        <li>
          Do not use it to track, monitor, or surveil specific individuals — these are public
          traffic cameras, not personal surveillance tools.
        </li>
        <li>
          Do not attempt to scrape, crawl, or automate requests in a way that degrades the service
          for other users or places excessive load on the NYC DOT API.
        </li>
        <li>Do not attempt to reverse-engineer, decompile, or exploit any part of the Service.</li>
      </ul>

      <h2>Camera imagery</h2>
      <p>
        Images are provided by the NYC Department of Transportation and are public infrastructure
        data. nycgrid does not own, license, or make any warranty about the accuracy, availability,
        or content of camera feeds. Cameras may be offline, obstructed, or delayed.
      </p>

      <h2>Photobooth &amp; GIF export</h2>
      <p>
        Photos and GIFs you create are yours. They are composed in your browser and downloaded
        directly to your device — nycgrid never sees or stores them. You are responsible for how you
        use and share anything you create.
      </p>

      <h2>No warranty</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranty of any kind. We make no
        guarantees about uptime, data accuracy, or fitness for any particular purpose. Camera feeds
        depend on the NYC DOT API, which is outside our control.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, nycgrid and its contributors are not liable for any
        damages arising from your use of the Service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the project grows. Continued use of the Service after changes
        constitutes acceptance of the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? <a href="https://github.com/mketiku/nycgrid/issues">Open a GitHub issue</a>.
      </p>
    </>
  );
}
