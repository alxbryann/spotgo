export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7">
      <p className="ds-caption text-muted">{eyebrow}</p>
      <h1
        className="ds-display mt-2 text-strong"
        style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
    </div>
  );
}
