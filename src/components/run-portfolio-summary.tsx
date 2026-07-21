import type { RunWithIdeas } from "@/lib/types";
import { runModeLabels } from "@/lib/portfolio";

export function RunPortfolioSummary({ run }: { run: RunWithIdeas }) {
  const funnel = run.portfolio_funnel;
  const discovery = run.run_mode === "DISCOVERY_PORTFOLIO_RUN";
  const steps = discovery
    ? [
        ["Generated", funnel.raw_generation_count],
        ["Unique families", funnel.natural_family_count],
        ["Developed", funnel.developed_count],
        ["Compared", funnel.arena_entrant_count],
        ["Finalists", funnel.finalist_count],
      ]
    : [
        ["Research objects", funnel.raw_generation_count],
        ["Unique families", funnel.natural_family_count],
        ["Developed", funnel.developed_count],
        ["Reviewed", funnel.reviewed_count],
        ["Featured", run.ideas.filter((idea) => idea.featured).length],
      ];

  return (
    <section className="portfolio-funnel" aria-labelledby="portfolio-funnel-title">
      <div className="portfolio-funnel-head">
        <div>
          <p className="eyebrow">{runModeLabels[run.run_mode]}</p>
          <h2 id="portfolio-funnel-title">Research portfolio</h2>
        </div>
        <p>{run.pairwise_selection_impact}</p>
      </div>
      <ol>
        {steps.map(([label, value]) => (
          <li key={label}><strong>{value}</strong><span>{label}</span></li>
        ))}
      </ol>
    </section>
  );
}
