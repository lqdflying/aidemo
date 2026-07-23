import {
  BadgeCheck,
  Blocks,
  Braces,
  CalendarCheck2,
  Database,
  ExternalLink,
  FileCode2,
  GitCompareArrows,
  Layers3,
  Network,
  Plus,
  ScrollText,
  Waypoints,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  agentOpenSourceCatalog,
  type AgentOpenSourceChoice,
  type AgentOpenSourceKind,
  type AgentOpenSourceRecommendation,
  type AgentOpenSourceScope,
} from "./agent-open-source";

interface AgentOpenSourceRecommendationsProps {
  readonly recommendation: AgentOpenSourceRecommendation;
}

const solutionKindIcons: Readonly<Record<AgentOpenSourceKind, LucideIcon>> = {
  Database,
  Framework: Blocks,
  Gateway: Waypoints,
  Library: Braces,
  Platform: Layers3,
  Protocol: Network,
  Runtime: Workflow,
  Standard: ScrollText,
};

const solutionScopeLabels: Readonly<Record<AgentOpenSourceScope, string>> = {
  "full-project": "Open-source project",
  "oss-core": "OSI-licensed core",
  specification: "Open specification",
};

function formatReviewDate(reviewedOn: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${reviewedOn}T00:00:00Z`));
}

function SolutionCard({
  choice,
  prominence,
}: {
  readonly choice: AgentOpenSourceChoice;
  readonly prominence: "alternative" | "companion" | "preferred";
}): React.JSX.Element {
  const solution = agentOpenSourceCatalog[choice.solutionId];
  const Icon = solutionKindIcons[solution.kind];

  return (
    <article
      className="agent-open-source-card"
      data-prominence={prominence}
      data-solution-id={choice.solutionId}
    >
      <div className="agent-open-source-card__heading">
        <span aria-hidden="true" className="agent-open-source-card__icon">
          <Icon />
        </span>
        <div>
          <span>{prominence === "preferred" ? "Preferred foundation" : solution.kind}</span>
          <h4>{solution.name}</h4>
        </div>
      </div>
      {prominence === "preferred" && (
        <p className="agent-open-source-card__description">{solution.description}</p>
      )}
      <p className="agent-open-source-card__use">{choice.useFor}</p>
      <ul aria-label={`${solution.name} project details`} className="agent-open-source-card__meta">
        <li>{solution.license}</li>
        <li>{solutionScopeLabels[solution.scope]}</li>
        <li>{solution.languages.join(" · ")}</li>
      </ul>
      <a
        aria-label={`Open official ${solution.name} documentation`}
        className="agent-open-source-card__link"
        href={solution.officialUrl}
        rel="noreferrer"
        target="_blank"
      >
        Official project
        <ExternalLink aria-hidden="true" />
      </a>
    </article>
  );
}

function PythonSolutionCard({
  choice,
  featuredAbove,
  role,
}: {
  readonly choice: AgentOpenSourceChoice;
  readonly featuredAbove: boolean;
  readonly role: "Alternative" | "Companion" | "Preferred";
}): React.JSX.Element {
  const solution = agentOpenSourceCatalog[choice.solutionId];
  const Icon = solutionKindIcons[solution.kind];

  return (
    <article
      className="agent-open-source-python-card"
      data-role={role.toLowerCase()}
      data-solution-id={choice.solutionId}
    >
      <div className="agent-open-source-python-card__heading">
        <span aria-hidden="true" className="agent-open-source-python-card__icon">
          <Icon />
        </span>
        <div>
          <span className="agent-open-source-python-card__role">{role}</span>
          <h4>{solution.name}</h4>
        </div>
        {featuredAbove && (
          <span className="agent-open-source-python-card__featured">Featured above</span>
        )}
      </div>
      <p>{choice.useFor}</p>
      <ul aria-label={`${solution.name} Python ecosystem details`}>
        <li>{solution.license}</li>
        <li>{solutionScopeLabels[solution.scope]}</li>
        <li>{solution.languages.join(" · ")}</li>
      </ul>
      <a
        aria-label={`Open official ${solution.name} documentation`}
        href={solution.officialUrl}
        rel="noreferrer"
        target="_blank"
      >
        Official project
        <ExternalLink aria-hidden="true" />
      </a>
    </article>
  );
}

export function AgentOpenSourceRecommendations({
  recommendation,
}: AgentOpenSourceRecommendationsProps): React.JSX.Element {
  const mainSolutionIds = new Set([
    recommendation.preferred.solutionId,
    ...recommendation.companions.map(({ solutionId }) => solutionId),
    ...recommendation.alternatives.map(({ solutionId }) => solutionId),
  ]);

  return (
    <section aria-label="Build with open source" className="agent-open-source">
      <header className="agent-open-source__header">
        <div>
          <span>Implementation reference</span>
          <h3>Build with open source</h3>
          <p>Current frameworks, protocols, and infrastructure for this platform boundary.</p>
        </div>
        <ul aria-label="Recommendation audit status">
          <li><BadgeCheck aria-hidden="true" />Stable releases only</li>
          <li><CalendarCheck2 aria-hidden="true" />Reviewed {formatReviewDate(recommendation.reviewedOn)}</li>
        </ul>
      </header>

      <figure
        aria-label="Python implementation stack"
        className="agent-open-source__stack"
        data-has-companions={recommendation.pythonEcosystem.companions.length > 0 || undefined}
      >
        <PythonSolutionCard
          choice={recommendation.pythonEcosystem.preferred}
          featuredAbove={mainSolutionIds.has(recommendation.pythonEcosystem.preferred.solutionId)}
          role="Preferred"
        />
        {recommendation.pythonEcosystem.companions.length > 0 && (
          <>
            <div aria-hidden="true" className="agent-open-source__join">
              <i />
              <Plus />
            </div>
            <section aria-label="Python companion projects" className="agent-open-source__companions">
              <span>Pair with</span>
              <div>
                {recommendation.pythonEcosystem.companions.map((item) => (
                  <PythonSolutionCard
                    choice={item}
                    featuredAbove={mainSolutionIds.has(item.solutionId)}
                    key={item.solutionId}
                    role="Companion"
                  />
                ))}
              </div>
            </section>
          </>
        )}
        <figcaption>
          <GitCompareArrows aria-hidden="true" />
          <span><strong>Python selection rule</strong>{recommendation.pythonEcosystem.decisionRule}</span>
        </figcaption>
      </figure>

      {recommendation.pythonEcosystem.alternatives.length > 0 && (
        <details className="agent-open-source__alternatives">
          <summary>
            <GitCompareArrows aria-hidden="true" />
            Compare Python {recommendation.pythonEcosystem.alternatives.length === 1 ? "alternative" : "alternatives"}
            <span>{recommendation.pythonEcosystem.alternatives.length}</span>
          </summary>
          <div>
            {recommendation.pythonEcosystem.alternatives.map((item) => (
              <PythonSolutionCard
                choice={item}
                featuredAbove={mainSolutionIds.has(item.solutionId)}
                key={item.solutionId}
                role="Alternative"
              />
            ))}
          </div>
        </details>
      )}

      <details className="agent-open-source__architecture">
        <summary>
          <FileCode2 aria-hidden="true" />
          <span>
            <strong>Architecture track</strong>
            <small>Platform-level infrastructure and protocol choices</small>
          </span>
          <b aria-label={`${1 + recommendation.companions.length + recommendation.alternatives.length} architecture projects`}>
            {1 + recommendation.companions.length + recommendation.alternatives.length}
          </b>
        </summary>
        <div className="agent-open-source__architecture-body">
          {recommendation.architectureExceptionReason && (
            <p className="agent-open-source__exception">
              <GitCompareArrows aria-hidden="true" />
              <span><strong>Non-Python exception</strong>{recommendation.architectureExceptionReason}</span>
            </p>
          )}
          <div className="agent-open-source__architecture-grid">
            <SolutionCard choice={recommendation.preferred} prominence="preferred" />
            {recommendation.companions.map((item) => (
              <SolutionCard
                choice={item}
                key={item.solutionId}
                prominence="companion"
              />
            ))}
            {recommendation.alternatives.map((item) => (
              <SolutionCard
                choice={item}
                key={item.solutionId}
                prominence="alternative"
              />
            ))}
          </div>
          <p className="agent-open-source__python-rule">
            <GitCompareArrows aria-hidden="true" />
            <span><strong>Architecture selection rule</strong>{recommendation.decisionRule}</span>
          </p>
        </div>
      </details>
    </section>
  );
}
