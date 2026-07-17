import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  CircleSlash2,
  Code2,
  Database,
  Eye,
  GitBranch,
  Network,
  PackageCheck,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import {
  getAgentConceptDiagramSpec,
  type AgentConceptDiagramSpec,
  type AgentHarnessDiagramSpec,
  type AgentHarnessFacetId,
  type AgentRunLoopDiagramSpec,
  type AgentTypedContractsDiagramSpec,
} from "./agent-concept-diagrams";
import type { AgentConceptId } from "./agent-types";

interface AgentConceptDiagramProps {
  readonly conceptId: AgentConceptId;
}

const harnessFacetIcons: Readonly<Record<AgentHarnessFacetId, LucideIcon>> = {
  state: Database,
  orchestration: Route,
  tools: Wrench,
  policy: ShieldCheck,
  evaluation: Eye,
  delivery: Send,
};

function ConceptLegend({
  legend,
}: {
  readonly legend: AgentConceptDiagramSpec["legend"];
}): React.JSX.Element {
  return (
    <ul aria-label="Diagram legend" className="agent-concept-diagram__legend">
      {legend.map((item) => (
        <li data-tone={item.tone} key={item.label}>
          <i aria-hidden="true" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function HarnessFlowRoute({
  label,
  tone,
}: {
  readonly label: string;
  readonly tone: "request" | "response";
}): React.JSX.Element {
  return (
    <div className="agent-concept-harness__route" data-tone={tone}>
      <span>{label}</span>
      <div aria-hidden="true">
        <i className="agent-concept-harness__packet" />
        <ArrowRight />
      </div>
    </div>
  );
}

function HarnessDiagram({
  spec,
}: {
  readonly spec: AgentHarnessDiagramSpec;
}): React.JSX.Element {
  return (
    <div className="agent-concept-harness">
      <article className="agent-concept-endpoint" data-endpoint="input">
        <Code2 aria-hidden="true" />
        <small>Boundary input</small>
        <strong>Application</strong>
      </article>

      <HarnessFlowRoute label={spec.requestLabel} tone="request" />

      <section
        aria-label="Agent harness responsibility boundary"
        className="agent-concept-harness__boundary"
      >
        <div className="agent-concept-harness__boundary-label">
          <Boxes aria-hidden="true" />
          <span>Agent harness · responsibility boundary</span>
        </div>
        <div className="agent-concept-harness__facets">
          {spec.facets.map((facet, index) => {
            const FacetIcon = harnessFacetIcons[facet.id];
            return (
              <article
                data-facet={facet.id}
                data-sequence={index}
                key={facet.id}
              >
                <FacetIcon aria-hidden="true" />
                <div>
                  <strong>{facet.label}</strong>
                  <p>{facet.summary}</p>
                </div>
              </article>
            );
          })}
          <article className="agent-concept-harness__model">
            <BrainCircuit aria-hidden="true" />
            <div>
              <small>Inside the harness</small>
              <strong>{spec.modelLabel}</strong>
              <p>{spec.modelSummary}</p>
            </div>
          </article>
        </div>
      </section>

      <HarnessFlowRoute label={spec.responseLabel} tone="response" />

      <article className="agent-concept-endpoint" data-endpoint="output">
        <CheckCircle2 aria-hidden="true" />
        <small>Controlled output</small>
        <strong>Verified response</strong>
      </article>
    </div>
  );
}

function LoopStageRail({
  spec,
}: {
  readonly spec: AgentRunLoopDiagramSpec;
}): React.JSX.Element {
  return (
    <ol aria-label="Agent run stages" className="agent-concept-loop__stages">
      {spec.stages.map((stage, index) => (
        <li data-stage={stage.id} key={stage.id}>
          <span aria-hidden="true" className="agent-concept-loop__pulse" data-pass="1" />
          <span aria-hidden="true" className="agent-concept-loop__pulse" data-pass="2" />
          <small>Stage {index + 1}</small>
          <strong>{stage.label}</strong>
          <p>{stage.summary}</p>
          {index < spec.stages.length - 1 && (
            <span aria-hidden="true" className="agent-concept-loop__connector" data-segment={index}>
              <i data-pass="1" />
              <i data-pass="2" />
              <ArrowRight />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function RunLoopDiagram({
  spec,
}: {
  readonly spec: AgentRunLoopDiagramSpec;
}): React.JSX.Element {
  return (
    <div className="agent-concept-loop">
      <div className="agent-concept-loop__pass-labels">
        <span data-pass="1">Pass 1 · adapt</span>
        <span data-pass="2">Pass 2 · verify and exit</span>
      </div>
      <LoopStageRail spec={spec} />
      <div className="agent-concept-loop__branches">
        <section className="agent-concept-loop__adapt" aria-label="Adapt loop back to Observe">
          <div aria-hidden="true" className="agent-concept-loop__adapt-track">
            <i />
            <ArrowLeft />
          </div>
          <div>
            <RefreshCw aria-hidden="true" />
            <span>
              <strong>{spec.adaptLabel}</strong>
              <small>{spec.adaptSummary}</small>
            </span>
          </div>
        </section>
        <section className="agent-concept-loop__exit" aria-label="Verified exit branch">
          <div aria-hidden="true" className="agent-concept-loop__exit-track">
            <i />
            <ArrowRight />
          </div>
          <div>
            <CheckCircle2 aria-hidden="true" />
            <span>
              <strong>{spec.exitLabel}</strong>
              <small>{spec.exitSummary}</small>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContractEndpoint({
  kind,
  label,
}: {
  readonly kind: "producer" | "consumer";
  readonly label: string;
}): React.JSX.Element {
  const Icon = kind === "producer" ? Code2 : PackageCheck;
  return (
    <article className="agent-concept-contracts__endpoint" data-endpoint={kind}>
      <Icon aria-hidden="true" />
      <small>{kind === "producer" ? "Creates the request" : "Owns boundary behavior"}</small>
      <strong>{label}</strong>
    </article>
  );
}

function TypedContractsDiagram({
  spec,
}: {
  readonly spec: AgentTypedContractsDiagramSpec;
}): React.JSX.Element {
  return (
    <div className="agent-concept-contracts">
      <ContractEndpoint kind="producer" label={spec.producerLabel} />
      <div className="agent-concept-contracts__exchange">
        <section className="agent-concept-contracts__request" aria-label="Typed request contract">
          <header>
            <span>{spec.requestLabel}</span>
            <ArrowRight aria-hidden="true" />
          </header>
          <div aria-hidden="true" className="agent-concept-contracts__track" data-tone="request">
            <i />
          </div>
          <dl>
            {spec.requestFields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="agent-concept-contracts__response" aria-label="Typed return contract">
          <header>
            <ArrowLeft aria-hidden="true" />
            <span>{spec.responseLabel}</span>
          </header>
          <div aria-hidden="true" className="agent-concept-contracts__track" data-tone="response">
            <i />
          </div>
        </section>
      </div>
      <ContractEndpoint kind="consumer" label={spec.consumerLabel} />

      <section className="agent-concept-contracts__outcomes" aria-label="Explicit typed outcomes">
        <div className="agent-concept-contracts__outcomes-heading">
          <GitBranch aria-hidden="true" />
          <span>
            <small>Return union</small>
            <strong>Every call ends in one inspectable state</strong>
          </span>
        </div>
        <div>
          {spec.outcomes.map((outcome) => {
            const OutcomeIcon = outcome.tone === "response"
              ? CheckCircle2
              : outcome.tone === "error"
                ? TriangleAlert
                : CircleSlash2;
            return (
              <article data-tone={outcome.tone} key={outcome.label}>
                <OutcomeIcon aria-hidden="true" />
                <span>
                  <strong>{outcome.label}</strong>
                  <small>{outcome.summary}</small>
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ConceptDiagramStage({
  spec,
}: {
  readonly spec: AgentConceptDiagramSpec;
}): React.JSX.Element {
  if (spec.id === "harness") return <HarnessDiagram spec={spec} />;
  if (spec.id === "run-loop") return <RunLoopDiagram spec={spec} />;
  return <TypedContractsDiagram spec={spec} />;
}

export function AgentConceptDiagram({
  conceptId,
}: AgentConceptDiagramProps): React.JSX.Element {
  const [replayCount, setReplayCount] = useState(0);
  const spec = getAgentConceptDiagramSpec(conceptId);

  return (
    <figure
      aria-label={`${conceptId.replaceAll("-", " ")} concept diagram`}
      className="agent-concept-diagram"
      data-concept-id={conceptId}
    >
      <div className="agent-concept-diagram__toolbar">
        <ConceptLegend legend={spec.legend} />
        <button
          className="agent-concept-diagram__replay"
          onClick={() => setReplayCount((currentCount) => currentCount + 1)}
          type="button"
        >
          <RefreshCw aria-hidden="true" />
          Replay diagram
        </button>
      </div>
      <div
        className="agent-concept-diagram__stage"
        data-concept-stage={conceptId}
        data-replay={replayCount}
        key={`${conceptId}:${replayCount}`}
      >
        <ConceptDiagramStage spec={spec} />
      </div>
      <figcaption>
        <Network aria-hidden="true" />
        <span>{spec.caption}</span>
      </figcaption>
    </figure>
  );
}
