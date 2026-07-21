import Link from "next/link";

const tabs = [
  ["", "Overview"],
  ["ideas/", "Ideas"],
  ["knowledge/", "Knowledge"],
  ["reports/", "Reports"],
  ["files/", "Files"],
] as const;

export function RunTabs({ slug, active }: { slug: string; active: string }) {
  return (
    <nav className="run-tabs" aria-label="Run sections">
      {tabs.map(([suffix, label]) => (
        <Link key={label} href={`/runs/${slug}/${suffix}`} className={active === label ? "active" : ""} aria-current={active === label ? "page" : undefined}>{label}</Link>
      ))}
      <Link href={`/runs/${slug}/#technical-details`} className={active === "Technical Details" ? "active" : ""}>Technical Details</Link>
    </nav>
  );
}
