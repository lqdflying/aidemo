import {
  CheckCircle2,
  CircleX,
  GitBranch,
  Info,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { AgentNodeIcon } from "./AgentNodeIcon";
import {
  agentLoopPassLabels,
  architectureZoneLearning,
  architectureZones,
} from "./agent-knowledge";
import { agentPhases, type AgentPhase } from "./agent-routing";
import type {
  AgentDetailTarget,
  AgentHarnessFacet,
  AgentSimulation,
  AgentTraceStep,
  ArchitectureNode,
  ArchitectureNodeId,
  ArchitectureZone,
} from "./agent-types";

interface AgentArchitectureMapProps {
  readonly phase: AgentPhase;
  readonly simulation: AgentSimulation;
  readonly traceStep: AgentTraceStep;
  readonly onOpenDetail: (target: AgentDetailTarget) => void;
}

type MapState =
  | "pending"
  | "active"
  | "complete"
  | "failed"
  | "retry"
  | "recovered";
type AttemptStatus = "pending" | "running" | "failed" | "succeeded";

interface RecoveryAttempt {
  readonly id: "attempt-1" | "attempt-2";
  readonly label: string;
  readonly status: AttemptStatus;
  readonly statusLabel: string;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface ZoneBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const mapWidth = 1200;
const mapHeight = 450;

const nodePositions: Readonly<Record<ArchitectureNodeId, Point>> = {
  "incident-channel": { x: 108, y: 91 },
  "input-gateway": { x: 294, y: 72 },
  orchestrator: { x: 414, y: 142 },
  "session-context": { x: 618, y: 66 },
  "global-memory": { x: 828, y: 66 },
  "skills-library": { x: 618, y: 137 },
  "context-compactor": { x: 828, y: 137 },
  "remote-llm": { x: 1080, y: 66 },
  "local-llm": { x: 1080, y: 137 },
  "metrics-agent": { x: 120, y: 263 },
  "logs-agent": { x: 306, y: 263 },
  "runbook-agent": { x: 492, y: 263 },
  "remediation-agent": { x: 678, y: 263 },
  "metrics-mcp": { x: 852, y: 241 },
  "logs-mcp": { x: 1050, y: 241 },
  "knowledge-rag": { x: 852, y: 313 },
  "cloud-control-mcp": { x: 1050, y: 313 },
  "output-hooks": { x: 342, y: 397 },
  "human-approver": { x: 612, y: 397 },
  "verified-outcome": { x: 900, y: 397 },
};

const zoneBoxes: Readonly<Record<ArchitectureZone, ZoneBox>> = {
  entry: { x: 24, y: 22, width: 168, height: 156 },
  runtime: { x: 216, y: 22, width: 288, height: 156 },
  context: { x: 528, y: 22, width: 432, height: 156 },
  models: { x: 984, y: 22, width: 192, height: 156 },
  agents: { x: 24, y: 197, width: 720, height: 144 },
  tools: { x: 768, y: 197, width: 408, height: 144 },
  governance: { x: 24, y: 356, width: 1152, height: 78 },
};

function getNodeState(node: ArchitectureNode, traceStep: AgentTraceStep): MapState {
  if (traceStep.nodeIds.includes(node.id)) return traceStep.state ?? "active";
  return node.firstTraceStep < traceStep.number ? "complete" : "pending";
}

function getEdgeState(
  edgeId: string,
  firstTraceStep: number,
  traceStep: AgentTraceStep,
): MapState {
  if (traceStep.edgeIds.includes(edgeId)) return traceStep.state ?? "active";
  return firstTraceStep < traceStep.number ? "complete" : "pending";
}

function getActiveEdgeLabel(
  edgeId: string,
  defaultLabel: string,
  state: MapState,
): string {
  if (edgeId !== "logs-agent-to-mcp") return defaultLabel;
  if (state === "failed") return "timeout · no result";
  if (state === "retry") return "attempt 2 · running";
  if (state === "recovered") return "attempt 2 · evidence returned";
  if (state === "active") return "attempt 1 · running";
  return defaultLabel;
}

function getHarnessFacetState(
  facet: AgentHarnessFacet,
  traceStep: AgentTraceStep,
): "quiet" | "active" | "failed" | "retry" | "recovered" {
  const isActive = facet.nodeIds.some((nodeId) => traceStep.nodeIds.includes(nodeId));
  if (!isActive) return "quiet";
  return traceStep.state ?? "active";
}

function getRecoveryAttempts(traceStep: AgentTraceStep): readonly RecoveryAttempt[] {
  const attemptOneStatus: AttemptStatus = traceStep.eventKind === "run-broad-log-query"
    ? "running"
    : "failed";
  const attemptTwoStatus: AttemptStatus = [
    "complete-log-retry",
    "reconcile-evidence",
    "evaluate-output",
  ].includes(traceStep.eventKind)
    ? "succeeded"
    : traceStep.eventKind === "retry-narrow-query"
      ? "running"
      : "pending";

  return [
    {
      id: "attempt-1",
      label: "Attempt 1",
      status: attemptOneStatus,
      statusLabel: attemptOneStatus === "running"
        ? "Running broad query"
        : "Failed · timeout",
    },
    {
      id: "attempt-2",
      label: "Attempt 2",
      status: attemptTwoStatus,
      statusLabel: attemptTwoStatus === "running"
        ? "Running narrow query"
        : attemptTwoStatus === "succeeded"
          ? "Succeeded · evidence returned"
          : "Waiting for re-plan",
    },
  ];
}

function RecoveryAttemptLedger({
  traceStep,
}: {
  readonly traceStep: AgentTraceStep;
}): React.JSX.Element {
  const attempts = getRecoveryAttempts(traceStep);

  return (
    <section
      aria-atomic="true"
      aria-label="Recovery attempt history"
      aria-live="polite"
      className="agent-attempts"
    >
      <div>
        <small>Recovery attempts</small>
        <strong>Failure and retry stay separate</strong>
      </div>
      <ol>
        {attempts.map((attempt) => (
          <li data-state={attempt.status} key={attempt.id}>
            {attempt.status === "failed" ? (
              <CircleX aria-hidden="true" />
            ) : attempt.status === "succeeded" ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <LoaderCircle aria-hidden="true" />
            )}
            <span><small>{attempt.label}</small><strong>{attempt.statusLabel}</strong></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HarnessHeader({
  simulation,
  traceStep,
  onOpenDetail,
}: Omit<AgentArchitectureMapProps, "phase">): React.JSX.Element {
  return (
    <header className="agent-harness__header">
      <div className="agent-harness__identity">
        <span aria-hidden="true"><ShieldCheck /></span>
        <div>
          <small>Engineered environment</small>
          <strong>Harness Engineering</strong>
          <p>Intent, context, tools, authority, and evaluation around the model.</p>
        </div>
      </div>
      <div className="agent-harness__facets" aria-label="Harness engineering controls">
        {simulation.harnessFacets.map((facet) => (
          <span data-state={getHarnessFacetState(facet, traceStep)} key={facet.id}>
            {facet.label}
          </span>
        ))}
      </div>
      <button
        aria-haspopup="dialog"
        aria-label="Learn about Harness Engineering"
        onClick={() => onOpenDetail({ kind: "concept", concept: "harness" })}
        type="button"
      >
        <Info aria-hidden="true" />Explain harness
      </button>
    </header>
  );
}

function LoopRail({
  simulation,
  traceStep,
  onOpenDetail,
}: Omit<AgentArchitectureMapProps, "phase">): React.JSX.Element {
  const traceState = traceStep.state ?? "progress";
  const status = traceStep.eventKind === "run-broad-log-query"
    ? "Attempt 1 · broad call running"
    : traceStep.state === "failed"
    ? "Attempt 1 ended · no result advanced"
    : traceStep.state === "retry"
      ? "Attempt 2 · separate bounded call running"
      : traceStep.state === "recovered"
        ? "Attempt 2 succeeded · evidence returned"
        : traceStep.label;

  return (
    <section
      aria-label={`Loop Engineering, ${agentLoopPassLabels[traceStep.loopPass]}, ${traceStep.loopStage}`}
      className="agent-loop"
      data-state={traceState}
    >
      <header>
        <span aria-hidden="true"><Workflow /></span>
        <div>
          <small>Run protocol · {agentLoopPassLabels[traceStep.loopPass]}</small>
          <strong>Loop Engineering</strong>
        </div>
        <button
          aria-haspopup="dialog"
          aria-label="Learn about Loop Engineering"
          onClick={() => onOpenDetail({ kind: "concept", concept: "loop" })}
          type="button"
        >
          <Info aria-hidden="true" />Explain loop
        </button>
      </header>
      <ol>
        {simulation.loopPolicy.stages.map((stage) => (
          <li
            aria-current={stage.id === traceStep.loopStage ? "step" : undefined}
            data-state={stage.id === traceStep.loopStage ? traceState : "quiet"}
            key={stage.id}
          >
            <i aria-hidden="true" />
            <span>{stage.label}</span>
          </li>
        ))}
      </ol>
      <p aria-live="polite">{status}</p>
    </section>
  );
}

function DesktopArchitectureMap({
  simulation,
  traceStep,
  onOpenDetail,
}: Omit<AgentArchitectureMapProps, "phase">): React.JSX.Element {
  return (
    <div className="agent-map__desktop">
      {architectureZones.map((zone) => {
        const box = zoneBoxes[zone];
        return (
        <div
          className="agent-map__zone"
          data-zone={zone}
          key={zone}
          style={{
            height: `${(box.height / mapHeight) * 100}%`,
            left: `${(box.x / mapWidth) * 100}%`,
            top: `${(box.y / mapHeight) * 100}%`,
            width: `${(box.width / mapWidth) * 100}%`,
          }}
        >
          <button
            aria-haspopup="dialog"
            aria-label={`Learn about ${architectureZoneLearning[zone].label}`}
            className="agent-map__zone-trigger"
            onClick={() => onOpenDetail({ kind: "zone", zone })}
            type="button"
          >
            <span>{architectureZoneLearning[zone].label}</span><Info aria-hidden="true" />
          </button>
        </div>
        );
      })}

      <svg aria-hidden="true" className="agent-map__edges" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
        <defs>
          <marker id="agent-map-arrow" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" />
          </marker>
          <marker id="agent-map-arrow-retry" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" />
          </marker>
          <marker id="agent-map-arrow-recovered" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="7" refY="4">
            <path d="M 0 0 L 8 4 L 0 8 z" />
          </marker>
          <marker id="agent-map-failed" markerHeight="11" markerWidth="11" orient="auto" refX="5.5" refY="5.5">
            <circle cx="5.5" cy="5.5" r="4.25" />
            <path d="M 3.7 3.7 L 7.3 7.3 M 7.3 3.7 L 3.7 7.3" />
          </marker>
        </defs>
        {simulation.edges.map((edge) => {
          const source = nodePositions[edge.sourceId];
          const target = nodePositions[edge.targetId];
          if (!source || !target) return null;

          const state = getEdgeState(edge.id, edge.firstTraceStep, traceStep);
          const activeLabel = getActiveEdgeLabel(edge.id, edge.label, state);
          const midpointX = (source.x + target.x) / 2;
          const midpointY = (source.y + target.y) / 2 - 7;
          const markerEnd = state === "failed"
            ? "url(#agent-map-failed)"
            : state === "retry"
              ? "url(#agent-map-arrow-retry)"
              : state === "recovered"
                ? "url(#agent-map-arrow-recovered)"
              : "url(#agent-map-arrow)";

          return (
            <g data-edge-id={edge.id} data-flow={edge.kind} data-state={state} key={edge.id}>
              <line markerEnd={markerEnd} x1={source.x} x2={target.x} y1={source.y} y2={target.y} />
              {(state === "active" || state === "failed" || state === "retry" || state === "recovered") && (
                <text x={midpointX} y={midpointY}>{activeLabel}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="agent-map__nodes">
        {simulation.nodes.map((node) => {
          const position = nodePositions[node.id];
          if (!position) return null;
          const state = getNodeState(node, traceStep);

          return (
            <button
              aria-haspopup="dialog"
              aria-label={`Learn about ${node.label}`}
              className="agent-map-node"
              data-accent={node.accent}
              data-node-id={node.id}
              data-state={state}
              key={node.id}
              onClick={() => onOpenDetail({ kind: "node", nodeId: node.id })}
              style={{
                left: `${(position.x / mapWidth) * 100}%`,
                top: `${(position.y / mapHeight) * 100}%`,
              }}
              type="button"
            >
              <AgentNodeIcon kind={node.kind} />
              <span><small>{node.zone}</small><strong>{node.shortLabel}</strong></span>
              <Info aria-hidden="true" className="agent-map-node__learn" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileArchitectureMap({
  phase,
  simulation,
  traceStep,
  onOpenDetail,
}: AgentArchitectureMapProps): React.JSX.Element {
  const activePhaseIndex = agentPhases.indexOf(phase);
  const activeNodes = simulation.nodes.filter((node) => traceStep.nodeIds.includes(node.id));

  return (
    <div className="agent-map__mobile">
      <div className="agent-mini-map" aria-label="Architecture orientation map">
        {agentPhases.map((candidate, index) => (
          <span
            className={candidate === phase ? "is-active" : index < activePhaseIndex ? "is-complete" : ""}
            key={candidate}
          >
            {candidate}
          </span>
        ))}
      </div>

      {phase !== "overview" && (
        <section className="agent-mobile-current" aria-labelledby="agent-mobile-current-heading">
          <header><small>Current flow</small><h3 id="agent-mobile-current-heading">Components active now</h3></header>
          <div className="agent-mobile-focus">
            {activeNodes.map((node) => (
              <button
                aria-haspopup="dialog"
                aria-label={`Learn about ${node.label}`}
                data-accent={node.accent}
                data-state={getNodeState(node, traceStep)}
                key={node.id}
                onClick={() => onOpenDetail({ kind: "node", nodeId: node.id })}
                type="button"
              >
                <AgentNodeIcon kind={node.kind} />
                <span>
                  <small>{node.zone}</small><strong>{node.label}</strong><p>{node.description}</p>
                  <em>
                    {traceStep.state === "failed"
                      ? "Failed · no result returned"
                      : traceStep.state === "retry"
                        ? "Retry · new bounded call"
                        : traceStep.state === "recovered"
                          ? "Recovered · evidence returned"
                        : "Learn about this component"}
                  </em>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="agent-mobile-browser" aria-labelledby="agent-mobile-browser-heading">
        <header><small>Architecture browser</small><h3 id="agent-mobile-browser-heading">Explore every layer</h3></header>
        <div className="agent-mobile-zones">
          {architectureZones.map((zone) => {
            const count = simulation.nodes.filter((node) => node.zone === zone).length;
            return (
              <button
                aria-haspopup="dialog"
                aria-label={`Learn about ${architectureZoneLearning[zone].label}`}
                key={zone}
                onClick={() => onOpenDetail({ kind: "zone", zone })}
                type="button"
              >
                <GitBranch aria-hidden="true" />
                <span><small>{count} components</small><strong>{architectureZoneLearning[zone].label}</strong></span>
                <Info aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function AgentArchitectureMap(props: AgentArchitectureMapProps): React.JSX.Element {
  const traceState = props.traceStep.state ?? "progress";

  return (
    <section
      aria-label="Agent architecture map"
      className="agent-map"
      data-phase={props.phase}
      data-trace-state={traceState}
    >
      <header className="agent-map__trace" aria-live="polite" data-state={traceState}>
        <span><small>Flow</small>{props.traceStep.number}</span>
        <div><small>Current flow</small><strong>{props.traceStep.label}</strong></div>
        <p><small>Carries</small><strong>{props.traceStep.packet}</strong></p>
        <div className="agent-map__trace-guide">
          {traceState === "failed" ? (
            <CircleX aria-hidden="true" />
          ) : traceState === "retry" ? (
            <RotateCcw aria-hidden="true" />
          ) : traceState === "recovered" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <Info aria-hidden="true" />
          )}
          <span>
            {traceState === "failed"
              ? "Failed observation. Nothing continues as a result."
              : traceState === "retry"
                ? "New attempt. The failed call remains separate."
                : traceState === "recovered"
                  ? "Attempt 2 succeeded. Evidence can now advance."
                  : props.traceStep.eventKind === "run-broad-log-query"
                    ? "Attempt 1 is still running. No result exists yet."
                    : "Select any component or layer to learn how it works."}
          </span>
        </div>
      </header>
      {props.phase === "recover" && (
        <RecoveryAttemptLedger traceStep={props.traceStep} />
      )}
      <div className="agent-harness" data-trace-state={traceState}>
        <HarnessHeader onOpenDetail={props.onOpenDetail} simulation={props.simulation} traceStep={props.traceStep} />
        <LoopRail onOpenDetail={props.onOpenDetail} simulation={props.simulation} traceStep={props.traceStep} />
        <DesktopArchitectureMap onOpenDetail={props.onOpenDetail} simulation={props.simulation} traceStep={props.traceStep} />
        <MobileArchitectureMap {...props} />
      </div>
      <div className="agent-map__legend" aria-label="Architecture flow legend">
        <span><i data-flow="request" />Request / task</span>
        <span><i data-flow="context" />Context / memory</span>
        <span><i data-flow="handoff" />Agent handoff</span>
        <span><i data-flow="tool" />Tool call</span>
        <span><i data-flow="failed" />Failed call</span>
        <span><i data-flow="retry" />New retry</span>
        <span><i data-flow="recovered" />Recovered result</span>
        <span><LockKeyhole aria-hidden="true" />Approval-gated write</span>
      </div>
    </section>
  );
}
