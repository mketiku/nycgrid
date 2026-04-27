import Image from "next/image";
import Link from "next/link";
import { OG_VARIANTS } from "@/features/og-image/variants";

export const metadata = {
  title: "OG Lab | nycgrid",
  description: "Compare alternate Open Graph image directions for nycgrid.",
};

export default function OgLabPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 desktop-layout:px-10">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
          Open Graph Lab
        </p>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--color-text-primary)] md:text-5xl">
          Three directions for the nycgrid social card.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
          Compare each route at full size, then pick the one that feels most like the project.
        </p>
      </header>

      <section className="grid gap-8">
        {OG_VARIANTS.map((variant) => (
          <article
            key={variant.id}
            className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {variant.title}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                  {variant.description}
                </p>
              </div>
              <Link
                href={variant.path}
                className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-accent)] transition-opacity hover:opacity-80"
              >
                Open image
              </Link>
            </div>

            <div className="bg-black/40 p-3 md:p-4">
              <Image
                src={variant.path}
                alt={`${variant.title} Open Graph image preview`}
                width={1200}
                height={630}
                className="h-auto w-full rounded-2xl border border-white/8 bg-black"
                loading="eager"
                unoptimized
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
