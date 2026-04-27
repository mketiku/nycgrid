"use client";

import { useState } from "react";

const DOCUMENT_TYPES = [
  "Traffic Camera Footage",
  "Pothole Records (Est. Backlog: 847,000)",
  "The MTA's Feelings",
  "Bus Schedule (Theoretical)",
  "Bridge Inspection Reports, 1987",
  "Everything",
];

function randomCaseNumber() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(100000 + Math.random() * 900000));
  return `FOIA-${year}-${seq}`;
}

function printFoiaDocument(caseNumber: string, docType: string) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const refNum = `REF-${Math.floor(10000 + Math.random() * 90000)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>FOIA Acknowledgment — ${caseNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #111;
    background: #fff;
    padding: 0;
  }
  .page {
    max-width: 7.5in;
    margin: 0 auto;
    padding: 1in 1in 0.75in;
  }

  /* Letterhead */
  .letterhead {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    border-bottom: 3px solid #111;
    padding-bottom: 14px;
    margin-bottom: 24px;
  }
  .seal {
    width: 72px;
    height: 72px;
    border: 3px solid #111;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
    font-size: 7pt;
    font-weight: bold;
    letter-spacing: 0.04em;
    text-align: center;
    flex-shrink: 0;
    line-height: 1.3;
  }
  .seal-nyc { font-size: 9pt; letter-spacing: 0.12em; }
  .letterhead-text { flex: 1; }
  .letterhead-text h1 {
    font-size: 13pt;
    font-weight: bold;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .letterhead-text .dept {
    font-size: 10pt;
    margin-top: 2px;
  }
  .letterhead-text .address {
    font-size: 8.5pt;
    color: #444;
    margin-top: 6px;
    line-height: 1.5;
  }

  /* Doc title block */
  .doc-title {
    text-align: center;
    margin-bottom: 28px;
  }
  .doc-title h2 {
    font-size: 13pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-decoration: underline;
    margin-bottom: 4px;
  }
  .doc-title .subtitle {
    font-size: 9pt;
    color: #555;
  }

  /* Case block */
  .case-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 32px;
    border: 1px solid #bbb;
    padding: 12px 16px;
    margin-bottom: 24px;
    font-size: 10pt;
  }
  .case-block .label { font-weight: bold; }
  .case-block .value { font-family: "Courier New", monospace; font-size: 9.5pt; }

  /* Body text */
  p { margin-bottom: 12px; line-height: 1.65; font-size: 11pt; }
  .indent { margin-left: 2em; }
  .section-head {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 20px;
    margin-bottom: 8px;
  }
  ol { margin-left: 2em; margin-bottom: 12px; }
  ol li { margin-bottom: 6px; line-height: 1.6; font-size: 10.5pt; }

  /* Footer / sign-off */
  .signoff {
    margin-top: 36px;
    border-top: 1px solid #bbb;
    padding-top: 20px;
  }
  .signoff-dept {
    font-size: 10pt;
    font-weight: bold;
    margin-bottom: 4px;
  }
  .signature-line {
    display: flex;
    align-items: flex-end;
    gap: 32px;
    margin-top: 40px;
    margin-bottom: 32px;
  }
  .sig-block { flex: 1; }
  .sig-block .line {
    border-bottom: 1px solid #111;
    height: 32px;
    margin-bottom: 4px;
  }
  .sig-block .label { font-size: 8.5pt; color: #444; }

  /* Personal note — set apart */
  .personal-note {
    margin-top: 28px;
    border-top: 1px dashed #bbb;
    padding-top: 16px;
    font-size: 10pt;
    font-style: italic;
    color: #333;
    line-height: 1.7;
  }
  .personal-note strong { font-style: normal; }

  /* Page footer */
  .page-footer {
    margin-top: 32px;
    border-top: 1px solid #999;
    padding-top: 8px;
    font-size: 7.5pt;
    color: #666;
    display: flex;
    justify-content: space-between;
  }

  @media print {
    body { background: #fff; }
    .page { padding: 0.6in 0.75in; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Letterhead -->
  <div class="letterhead">
    <div class="seal">
      <div class="seal-nyc">NYC</div>
      <div>GOV</div>
      <div style="font-size:6pt;margin-top:2px">EST. 1898</div>
    </div>
    <div class="letterhead-text">
      <h1>Bureau of Road Access and Kinetics Engineering</h1>
      <div class="dept">B.R.A.K.E. &mdash; City of New York, Office of Infrastructure Transparency</div>
      <div class="address">
        55 Water Street, 12th Floor &bull; New York, NY 10041<br>
        Tel: (212) 555-2725 &bull; Fax: Please do not fax. We have one fax machine. It is broken.<br>
        brake.nyc.gov &bull; FOIL Portal Ref: ${refNum}
      </div>
    </div>
  </div>

  <!-- Doc title -->
  <div class="doc-title">
    <h2>Freedom of Information Law — Acknowledgment of Receipt</h2>
    <div class="subtitle">Pursuant to N.Y. Pub. Off. Law &sect;&sect;&nbsp;84&ndash;90 &bull; Form B.R.A.K.E.-FOIA-7 (Rev. 2009)</div>
  </div>

  <!-- Case block -->
  <div class="case-block">
    <span class="label">Case Number:</span>  <span class="value">${caseNumber}</span>
    <span class="label">Date Filed:</span>    <span class="value">${date}</span>
    <span class="label">Document Type:</span> <span class="value">${docType}</span>
    <span class="label">Status:</span>        <span class="value">PENDING INTERDEPARTMENTAL REVIEW</span>
    <span class="label">Assigned Office:</span> <span class="value">Records &amp; Compliance, B.R.A.K.E.</span>
    <span class="label">Est. Response:</span> <span class="value">18&ndash;24 months</span>
  </div>

  <!-- Body -->
  <p>Dear Requestor,</p>

  <p>This letter acknowledges receipt of your Freedom of Information Law (FOIL) request, submitted electronically via the B.R.A.K.E. Public Records Portal. Your request has been received, logged, timestamped, counter-stamped, and assigned to the appropriate queue, where it will remain until an eligible officer has capacity to review it.</p>

  <div class="section-head">I. Scope of Request</div>
  <p>Your request, as submitted, seeks access to records described as: <strong>"${docType}"</strong>. B.R.A.K.E. has noted this request and will endeavor to locate, compile, and review all responsive records, subject to applicable exemptions under N.Y. Pub. Off. Law &sect;&nbsp;87, including but not limited to: records compiled for law enforcement purposes; records the disclosure of which would constitute an unwarranted invasion of personal privacy; records that are inter-agency or intra-agency materials; and records that do not exist.</p>

  <div class="section-head">II. Processing Timeline &amp; Your Rights</div>
  <ol>
    <li>B.R.A.K.E. will acknowledge your request within five (5) business days of receipt. You have received this letter. Accordingly, this obligation has been fulfilled.</li>
    <li>B.R.A.K.E. will respond substantively within twenty (20) business days of the date of this acknowledgment, unless an extension is required. Extensions may be granted for voluminous requests, requests requiring inter-agency coordination, or requests filed on a Friday.</li>
    <li>If records are denied in whole or in part, you have the right to appeal to the head of B.R.A.K.E. within thirty (30) days. The head of B.R.A.K.E. will review your appeal at their earliest convenience, which may be after lunch.</li>
    <li>If you are dissatisfied with the outcome of your appeal, you may commence a proceeding pursuant to Article 78 of the Civil Practice Law and Rules. Please consult an attorney. Or the MTA. Good luck either way.</li>
    <li>Fees may be assessed for search, duplication, and certification of records at the rate established by B.R.A.K.E. administrative policy. A current fee schedule is available upon request (allow 18&ndash;24 months).</li>
  </ol>

  <div class="section-head">III. Important Notices</div>
  <p class="indent">B.R.A.K.E. is not responsible for the condition, accuracy, completeness, or existence of any document responsive to your request. Records are provided as-is. Some records may be redacted. Some records may be entirely redacted. Some records may be a redaction of a redaction, with a small note indicating that a document once existed in this general area of the filing system.</p>
  <p class="indent">Your request does not obligate B.R.A.K.E. to create records that do not exist, compile information not contained in existing records, or explain why records do not exist. B.R.A.K.E. is, however, willing to acknowledge that records probably existed at some point, and expresses its sincere institutional regret regarding their current whereabouts.</p>

  <!-- Sign-off -->
  <div class="signoff">
    <div class="signoff-dept">NYC Bureau of Road Access and Kinetics Engineering</div>
    <div style="font-size:10pt;color:#444;margin-bottom:4px">Office of Records &amp; Compliance</div>

    <div class="signature-line">
      <div class="sig-block">
        <div class="line"></div>
        <div class="label">Authorized Signature</div>
      </div>
      <div class="sig-block">
        <div class="line"></div>
        <div class="label">Title / Badge Number</div>
      </div>
      <div class="sig-block">
        <div class="line"></div>
        <div class="label">Date</div>
      </div>
    </div>

    <p style="font-size:9pt;color:#555;">
      This document is an official record of the City of New York, produced pursuant to the Freedom of Information Law. Unauthorized reproduction, alteration, or redistribution of this document is prohibited. Authorized reproduction, however, is also not particularly useful, but you may proceed.
    </p>
  </div>

  <!-- Personal note -->
  <div class="personal-note">
    <p><strong>A note from nycgrid &mdash;</strong></p>
    <p>
      Thanks for finding the FOIA portal. It means you poked around a little, which is exactly what this site is for. NYC's public infrastructure is strange, vast, and genuinely fascinating once you start looking at it — the cameras, the potholes, the buses that may or may not be running on a schedule that exists only in theory. I hope you learned something about the city today, and I really hope you had fun. &mdash; M.
    </p>
  </div>

  <!-- Page footer -->
  <div class="page-footer">
    <span>B.R.A.K.E. &bull; 55 Water St, New York, NY 10041</span>
    <span>Case: ${caseNumber} &bull; ${date}</span>
    <span>Page 1 of 1</span>
  </div>

</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function FoiaForm() {
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [submitted, setSubmitted] = useState(false);
  const [caseNumber] = useState(() => randomCaseNumber());

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-online)" }}
          />
          <p className="font-mono text-xs font-bold text-[var(--color-online)] uppercase tracking-widest">
            Request Received
          </p>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-5 flex flex-col gap-3">
          <ConfirmRow label="Case" value={caseNumber} />
          <ConfirmRow label="Document Type" value={docType} />
          <ConfirmRow label="Status" value="PENDING INTERDEPARTMENTAL REVIEW" />
          <ConfirmRow label="Est. Response" value="18–24 months" />
          <ConfirmRow label="Filed with" value="B.R.A.K.E." />
        </div>

        <p className="font-mono text-xs text-[var(--color-text-muted)] leading-relaxed">
          You will be contacted at the address on file. If you do not have an address on file,
          please visit your nearest Borough office with two forms of ID and a{" "}
          <span className="text-[var(--color-text-primary)]">stamped, self-addressed envelope</span>
          .
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => printFoiaDocument(caseNumber, docType)}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Print This Page
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            File Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-6"
    >
      <FormField id="requestor" label="Requestor Name">
        <input
          id="requestor"
          type="text"
          placeholder="CITIZEN"
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </FormField>

      <FormField id="doctype" label="Document Type">
        <select
          id="doctype"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors appearance-none cursor-pointer"
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="reason" label="Reason for Request">
        <textarea
          id="reason"
          rows={4}
          placeholder="I just want to know."
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
        />
      </FormField>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
          All requests are reviewed in the order received.
          <br />
          Processing times may vary. Significantly.
        </p>
        <button
          type="submit"
          className="font-mono text-xs uppercase tracking-widest px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-base)] rounded hover:opacity-90 transition-opacity font-semibold whitespace-nowrap"
        >
          File Request
        </button>
      </div>
    </form>
  );
}

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest shrink-0">
        {label}
      </span>
      <span className="font-mono text-xs text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}
