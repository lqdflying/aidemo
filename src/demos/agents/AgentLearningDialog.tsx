import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRightFromLine,
  Boxes,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  Lightbulb,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { AgentNodeIcon } from "./AgentNodeIcon";
import {
  agentEngineeringConceptLearning,
  agentLoopPassLabels,
  architectureZoneLearning,
} from "./agent-knowledge";
import type {
  AgentDetailTarget,
  AgentEngineeringConcept,
  AgentEventKind,
  AgentSimulation,
  AgentTraceStep,
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureZone,
} from "./agent-types";

interface AgentLearningDialogProps {
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onNavigate: (target: AgentDetailTarget) => void;
  readonly simulation: AgentSimulation;
  readonly target: AgentDetailTarget | null;
  readonly traceStep: AgentTraceStep;
}

interface LearningFact {
  readonly label: string;
  readonly value: string;
}

const FOCUSABLE_ELEMENT_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getTargetKey(target: AgentDetailTarget | null): string {
  if (!target) return "closed";
  if (target.kind === "node") return `node:${target.nodeId}`;
  if (target.kind === "zone") return `zone:${target.zone}`;
  return `concept:${target.concept}`;
}

function joinResolvedLabels(
  ids: readonly string[],
  items: readonly { readonly id: string; readonly label: string }[],
): string {
  return ids
    .map((id) => items.find((item) => item.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");
}

function hasReachedEvent(
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
  eventKind: AgentEventKind,
): boolean {
  const eventStep = simulation.trace.find((step) => step.eventKind === eventKind);
  return eventStep ? traceStep.number >= eventStep.number : false;
}

function getTaskStatus(
  ownerId: string,
  finalStatus: string,
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): string {
  if (ownerId === "logs-agent") {
    if (!hasReachedEvent(simulation, traceStep, "decompose-dag")) return "planned";
    if (!hasReachedEvent(simulation, traceStep, "detect-tool-failure")) return "in progress";
    if (!hasReachedEvent(simulation, traceStep, "retry-narrow-query")) {
      return "failed · timeout recorded";
    }
    if (!hasReachedEvent(simulation, traceStep, "complete-log-retry")) {
      return "retrying · new bounded call";
    }
    return "recovered";
  }

  if (ownerId === "remediation-agent") {
    if (!hasReachedEvent(simulation, traceStep, "decompose-dag")) return "planned";
    if (!hasReachedEvent(simulation, traceStep, "reconcile-evidence")) {
      return "blocked · log evidence missing";
    }
    if (traceStep.eventKind === "reconcile-evidence") {
      return "ready · evidence reconciled";
    }
  }

  return finalStatus;
}

function getVisibleLogObservations(
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): AgentSimulation["observations"] {
  if (!hasReachedEvent(simulation, traceStep, "detect-tool-failure")) return [];

  const retryHasCompleted = hasReachedEvent(
    simulation,
    traceStep,
    "complete-log-retry",
  );

  return simulation.observations.filter((observation) =>
    observation.serverId === "logs-mcp" &&
    (retryHasCompleted || observation.status === "failed")
  );
}

function getNodeFacts(
  node: ArchitectureNode,
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): readonly LearningFact[] {
  if (node.kind === "model") {
    const model = simulation.models.find((candidate) => candidate.id === node.id);
    if (!model) return [];
    return [
      { label: "Location", value: model.location },
      { label: "Memory", value: model.stateless ? "Stateless on every call" : "Stateful" },
      { label: "Used for", value: model.purpose },
    ];
  }

  if (node.kind === "memory") {
    const store = simulation.memoryStores.find((candidate) => candidate.id === node.id);
    if (!store) return [];
    return [
      { label: "Scope", value: store.scope },
      { label: "Owner", value: store.owner },
      { label: "Retention", value: store.retention },
      { label: "Example contents", value: store.entries.join(" · ") },
    ];
  }

  if (node.kind === "agent") {
    const agent = simulation.agents.find((candidate) => candidate.id === node.id);
    if (!agent) return [];
    const task = simulation.tasks.find((candidate) => candidate.ownerId === agent.id);
    return [
      { label: "Role", value: agent.role },
      { label: "Model", value: simulation.models.find((model) => model.id === agent.modelEndpointId)?.label ?? "Not assigned" },
      { label: "Working memory", value: agent.workingMemory },
      { label: "Skills", value: joinResolvedLabels(agent.skillIds, simulation.skills) },
      { label: "Allowed tools", value: joinResolvedLabels(agent.toolServerIds, simulation.mcpServers) },
      {
        label: "Current task",
        value: task
          ? `${task.title} · ${getTaskStatus(task.ownerId, task.status, simulation, traceStep)}`
          : "No task assigned",
      },
    ];
  }

  if (node.kind === "mcp" || node.kind === "rag") {
    const server = simulation.mcpServers.find((candidate) => candidate.id === node.id);
    if (!server) return [];
    const observations = server.id === "logs-mcp"
      ? getVisibleLogObservations(simulation, traceStep)
      : simulation.observations.filter(
          (observation) => observation.serverId === server.id,
        );
    const actionHook = node.id === "cloud-control-mcp"
      ? simulation.hooks.find((hook) => hook.phase === "action")
      : undefined;
    return [
      { label: "Access", value: server.access },
      { label: "Authorization", value: server.authorization },
      { label: "Tools", value: server.tools.join(" · ") },
      ...(actionHook
        ? [{ label: actionHook.label, value: actionHook.checks.join(" · ") }]
        : []),
      ...observations.map((observation, index) => ({
        label: server.id === "logs-mcp"
          ? `Attempt ${index + 1} · ${observation.status}`
          : `Observation · ${observation.status}`,
        value: `${observation.output} · ${observation.provenance}`,
      })),
    ];
  }

  if (node.id === "skills-library") {
    return simulation.skills.map((skill) => ({
      label: skill.label,
      value: skill.purpose,
    }));
  }

  if (node.id === "input-gateway") {
    const inputHook = simulation.hooks.find((hook) => hook.phase === "input");
    return inputHook
      ? [{ label: inputHook.label, value: inputHook.checks.join(" · ") }]
      : [];
  }

  if (node.id === "output-hooks") {
    const outputHook = simulation.hooks.find((hook) => hook.phase === "output");
    return outputHook
      ? [{ label: outputHook.label, value: outputHook.checks.join(" · ") }]
      : [];
  }

  if (node.id === "orchestrator") {
    return [
      { label: "Routing pattern", value: "Gateway / Router selects the CloudOps workflow" },
      { label: "Execution pattern", value: "Graph / DAG runs three investigations before remediation" },
    ];
  }

  if (node.id === "human-approver") {
    return [
      { label: "Decision state", value: simulation.approvalState },
      { label: "Primary proposal", value: simulation.primaryPlan.title },
      { label: "Safer alternative", value: simulation.saferPlan.title },
    ];
  }

  if (node.id === "verified-outcome") {
    return [
      {
        label: "External actions",
        value: simulation.externalActions.length > 0
          ? simulation.externalActions.map((action) => action.label).join(" · ")
          : "None before approval",
      },
      { label: "Recovery target", value: "p95 420ms · errors 0.7%" },
    ];
  }

  if (node.id === "incident-channel") {
    return [
      { label: "Incident", value: simulation.incident.title },
      { label: "Service", value: simulation.incident.service },
      { label: "Severity", value: simulation.incident.severity },
      { label: "Signal", value: simulation.incident.metrics.map((metric) => `${metric.label} ${metric.value}`).join(" · ") },
    ];
  }

  return [];
}

function getNodeIncidentExample(
  node: ArchitectureNode,
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): string {
  const relevantSteps = simulation.trace.filter((step) => step.nodeIds.includes(node.id));
  if (traceStep.nodeIds.includes(node.id)) {
    if (traceStep.state === "failed") {
      return `Failed in Flow ${traceStep.number}: ${traceStep.label}. No tool result advanced to another component.`;
    }
    if (traceStep.state === "retry") {
      return `A separate retry is active in Flow ${traceStep.number}: ${traceStep.label}. It does not replace the failed attempt.`;
    }
    if (traceStep.state === "recovered") {
      return `Attempt 2 succeeded in Flow ${traceStep.number}: ${traceStep.label}. Attempt 1 remains recorded as failed.`;
    }
    return `Active now in Flow ${traceStep.number}: ${traceStep.label}. It carries ${traceStep.packet}.`;
  }

  const mostRecentStep = relevantSteps
    .filter((step) => step.number < traceStep.number)
    .at(-1);
  if (mostRecentStep) {
    return `Most recently active in Flow ${mostRecentStep.number}: ${mostRecentStep.label}. It carried ${mostRecentStep.packet}.`;
  }

  const nextStep = relevantSteps.find((step) => step.number > traceStep.number);
  return nextStep
    ? `Scheduled for Flow ${nextStep.number}: ${nextStep.label}. It will carry ${nextStep.packet}.`
    : "This component is part of the architecture but is not used by the current flow.";
}

function getZoneIncidentExample(
  zone: ArchitectureZone,
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): string {
  const activeNodes = simulation.nodes.filter(
    (node) => node.zone === zone && traceStep.nodeIds.includes(node.id),
  );
  if (activeNodes.length === 0) {
    return `No component in this layer is active during Flow ${traceStep.number}. The layer remains available as a controlled boundary.`;
  }

  if (traceStep.state === "failed") {
    return `Flow ${traceStep.number} failed inside this layer. The timeout is recorded, and no result leaves the boundary.`;
  }

  if (traceStep.state === "retry") {
    return `Flow ${traceStep.number} is a new bounded retry inside this layer; the earlier failed attempt remains separate.`;
  }

  if (traceStep.state === "recovered") {
    return `Flow ${traceStep.number} returned evidence from attempt 2; attempt 1 remains a separate failed observation.`;
  }

  return `Flow ${traceStep.number} is using ${activeNodes.map((node) => node.label).join(" and ")} for ${traceStep.label.toLowerCase()}.`;
}

function ConnectionColumn({
  direction,
  edges,
  simulation,
  onNavigate,
}: {
  readonly direction: "incoming" | "outgoing";
  readonly edges: readonly ArchitectureEdge[];
  readonly simulation: AgentSimulation;
  readonly onNavigate: (target: AgentDetailTarget) => void;
}): React.JSX.Element {
  const isIncoming = direction === "incoming";
  return (
    <section className="agent-learning__connections-column">
      <h3>{isIncoming ? "Receives from" : "Produces for"}</h3>
      {edges.length === 0 ? (
        <p>{isIncoming ? "External input outside this map" : "No outgoing connection in this map"}</p>
      ) : (
        <div>
          {edges.map((edge) => {
            const nodeId = isIncoming ? edge.sourceId : edge.targetId;
            const connectedNode = simulation.nodes.find((node) => node.id === nodeId);
            if (!connectedNode) return null;
            return (
              <button
                aria-label={`Learn about connected component ${connectedNode.label}`}
                key={edge.id}
                onClick={() => onNavigate({ kind: "node", nodeId })}
                type="button"
              >
                {isIncoming ? <ArrowDownToLine aria-hidden="true" /> : <ArrowRightFromLine aria-hidden="true" />}
                <span><strong>{connectedNode.label}</strong><small>{edge.label}</small></span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LearningCards({
  purpose,
  stateAndAuthority,
  designRationale,
  risk,
  incidentExample,
}: {
  readonly purpose: string;
  readonly stateAndAuthority: string;
  readonly designRationale: string;
  readonly risk: string;
  readonly incidentExample: string;
}): React.JSX.Element {
  return (
    <div className="agent-learning__card-grid">
      <article><Boxes aria-hidden="true" /><div><h3>What it does</h3><p>{purpose}</p></div></article>
      <article><ShieldCheck aria-hidden="true" /><div><h3>State &amp; authority</h3><p>{stateAndAuthority}</p></div></article>
      <article className="agent-learning__principle"><Lightbulb aria-hidden="true" /><div><small>Architecture principle</small><h3>Why this design</h3><p>{designRationale}</p></div></article>
      <article><CircleAlert aria-hidden="true" /><div><h3>What can go wrong</h3><p>{risk}</p></div></article>
      <article><CheckCircle2 aria-hidden="true" /><div><small>This demo example</small><h3>In this incident</h3><p>{incidentExample}</p></div></article>
    </div>
  );
}

function getConceptIncidentExample(
  concept: AgentEngineeringConcept,
  simulation: AgentSimulation,
  traceStep: AgentTraceStep,
): string {
  if (concept === "harness") {
    const activeFacets = simulation.harnessFacets.filter((facet) =>
      facet.nodeIds.some((nodeId) => traceStep.nodeIds.includes(nodeId))
    );
    return `Flow ${traceStep.number} uses ${activeFacets.map((facet) => facet.label).join(", ")} to carry ${traceStep.packet}.`;
  }

  const passLabel = agentLoopPassLabels[traceStep.loopPass];
  const stageLabel = simulation.loopPolicy.stages.find(
    (stage) => stage.id === traceStep.loopStage,
  )?.label ?? traceStep.loopStage;
  if (traceStep.state === "failed") {
    return `${passLabel} is at ${stageLabel}: attempt 1 ended with no result, so no dependent work advances.`;
  }
  if (traceStep.state === "retry") {
    return `${passLabel} is at ${stageLabel}: attempt 2 is a separate narrowed call within the one-call retry budget.`;
  }
  if (traceStep.state === "recovered") {
    return `${passLabel} is at ${stageLabel}: attempt 2 succeeded, while attempt 1 remains terminal failure history.`;
  }
  return `${passLabel} is at ${stageLabel} during Flow ${traceStep.number}: ${traceStep.label}.`;
}

function ConceptLearningBody({
  concept,
  simulation,
  traceStep,
}: {
  readonly concept: AgentEngineeringConcept;
  readonly simulation: AgentSimulation;
  readonly traceStep: AgentTraceStep;
}): React.JSX.Element {
  const learning = agentEngineeringConceptLearning[concept];

  return (
    <>
      <LearningCards
        designRationale={learning.designRationale}
        incidentExample={getConceptIncidentExample(concept, simulation, traceStep)}
        purpose={learning.purpose}
        risk={learning.risk}
        stateAndAuthority={learning.stateAndAuthority}
      />
      <section className="agent-learning__concept-system" aria-labelledby="agent-learning-concept-heading">
        <div>
          <small>{concept === "harness" ? "Engineering controls" : agentLoopPassLabels[traceStep.loopPass]}</small>
          <h3 id="agent-learning-concept-heading">
            {concept === "harness" ? "What the harness makes explicit" : "How this run advances"}
          </h3>
        </div>
        {concept === "harness" ? (
          <div className="agent-learning__facet-grid">
            {simulation.harnessFacets.map((facet) => {
              const isActive = facet.nodeIds.some((nodeId) => traceStep.nodeIds.includes(nodeId));
              return (
                <article
                  data-state={isActive ? traceStep.state ?? "active" : "quiet"}
                  key={facet.id}
                >
                  <i aria-hidden="true" />
                  <div><strong>{facet.label}</strong><p>{facet.summary}</p></div>
                </article>
              );
            })}
          </div>
        ) : (
          <ol className="agent-learning__loop-stages">
            {simulation.loopPolicy.stages.map((stage) => (
              <li
                aria-current={stage.id === traceStep.loopStage ? "step" : undefined}
                data-state={stage.id === traceStep.loopStage ? traceStep.state ?? "active" : "quiet"}
                key={stage.id}
              >
                <span>{stage.label}</span><p>{stage.purpose}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="agent-learning__facts agent-learning__concept-facts" aria-labelledby="agent-learning-policy-heading">
        <div><small>System contract</small><h3 id="agent-learning-policy-heading">Rules that make the run dependable</h3></div>
        <dl>
          <div><dt>Relationship</dt><dd>{learning.relationship}</dd></div>
          {concept === "harness" ? (
            <>
              <div><dt>Model responsibility</dt><dd>Transform approved context into a proposal, observation, or tool intent for one stateless call.</dd></div>
              <div><dt>Harness responsibility</dt><dd>Own state, context assembly, interfaces, policy enforcement, tracing, and evaluation.</dd></div>
              <div><dt>Enforcement</dt><dd>{simulation.hooks.flatMap((hook) => hook.checks).join(" · ")}</dd></div>
            </>
          ) : (
            <>
              <div><dt>Objective</dt><dd>{simulation.loopPolicy.objective}</dd></div>
              <div><dt>Retry budget</dt><dd>{simulation.loopPolicy.retryBudget}</dd></div>
              <div><dt>Completion</dt><dd>{simulation.loopPolicy.completionCriteria.join(" · ")}</dd></div>
              <div><dt>Stop / escalate</dt><dd>{simulation.loopPolicy.stopConditions.join(" · ")}</dd></div>
            </>
          )}
        </dl>
      </section>
    </>
  );
}

function NodeLearningBody({
  node,
  simulation,
  traceStep,
  onNavigate,
}: {
  readonly node: ArchitectureNode;
  readonly simulation: AgentSimulation;
  readonly traceStep: AgentTraceStep;
  readonly onNavigate: (target: AgentDetailTarget) => void;
}): React.JSX.Element {
  const incomingEdges = simulation.edges.filter((edge) => edge.targetId === node.id);
  const outgoingEdges = simulation.edges.filter((edge) => edge.sourceId === node.id);
  const facts = getNodeFacts(node, simulation, traceStep);

  return (
    <>
      <LearningCards
        designRationale={node.learning.designRationale}
        incidentExample={getNodeIncidentExample(node, simulation, traceStep)}
        purpose={node.learning.purpose}
        risk={node.learning.risk}
        stateAndAuthority={node.learning.stateAndAuthority}
      />
      {facts.length > 0 && (
        <section className="agent-learning__facts" aria-labelledby="agent-learning-facts-heading">
          <div><small>Live system facts</small><h3 id="agent-learning-facts-heading">How this component is configured</h3></div>
          <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        </section>
      )}
      <div className="agent-learning__connections">
        <ConnectionColumn direction="incoming" edges={incomingEdges} onNavigate={onNavigate} simulation={simulation} />
        <ConnectionColumn direction="outgoing" edges={outgoingEdges} onNavigate={onNavigate} simulation={simulation} />
      </div>
    </>
  );
}

function ZoneLearningBody({
  zone,
  simulation,
  traceStep,
  onNavigate,
}: {
  readonly zone: ArchitectureZone;
  readonly simulation: AgentSimulation;
  readonly traceStep: AgentTraceStep;
  readonly onNavigate: (target: AgentDetailTarget) => void;
}): React.JSX.Element {
  const learning = architectureZoneLearning[zone];
  const zoneNodes = simulation.nodes.filter((node) => node.zone === zone);

  return (
    <>
      <LearningCards
        designRationale={learning.designRationale}
        incidentExample={getZoneIncidentExample(zone, simulation, traceStep)}
        purpose={learning.purpose}
        risk={learning.risk}
        stateAndAuthority={learning.stateAndAuthority}
      />
      <section className="agent-learning__components" aria-labelledby="agent-learning-components-heading">
        <div><small>Inside this boundary</small><h3 id="agent-learning-components-heading">Explore the components</h3></div>
        <div>
          {zoneNodes.map((node) => (
            <button
              aria-label={`Learn about ${node.label}`}
              data-accent={node.accent}
              key={node.id}
              onClick={() => onNavigate({ kind: "node", nodeId: node.id })}
              type="button"
            >
              <AgentNodeIcon kind={node.kind} />
              <span><strong>{node.label}</strong><small>{node.description}</small></span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export function AgentLearningDialog({
  canGoBack,
  onBack,
  onClose,
  onNavigate,
  simulation,
  target,
  traceStep,
}: AgentLearningDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const previousTargetKeyRef = useRef("closed");
  const isOpen = target !== null;
  const targetKey = getTargetKey(target);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    triggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const rootElement = document.getElementById("root");
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    rootElement?.setAttribute("inert", "");
    rootElement?.setAttribute("aria-hidden", "true");
    closeButtonRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1);

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousBodyOverflow;
      rootElement?.removeAttribute("inert");
      rootElement?.removeAttribute("aria-hidden");
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    const previousTargetKey = previousTargetKeyRef.current;
    previousTargetKeyRef.current = targetKey;
    if (isOpen && previousTargetKey !== "closed" && previousTargetKey !== targetKey) {
      titleRef.current?.focus();
    }
    if (!isOpen) previousTargetKeyRef.current = "closed";
  }, [isOpen, targetKey]);

  if (!target) return null;

  const node = target.kind === "node"
    ? simulation.nodes.find((candidate) => candidate.id === target.nodeId)
    : undefined;
  const zoneLearning = target.kind === "zone"
    ? architectureZoneLearning[target.zone]
    : undefined;
  const conceptLearning = target.kind === "concept"
    ? agentEngineeringConceptLearning[target.concept]
    : undefined;
  if (target.kind === "node" && !node) return null;

  const title = node?.label ?? zoneLearning?.label ?? conceptLearning?.label ?? "Architecture detail";
  const summary = node?.description ?? zoneLearning?.summary ?? conceptLearning?.summary ?? "Architecture learning detail";
  const eyebrow = node
    ? `${node.zone} · ${node.kind}`
    : target.kind === "concept"
      ? "Agent systems discipline"
      : "Architecture layer";

  return createPortal(
    <div
      className="agent-learning__overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        aria-describedby="agent-learning-summary"
        aria-labelledby="agent-learning-title"
        aria-modal="true"
        className="agent-learning"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <div className="agent-learning__heading">
            {canGoBack && (
              <button aria-label="Back to previous architecture detail" onClick={onBack} type="button">
                <ArrowLeft aria-hidden="true" />Back
              </button>
            )}
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="agent-learning-title" ref={titleRef} tabIndex={-1}>{title}</h2>
            <p id="agent-learning-summary">{summary}</p>
          </div>
          <div className="agent-learning__heading-mark" aria-hidden="true">
            {node ? (
              <AgentNodeIcon kind={node.kind} />
            ) : target.kind === "concept" ? (
              target.concept === "harness" ? <ShieldCheck /> : <Workflow />
            ) : (
              <GitBranch />
            )}
          </div>
          <button aria-label="Close architecture detail" className="icon-button" onClick={() => onCloseRef.current()} ref={closeButtonRef} type="button">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="agent-learning__body">
          {node ? (
            <NodeLearningBody node={node} onNavigate={onNavigate} simulation={simulation} traceStep={traceStep} />
          ) : target.kind === "zone" ? (
            <ZoneLearningBody onNavigate={onNavigate} simulation={simulation} traceStep={traceStep} zone={target.zone} />
          ) : target.kind === "concept" ? (
            <ConceptLearningBody concept={target.concept} simulation={simulation} traceStep={traceStep} />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
