import {
  ArrowRight,
  Boxes,
  ClockAlert,
  GitBranch,
  Info,
  Network,
  RefreshCw,
  Repeat2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { CSSProperties } from "react";

import { AgentNodeIcon } from "./AgentNodeIcon";
import {
  buildAgentFlowLegViews,
  getActiveGroupIds,
  getAgentDetailTargetKey,
  getAgentGroup,
  getTopologyDescription,
  type AgentFlowLegView,
} from "./agent-diagram-model";
import {
  agentGroupOrder,
  agentLessonStateLabels,
} from "./agent-knowledge";
import type {
  AgentAttemptStatus,
  AgentArchitectureModel,
  AgentComponentGroup,
  AgentContractDirection,
  AgentDetailTarget,
  AgentLessonStep,
  AgentRelationshipId,
  AgentTopologyKind,
} from "./agent-types";

interface AgentArchitectureMapProps {
  readonly model: AgentArchitectureModel;
  readonly onSelectTarget: (
    target: AgentDetailTarget,
    trigger: HTMLButtonElement,
  ) => void;
  readonly selectedTarget: AgentDetailTarget | null;
  readonly step: AgentLessonStep;
}

interface RelationshipRoute {
  readonly path: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly lane: "diagram" | "forward" | "return" | "outer";
}

interface RelationshipPath {
  readonly forward: RelationshipRoute;
  readonly return?: RelationshipRoute;
}

const relationshipPaths: Readonly<Record<AgentRelationshipId, RelationshipPath>> = {
  "entry-to-runtime": {
    forward: {
      path: "M 100 529 C 100 543 138 556 176 556 L 224 556 C 262 556 300 543 300 529",
      labelX: 200,
      labelY: 548,
      lane: "forward",
    },
  },
  "runtime-to-context": {
    forward: {
      path: "M 276 317 L 276 262",
      labelX: 246,
      labelY: 281,
      lane: "diagram",
    },
    return: {
      path: "M 324 262 L 324 317",
      labelX: 354,
      labelY: 306,
      lane: "diagram",
    },
  },
  "runtime-to-models": {
    forward: {
      path: "M 350 317 C 372 292 414 273 455 262",
      labelX: 400,
      labelY: 278,
      lane: "diagram",
    },
    return: {
      path: "M 535 262 C 502 291 436 309 330 317",
      labelX: 466,
      labelY: 309,
      lane: "diagram",
    },
  },
  "runtime-to-agents": {
    forward: {
      path: "M 300 529 C 300 543 338 556 376 556 L 424 556 C 462 556 500 543 500 529",
      labelX: 400,
      labelY: 548,
      lane: "forward",
    },
    return: {
      path: "M 500 529 C 500 563 462 592 424 592 L 376 592 C 338 592 300 563 300 529",
      labelX: 400,
      labelY: 610,
      lane: "return",
    },
  },
  "agents-to-tools": {
    forward: {
      path: "M 500 529 C 500 543 538 556 576 556 L 624 556 C 662 556 700 543 700 529",
      labelX: 600,
      labelY: 548,
      lane: "forward",
    },
    return: {
      path: "M 700 529 C 700 563 662 592 624 592 L 576 592 C 538 592 500 563 500 529",
      labelX: 600,
      labelY: 610,
      lane: "return",
    },
  },
  "agents-to-governance": {
    forward: {
      path: "M 586 348 C 598 326 602 284 614 252",
      labelX: 600,
      labelY: 288,
      lane: "diagram",
    },
  },
  "governance-to-runtime": {
    forward: {
      path: "M 700 50 C 700 42 690 40 680 40 L 220 40 C 208 40 200 48 200 60 L 200 348 C 200 356 206 360 214 360",
      labelX: 450,
      labelY: 36,
      lane: "outer",
    },
  },
  "governance-to-tools": {
    forward: {
      path: "M 692 262 L 692 317",
      labelX: 700,
      labelY: 284,
      lane: "diagram",
    },
  },
  "governance-to-outcome": {
    forward: {
      path: "M 786 252 C 798 284 802 326 814 348",
      labelX: 800,
      labelY: 288,
      lane: "diagram",
    },
  },
  "tools-to-outcome": {
    forward: {
      path: "M 700 529 C 700 543 738 556 776 556 L 824 556 C 862 556 900 543 900 529",
      labelX: 800,
      labelY: 548,
      lane: "forward",
    },
  },
  "outcome-to-context": {
    forward: {
      path: "M 900 317 C 954 306 986 266 986 210 L 986 76 C 986 52 970 40 944 40 L 340 40 C 320 40 300 44 300 50",
      labelX: 825,
      labelY: 36,
      lane: "outer",
    },
  },
  "outcome-to-entry": {
    forward: {
      path: "M 900 529 C 900 580 796 616 730 616 L 270 616 C 204 616 100 580 100 529",
      labelX: 800,
      labelY: 608,
      lane: "outer",
    },
  },
};

const topologyIcons: Readonly<
  Record<AgentTopologyKind, typeof Boxes>
> = {
  system: Boxes,
  sequence: ArrowRight,
  "pair-loop": Repeat2,
  star: Network,
  cycle: RefreshCw,
  retry: RotateCcw,
  "fan-out": GitBranch,
};

function ArchitectureConnectors({
  model,
  step,
}: Pick<AgentArchitectureMapProps, "model" | "step">): React.JSX.Element {
  const flowLegs = buildAgentFlowLegViews(model, step);

  const getFlowLeg = (
    relationshipId: AgentRelationshipId,
    direction: AgentContractDirection,
  ): AgentFlowLegView | undefined => flowLegs.find(
    (leg) => leg.relationship.id === relationshipId && leg.direction === direction,
  );

  const renderPath = (
    relationshipId: AgentRelationshipId,
    direction: AgentContractDirection,
    route: RelationshipRoute,
  ): React.JSX.Element => {
    const flowLeg = getFlowLeg(relationshipId, direction);
    const state = flowLeg?.state ?? "quiet";
    const markerTone = flowLeg?.state === "active" ? flowLeg.tone : state;
    const suppressPacket = step.topology === "star"
      && relationshipId === "runtime-to-agents";
    const phaseStyle = flowLeg?.schedule === "system-overview"
      ? { "--agent-flow-delay": `${1000 + (flowLeg.phaseIndex * 900)}ms` } as CSSProperties
      : undefined;

    return (
      <g
        data-flow-direction={direction}
        data-flow-lane={route.lane}
        data-flow-phase={flowLeg?.phaseIndex}
        data-flow-schedule={flowLeg?.schedule}
        data-flow-tone={flowLeg?.tone}
        data-state={state}
        key={`${relationshipId}:${direction}`}
        style={phaseStyle}
      >
        <path
          className="agent-connectors__path"
          d={route.path}
          data-active={Boolean(flowLeg)}
          data-direction={direction}
          data-flow-lane={route.lane}
          data-flow-tone={flowLeg?.tone}
          data-state={state}
          markerEnd={`url(#agent-arrow-${flowLeg ? markerTone : "quiet"})`}
        />
        {flowLeg && !suppressPacket && (
          <FlowPacketPaths pathData={route.path} flowLeg={flowLeg} />
        )}
        {flowLeg && (
          <text
            className="agent-connectors__label"
            data-direction={direction}
            data-flow-lane={route.lane}
            data-flow-phase={flowLeg.phaseIndex}
            data-flow-schedule={flowLeg.schedule}
            data-flow-tone={flowLeg.tone}
            data-state={flowLeg.state}
            textAnchor="middle"
            x={route.labelX}
            y={route.labelY}
          >
            {flowLeg.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg
      aria-hidden="true"
      className="agent-connectors"
      data-flow-schedule={flowLegs[0]?.schedule ?? "lesson"}
      preserveAspectRatio="none"
      viewBox="0 0 1000 620"
    >
      <defs>
        {(["quiet", "request", "response", "failed", "retry", "recovered"] as const).map(
          (tone) => (
            <marker
              id={`agent-arrow-${tone}`}
              key={tone}
              markerHeight="6"
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              orient="auto"
              refX="6.5"
              refY="3"
              viewBox="0 0 7 6"
            >
              <path d="M 0 0 L 7 3 L 0 6 z" />
            </marker>
          ),
        )}
      </defs>
      {model.relationships.map((relationship) => {
        const path = relationshipPaths[relationship.id];
        return (
          <g
            data-active={flowLegs.some(
              (leg) => leg.relationship.id === relationship.id,
            )}
            data-relationship-id={relationship.id}
            key={relationship.id}
          >
            {renderPath(
              relationship.id,
              "forward",
              path.forward,
            )}
            {path.return && renderPath(
              relationship.id,
              "return",
              path.return,
            )}
          </g>
        );
      })}
      {step.eventKind === "record-tool-failure" && (
        <g
          className="agent-timeout-marker"
          data-timeout-endpoint="tools"
          transform="translate(700 544)"
        >
          <circle r="14" />
          <ClockAlert aria-hidden="true" height="18" width="18" x="-9" y="-9" />
        </g>
      )}
    </svg>
  );
}

function FlowPacketPaths({
  flowLeg,
  pathData,
}: {
  readonly flowLeg: AgentFlowLegView;
  readonly pathData: string;
}): React.JSX.Element {
  return (
    <g
      data-direction={flowLeg.direction}
      data-flow-id={flowLeg.id}
      data-flow-phase={flowLeg.phaseIndex}
      data-flow-phases={flowLeg.phaseCount}
      data-flow-schedule={flowLeg.schedule}
      data-flow-tone={flowLeg.tone}
      data-state={flowLeg.state}
      key={`${flowLeg.id}:${flowLeg.phaseIndex}`}
    >
      <path
        className="agent-flow-packet agent-flow-packet--trail"
        d={pathData}
        pathLength="100"
      />
      <path
        className="agent-flow-packet agent-flow-packet--head"
        d={pathData}
        pathLength="100"
      />
    </g>
  );
}

function WorkerStarOverlay({
  model,
  step,
}: Pick<AgentArchitectureMapProps, "model" | "step">): React.JSX.Element | null {
  if (step.topology !== "star") return null;
  const starLegs = buildAgentFlowLegViews(model, step).filter(
    (leg) => leg.relationship.id === "runtime-to-agents",
  );
  const forwardLeg = starLegs.find((leg) => leg.direction === "forward");
  const returnLeg = starLegs.find((leg) => leg.direction === "return");
  const requestTrunkPath = "M 386 412 L 402 412";
  const returnTrunkPath = "M 402 436 L 386 436";

  return (
    <svg
      aria-hidden="true"
      className="agent-star-overlay"
      data-relationship-id="runtime-to-agents"
      preserveAspectRatio="none"
      viewBox="0 0 1000 620"
    >
      <defs>
        {(["request", "response"] as const).map((tone) => (
          <marker
            id={`agent-star-arrow-${tone}`}
            key={tone}
            markerHeight="6"
            markerUnits="userSpaceOnUse"
            markerWidth="7"
            orient="auto"
            refX="6.5"
            refY="3"
            viewBox="0 0 7 6"
          >
            <path d="M 0 0 L 7 3 L 0 6 z" />
          </marker>
        ))}
      </defs>
      <path
        className="agent-star-overlay__trunk"
        data-direction="forward"
        data-flow-tone={forwardLeg?.tone ?? "request"}
        data-star-trunk="request"
        d={requestTrunkPath}
      />
      <path
        className="agent-star-overlay__trunk"
        data-direction="return"
        data-flow-tone={returnLeg?.tone ?? "response"}
        data-star-trunk="return"
        d={returnTrunkPath}
        markerEnd={`url(#agent-star-arrow-${returnLeg?.tone ?? "response"})`}
      />
      <circle
        cx="402"
        cy="412"
        data-flow-tone={forwardLeg?.tone ?? "request"}
        data-star-junction="request"
        r="5"
      />
      <circle
        cx="402"
        cy="436"
        data-flow-tone={returnLeg?.tone ?? "response"}
        data-star-junction="return"
        r="5"
      />
      {[385, 424, 463].map((targetY, index) => {
        const forwardPath = `M 402 412 C 410 412 408 ${targetY - 6} 414 ${targetY - 6}`;
        const forwardFlowPath = `${requestTrunkPath} C 410 412 408 ${targetY - 6} 414 ${targetY - 6}`;
        const returnPath = `M 414 ${targetY + 6} C 408 ${targetY + 6} 410 436 402 436`;
        const returnFlowPath = `${returnPath} L 386 436`;
        return (
          <g data-star-spoke={index + 1} key={targetY}>
            <path
              className="agent-star-overlay__path"
              data-direction="forward"
              data-flow-tone={forwardLeg?.tone}
              data-state={forwardLeg?.state}
              d={forwardPath}
              markerEnd={`url(#agent-star-arrow-${forwardLeg?.tone ?? "request"})`}
            />
            <path
              className="agent-star-overlay__path"
              data-direction="return"
              data-flow-tone={returnLeg?.tone}
              data-state={returnLeg?.state}
              d={returnPath}
            />
            {forwardLeg && (
              <FlowPacketPaths flowLeg={forwardLeg} pathData={forwardFlowPath} />
            )}
            {returnLeg && (
              <FlowPacketPaths flowLeg={returnLeg} pathData={returnFlowPath} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function MobileActiveContracts({
  model,
  step,
}: Pick<AgentArchitectureMapProps, "model" | "step">): React.JSX.Element {
  if (step.topology === "system") {
    const isGroupTour = step.eventKind === "map-components";
    return (
      <div
        aria-live="polite"
        className="agent-mobile-contracts agent-mobile-contracts--system"
        data-system-tour={isGroupTour ? "groups" : "loop"}
      >
        <span>{isGroupTour ? "System group tour" : "Illustrative system loop"}</span>
        <div
          aria-label={isGroupTour
            ? "Scanning the eight agent system groups"
            : "Tracing a representative agent request and return loop"}
          className="agent-mobile-system-tour"
          role="img"
        >
          {agentGroupOrder.map((groupId, index) => (
            <span
              data-tour-order={index}
              key={groupId}
              style={{ "--agent-tour-delay": `${index * 900}ms` } as CSSProperties}
            >
              {getAgentGroup(model, groupId).shortLabel}
            </span>
          ))}
        </div>
        <p>
          {isGroupTour
            ? "The highlight keeps moving so every responsibility stays visible."
            : "Requests move forward, results return, and the outcome closes the loop."}
        </p>
      </div>
    );
  }

  const flowLegs = buildAgentFlowLegViews(model, step);
  const starWorkers = model.components.filter(
    (component) => component.groupId === "agents" && component.kind === "worker",
  );
  const activeContracts = flowLegs.flatMap((flowLeg) => {
    const source = getAgentGroup(model, flowLeg.sourceGroupId).shortLabel;
    const target = getAgentGroup(model, flowLeg.targetGroupId).shortLabel;
    if (step.topology !== "star") {
      return [{ ...flowLeg, source, target, contract: flowLeg.label }];
    }

    return starWorkers.map((worker) => ({
      ...flowLeg,
      id: `${flowLeg.id}:${worker.id}`,
      source: flowLeg.direction === "forward" ? source : worker.shortLabel,
      target: flowLeg.direction === "forward" ? worker.shortLabel : target,
      contract: flowLeg.label,
    }));
  });

  return (
    <div aria-live="polite" className="agent-mobile-contracts">
      <span>Active direction</span>
      {activeContracts.length === 0 ? (
        <p>System map first; no path is moving yet.</p>
      ) : (
        <ul>
          {activeContracts.map((contract) => (
            <li
              data-direction={contract.direction}
              data-flow-phase={contract.phaseIndex}
              data-flow-phases={contract.phaseCount}
              data-flow-schedule={contract.schedule}
              data-flow-tone={contract.tone}
              data-state={contract.state}
              key={`${step.eventKind}:${contract.id}`}
            >
              <div className="agent-mobile-contracts__route">
                <strong>{contract.source}</strong>
                <span aria-hidden="true" className="agent-mobile-contracts__track">
                  <i />
                </span>
                <ArrowRight aria-hidden="true" />
                <strong>{contract.target}</strong>
              </div>
              <span>{contract.contract}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AgentGroupCard({
  group,
  model,
  onSelectTarget,
  selectedTarget,
  step,
}: {
  readonly group: AgentComponentGroup;
} & AgentArchitectureMapProps): React.JSX.Element {
  const activeComponentIds = new Set(step.activeComponentIds);
  const activeGroupIds = new Set(getActiveGroupIds(model, step));
  const selectedKey = getAgentDetailTargetKey(selectedTarget);
  const groupTarget: AgentDetailTarget = { kind: "group", groupId: group.id };
  const groupSelected = selectedKey === getAgentDetailTargetKey(groupTarget);
  const components = group.componentIds.map((componentId) => {
    const component = model.components.find((candidate) => candidate.id === componentId);
    if (!component) throw new Error(`Missing component "${componentId}" in group "${group.id}".`);
    return component;
  });

  return (
    <section
      aria-label={`${group.label} components`}
      className="agent-group-card"
      data-accent={group.accent}
      data-active={activeGroupIds.has(group.id)}
      data-group-id={group.id}
      data-group-order={agentGroupOrder.indexOf(group.id)}
    >
      <button
        aria-haspopup="dialog"
        aria-pressed={groupSelected}
        className="agent-group-card__heading"
        onClick={(event) => onSelectTarget(groupTarget, event.currentTarget)}
        type="button"
      >
        <span>{String(agentGroupOrder.indexOf(group.id) + 1).padStart(2, "0")}</span>
        <strong>{group.label}</strong>
        <Info aria-hidden="true" />
      </button>
      <div className="agent-group-card__components">
        {components.map((component) => {
          const target: AgentDetailTarget = {
            kind: "component",
            componentId: component.id,
          };
          const isSelected = selectedKey === getAgentDetailTargetKey(target);
          return (
            <button
              aria-haspopup="dialog"
              aria-label={`Inspect ${component.label}`}
              aria-pressed={isSelected}
              className="agent-component-button"
              data-accent={component.accent}
              data-active={activeComponentIds.has(component.id)}
              data-component-id={component.id}
              key={component.id}
              onClick={(event) => onSelectTarget(target, event.currentTarget)}
              type="button"
            >
              <span className="agent-component-button__icon">
                <AgentNodeIcon kind={component.kind} />
              </span>
              <span>{component.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const attemptStatusLabels: Readonly<Record<AgentAttemptStatus, string>> = {
  waiting: "Waiting",
  running: "Running",
  "timed-out": "Timed out",
  returned: "Returned",
};

function AttemptStatus({ status }: { readonly status: AgentAttemptStatus }): React.JSX.Element {
  return (
    <strong data-state={status}>
      {status === "timed-out" && <ClockAlert aria-hidden="true" />}
      <span>{attemptStatusLabels[status]}</span>
    </strong>
  );
}

function RecoveryAttempts({ step }: { readonly step: AgentLessonStep }): React.JSX.Element | null {
  if (step.topology !== "retry") return null;
  if (!step.attemptStatuses) {
    throw new Error(`Retry lesson "${step.eventKind}" is missing attempt statuses.`);
  }
  const [attemptOne, attemptTwo] = step.attemptStatuses;
  return (
    <section aria-live="polite" className="agent-retry-ledger">
      <div>
        <span>Attempt 1</span>
        <AttemptStatus status={attemptOne} />
      </div>
      <ArrowRight aria-hidden="true" />
      <div>
        <span>Attempt 2</span>
        <AttemptStatus status={attemptTwo} />
      </div>
      <p>
        {attemptOne === "timed-out"
          ? "Attempt 1's deadline expired with no result; Attempt 2 is a separate request."
          : "Each attempt has its own request and status; only completed calls have a return."}
      </p>
    </section>
  );
}

export function AgentArchitectureMap({
  model,
  onSelectTarget,
  selectedTarget,
  step,
}: AgentArchitectureMapProps): React.JSX.Element {
  const TopologyIcon = topologyIcons[step.topology];
  const selectedKey = getAgentDetailTargetKey(selectedTarget);
  const systemMotion = step.eventKind === "map-components"
    ? "group-tour"
    : step.eventKind === "show-harness"
      ? "harness-loop"
      : "contract-flow";
  return (
    <section
      aria-label="Interactive AI agent system map"
      className="agent-architecture-map"
      data-flow-schedule={step.eventKind === "show-harness" ? "system-overview" : "lesson"}
      data-lesson-state={step.state}
      data-system-motion={systemMotion}
      data-topology={step.topology}
    >
      <header className="agent-lesson-card">
        <div className="agent-lesson-card__pattern">
          <span><TopologyIcon aria-hidden="true" /></span>
          <div>
            <small>Pattern</small>
            <strong>{step.patternLabel}</strong>
          </div>
        </div>
        <div className="agent-lesson-card__copy">
          <small>Focus · {agentLessonStateLabels[step.state]}</small>
          <h3>{step.label}</h3>
          <p>{step.summary}</p>
        </div>
        <p className="agent-lesson-card__reading">{getTopologyDescription(step.topology)}</p>
      </header>

      <div aria-label="Architecture concepts" className="agent-concept-buttons" role="group">
        {model.concepts.map((concept) => {
          const target: AgentDetailTarget = { kind: "concept", conceptId: concept.id };
          return (
            <button
              aria-haspopup="dialog"
              aria-pressed={selectedKey === getAgentDetailTargetKey(target)}
              key={concept.id}
              onClick={(event) => onSelectTarget(target, event.currentTarget)}
              type="button"
            >
              {concept.id === "harness" ? (
                <ShieldCheck aria-hidden="true" />
              ) : concept.id === "run-loop" ? (
                <RefreshCw aria-hidden="true" />
              ) : (
                <GitBranch aria-hidden="true" />
              )}
              <span>{concept.label}</span>
            </button>
          );
        })}
      </div>

      <MobileActiveContracts model={model} step={step} />

      <div className="agent-system-canvas">
        <div aria-hidden="true" className="agent-harness-boundary">
          <span className="agent-harness-boundary__frame" />
          <span className="agent-harness-boundary__label">
            <ShieldCheck /> Agent harness boundary
          </span>
        </div>
        <ArchitectureConnectors
          key={`connectors:${step.eventKind}`}
          model={model}
          step={step}
        />
        <div className="agent-system-grid">
          {agentGroupOrder.map((groupId) => (
            <AgentGroupCard
              group={getAgentGroup(model, groupId)}
              key={groupId}
              model={model}
              onSelectTarget={onSelectTarget}
              selectedTarget={selectedTarget}
              step={step}
            />
          ))}
        </div>
        <WorkerStarOverlay
          key={`star:${step.eventKind}`}
          model={model}
          step={step}
        />
      </div>
      <RecoveryAttempts step={step} />
    </section>
  );
}
