"use client";

import { useState } from "react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { PublicCard } from "./ui/Card";
import { PublicButton } from "./ui/Button";
import { cn } from "@/lib/utils";
import { PORTFOLIO_FILTERS, CASE_STUDIES } from "@/lib/content/caseStudies";

/**
 * Owns both the filter state and which project's detail is expanded —
 * client-side only, no fake case-study routing. "View Project" expands the
 * same card in place (Overview / Services Provided / Technologies) rather
 * than linking to a detail page we'd have to invent unverified content for.
 */
export function PortfolioGrid() {
  const [activeFilter, setActiveFilter] = useState<(typeof PORTFOLIO_FILTERS)[number]>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const projects =
    activeFilter === "All" ? CASE_STUDIES : CASE_STUDIES.filter((p) => p.category === activeFilter);

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {PORTFOLIO_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors pub-focus",
              activeFilter === filter
                ? "border-crimson bg-crimson text-white"
                : "border-hairline bg-white text-charcoal hover:border-crimson/40 hover:text-charcoal-dark"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-sm text-charcoal-muted">No projects in this category yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const expanded = expandedId === project.id;
            return (
              <PublicCard key={project.id} className="flex h-full flex-col">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson-light">
                  <project.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-crimson">{project.category}</p>
                <h3 className="mt-1.5 text-lg font-semibold text-charcoal-dark">{project.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal">{project.description}</p>

                {expanded && (
                  <div className="mt-4 space-y-4 border-t border-hairline pt-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                        Services Provided
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.services.map((s) => (
                          <span key={s} className="rounded-full bg-crimson-light px-3 py-1 text-xs font-medium text-crimson">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                        What Was Delivered
                      </p>
                      <ul className="space-y-1.5">
                        {project.outcomes.map((outcome) => (
                          <li key={outcome} className="flex items-start gap-2 text-sm text-charcoal">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-crimson" aria-hidden="true" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                        Technologies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.technology.map((tech) => (
                          <span key={tech} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-charcoal-muted">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <PublicButton href="/request-quote" className="w-full text-sm">
                      Start a Similar Project
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </PublicButton>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : project.id)}
                  aria-expanded={expanded}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-crimson hover:gap-2.5"
                >
                  {expanded ? "Show less" : "View Project"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                </button>
              </PublicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
