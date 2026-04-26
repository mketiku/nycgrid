export default function AmbientLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100dvh", overflow: "hidden" }}>{children}</div>;
}
