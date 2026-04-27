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
            onClick={() => window.print()}
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
