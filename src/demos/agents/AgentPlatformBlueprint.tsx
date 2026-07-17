import {
  Activity,
  AppWindow,
  Archive,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  Braces,
  BrainCircuit,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  Flame,
  GitBranch,
  Globe2,
  KeyRound,
  Layers3,
  ListTodo,
  MessageSquare,
  Network,
  RefreshCw,
  Route,
  Search,
  Send,
  ServerCog,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Waypoints,
  Workflow,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";
import type { CSSProperties } from "react";

import { AgentOpenSourceRecommendations } from "./AgentOpenSourceRecommendations";
import type { AgentOpenSourceRecommendation } from "./agent-open-source";
import type {
  AgentBlueprintArtifact,
  AgentBlueprintIconName,
  AgentBlueprintMotion,
  AgentBlueprintNode,
  AgentBlueprintTone,
  AgentControlLoopBlueprint,
  AgentDecisionGateBlueprint,
  AgentFanOutBlueprint,
  AgentLinearBlueprint,
  AgentPlatformDetailSpec,
  AgentRoutingMatrixBlueprint,
  AgentStateMachineBlueprint,
  AgentTopologyBlueprint,
  AgentTraceTreeBlueprint,
} from "./agent-platform-details";

interface AgentPlatformBlueprintProps {
  readonly recommendation: AgentOpenSourceRecommendation;
  readonly spec: AgentPlatformDetailSpec;
}

interface BlueprintSequenceStyle extends CSSProperties {
  readonly "--agent-blueprint-index": number;
}

const blueprintIcons: Readonly<Record<AgentBlueprintIconName, LucideIcon>> = {
  action: Sparkles,
  app: AppWindow,
  approval: UserCheck,
  archive: Archive,
  check: CheckCircle2,
  clock: Clock3,
  context: Layers3,
  contract: Braces,
  database: Database,
  event: Waypoints,
  file: FileText,
  gateway: KeyRound,
  globe: Globe2,
  memory: BookOpenCheck,
  message: MessageSquare,
  model: BrainCircuit,
  network: Network,
  policy: ShieldCheck,
  queue: ListTodo,
  route: Route,
  runtime: Workflow,
  search: Search,
  send: Send,
  server: ServerCog,
  skill: BadgeCheck,
  tool: Wrench,
  trace: Activity,
  worker: Bot,
};

const artifactIcons: Readonly<Record<AgentBlueprintArtifact["kind"], LucideIcon>> = {
  contract: Braces,
  control: ShieldCheck,
  decision: GitBranch,
  failure: Flame,
  state: Database,
};

const toneLabels: Readonly<Record<AgentBlueprintTone, string>> = {
  neutral: "Platform element",
  request: "Request / input",
  response: "Verified return",
  control: "Control plane",
  evidence: "Evidence / state",
  warning: "Privileged boundary",
  danger: "Failure / stop",
};

function BlueprintNodeCard({
  index = 0,
  node,
  size = "regular",
}: {
  readonly index?: number;
  readonly node: AgentBlueprintNode;
  readonly size?: "compact" | "regular";
}): React.JSX.Element {
  const Icon = blueprintIcons[node.icon];
  const style: BlueprintSequenceStyle = { "--agent-blueprint-index": index };

  return (
    <article
      className="agent-blueprint-node"
      data-node-id={node.id}
      data-size={size}
      data-tone={node.tone}
      style={style}
    >
      <span aria-hidden="true" className="agent-blueprint-node__icon">
        <Icon />
      </span>
      <div>
        {node.meta && <small>{node.meta}</small>}
        <strong>{node.label}</strong>
        <p>{node.detail}</p>
      </div>
    </article>
  );
}

function FlowConnector({
  index = 0,
  motion,
}: {
  readonly index?: number;
  readonly motion: AgentBlueprintMotion;
}): React.JSX.Element {
  const bidirectional = motion === "bidirectional";
  const style: BlueprintSequenceStyle = { "--agent-blueprint-index": index };
  return (
    <span
      aria-hidden="true"
      className="agent-blueprint-connector"
      data-bidirectional={bidirectional || undefined}
      style={style}
    >
      <span data-track="request">
        <i data-packet="request" />
        <ArrowRight />
      </span>
      {bidirectional && (
        <span data-track="response">
          <i data-packet="response" />
          <ArrowLeft />
        </span>
      )}
    </span>
  );
}

function BlueprintFlowRail({
  motion,
  nodes,
  size = "regular",
}: {
  readonly motion: AgentBlueprintMotion;
  readonly nodes: readonly AgentBlueprintNode[];
  readonly size?: "compact" | "regular";
}): React.JSX.Element {
  return (
    <div className="agent-blueprint-flow-rail" data-motion={motion}>
      {nodes.map((item, index) => (
        <Fragment key={item.id}>
          <BlueprintNodeCard index={index} node={item} size={size} />
          {index < nodes.length - 1 && <FlowConnector index={index} motion={motion} />}
        </Fragment>
      ))}
    </div>
  );
}

function LinearDiagram({ spec }: { readonly spec: AgentLinearBlueprint }): React.JSX.Element {
  return (
    <div className="agent-blueprint-linear" data-flow-kind={spec.kind}>
      <BlueprintFlowRail motion={spec.motion} nodes={spec.stages} />
      {spec.returnLabel && (
        <div className="agent-blueprint-return" data-tone="response">
          <ArrowLeftRight aria-hidden="true" />
          <span><strong>Return path</strong>{spec.returnLabel}</span>
        </div>
      )}
      {spec.failure && (
        <div className="agent-blueprint-failure" role="note">
          <Flame aria-hidden="true" />
          <span><strong>{spec.failure.label}</strong>{spec.failure.detail}</span>
        </div>
      )}
    </div>
  );
}

function TopologyDiagram({ spec }: { readonly spec: AgentTopologyBlueprint }): React.JSX.Element {
  return (
    <div className="agent-blueprint-topology">
      <div className="agent-blueprint-topology__columns">
        {spec.columns.map((column, columnIndex) => (
          <Fragment key={column.label}>
            <section aria-label={column.label} className="agent-blueprint-topology__column">
              <h3>{column.label}</h3>
              <div>
                {column.nodes.map((item, nodeIndex) => (
                  <BlueprintNodeCard
                    index={columnIndex + nodeIndex}
                    key={item.id}
                    node={item}
                    size="compact"
                  />
                ))}
              </div>
            </section>
            {columnIndex < spec.columns.length - 1 && <FlowConnector index={columnIndex} motion={spec.motion} />}
          </Fragment>
        ))}
      </div>
      {spec.inset && (
        <section aria-label={spec.inset.label} className="agent-blueprint-topology__inset">
          <h3>{spec.inset.label}</h3>
          <BlueprintFlowRail motion="forward" nodes={spec.inset.stages} size="compact" />
        </section>
      )}
      {spec.rails && (
        <ul aria-label="Cross-cutting controls" className="agent-blueprint-rails">
          {spec.rails.map((rail) => <li key={rail}><ShieldCheck aria-hidden="true" />{rail}</li>)}
        </ul>
      )}
    </div>
  );
}

function StateMachineDiagram({
  spec,
}: {
  readonly spec: AgentStateMachineBlueprint;
}): React.JSX.Element {
  return (
    <div className="agent-blueprint-state-machine">
      <BlueprintFlowRail motion={spec.motion} nodes={spec.states} />
      <section aria-label="Alternate terminal states" className="agent-blueprint-state-machine__branches">
        <div className="agent-blueprint-branch-label"><GitBranch aria-hidden="true" />Alternate states</div>
        <div>
          {spec.branches.map((item, index) => (
            <BlueprintNodeCard index={spec.states.length + index} key={item.id} node={item} size="compact" />
          ))}
        </div>
      </section>
    </div>
  );
}

function ControlLoopDiagram({
  spec,
}: {
  readonly spec: AgentControlLoopBlueprint;
}): React.JSX.Element {
  return (
    <div className="agent-blueprint-loop">
      <div className="agent-blueprint-loop__stages">
        {spec.stages.map((item, index) => (
          <Fragment key={item.id}>
            <BlueprintNodeCard index={index} node={item} />
            {index < spec.stages.length - 1 && <FlowConnector index={index} motion="forward" />}
          </Fragment>
        ))}
      </div>
      <div aria-label="Loop back to Observe" className="agent-blueprint-loop__return">
        <RefreshCw aria-hidden="true" />
        <span><strong>Evaluate → Observe</strong>Update state, then begin the next bounded pass.</span>
        <i aria-hidden="true" />
      </div>
      <div className="agent-blueprint-loop__foundation">
        <BlueprintNodeCard node={spec.state} size="compact" />
        <span aria-hidden="true"><ArrowRight /></span>
        <BlueprintNodeCard node={spec.exit} size="compact" />
      </div>
    </div>
  );
}

function RoutingMatrixDiagram({
  spec,
}: {
  readonly spec: AgentRoutingMatrixBlueprint;
}): React.JSX.Element {
  return (
    <div className="agent-blueprint-routing">
      <section aria-label="Routing input"><h3>Typed input</h3><BlueprintNodeCard node={spec.source} /></section>
      <FlowConnector index={0} motion="forward" />
      <section aria-label="Routing criteria" className="agent-blueprint-routing__criteria">
        <h3>Executable routing policy</h3>
        <ul>{spec.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
      </section>
      <FlowConnector index={1} motion="forward" />
      <section aria-label="Routing targets" className="agent-blueprint-routing__targets">
        <h3>Eligible targets</h3>
        <div>{spec.targets.map((item, index) => <BlueprintNodeCard index={index} key={item.id} node={item} size="compact" />)}</div>
      </section>
      <p className="agent-blueprint-routing__fallback"><Route aria-hidden="true" /><span><strong>Fallback invariant</strong>{spec.fallback}</span></p>
    </div>
  );
}

function FanOutDiagram({ spec }: { readonly spec: AgentFanOutBlueprint }): React.JSX.Element {
  return (
    <div className="agent-blueprint-fan-out">
      <section aria-label="Fan-out origin"><h3>Owned origin</h3><BlueprintNodeCard node={spec.origin} /></section>
      <div aria-hidden="true" className="agent-blueprint-fan-out__split"><i /><GitBranch /></div>
      <section aria-label="Concurrent branches" className="agent-blueprint-fan-out__branches">
        <h3>Independent bounded branches</h3>
        <div>{spec.branches.map((item, index) => <BlueprintNodeCard index={index} key={item.id} node={item} />)}</div>
      </section>
      {spec.join && (
        <>
          <div aria-hidden="true" className="agent-blueprint-fan-out__join"><i /><ArrowRight /></div>
          <section aria-label="Fan-out join"><h3>Owned join</h3><BlueprintNodeCard node={spec.join} /></section>
        </>
      )}
    </div>
  );
}

function DecisionGateDiagram({
  spec,
}: {
  readonly spec: AgentDecisionGateBlueprint;
}): React.JSX.Element {
  return (
    <div className="agent-blueprint-decision">
      <section aria-label="Decision inputs" className="agent-blueprint-decision__inputs">
        <h3>Decision-ready inputs</h3>
        <div>{spec.checkpoints.map((item, index) => <BlueprintNodeCard index={index} key={item.id} node={item} size="compact" />)}</div>
      </section>
      <FlowConnector index={0} motion="forward" />
      <section aria-label="Decision gate" className="agent-blueprint-decision__gate">
        <h3>Control boundary</h3>
        <BlueprintNodeCard node={spec.gate} />
      </section>
      <FlowConnector index={1} motion="forward" />
      <section aria-label="Decision outcomes" className="agent-blueprint-decision__outcomes">
        <h3>Explicit outcomes</h3>
        <div>{spec.outcomes.map((item, index) => <BlueprintNodeCard index={index} key={item.id} node={item} size="compact" />)}</div>
      </section>
    </div>
  );
}

function TraceTreeDiagram({ spec }: { readonly spec: AgentTraceTreeBlueprint }): React.JSX.Element {
  return (
    <div className="agent-blueprint-trace-tree">
      <section aria-label="Trace root" className="agent-blueprint-trace-tree__root">
        <BlueprintNodeCard node={spec.root} />
      </section>
      <div aria-hidden="true" className="agent-blueprint-trace-tree__trunk"><i /></div>
      <section aria-label="Trace branches" className="agent-blueprint-trace-tree__branches">
        {spec.branches.map((branch, index) => (
          <article key={branch.node.id}>
            <BlueprintNodeCard index={index} node={branch.node} size="compact" />
            <div aria-hidden="true" className="agent-blueprint-trace-tree__stem" />
            <div>{branch.children.map((child) => <BlueprintNodeCard key={child.id} node={child} size="compact" />)}</div>
          </article>
        ))}
      </section>
    </div>
  );
}

function BlueprintStage({
  spec,
}: {
  readonly spec: AgentPlatformDetailSpec;
}): React.JSX.Element {
  switch (spec.kind) {
    case "pipeline":
    case "sequence":
    case "lifecycle":
    case "contract-boundary":
      return <LinearDiagram spec={spec} />;
    case "source-map":
      return <TopologyDiagram spec={spec} />;
    case "state-machine":
      return <StateMachineDiagram spec={spec} />;
    case "control-loop":
      return <ControlLoopDiagram spec={spec} />;
    case "routing-matrix":
      return <RoutingMatrixDiagram spec={spec} />;
    case "fan-out":
      return <FanOutDiagram spec={spec} />;
    case "decision-gate":
      return <DecisionGateDiagram spec={spec} />;
    case "trace-tree":
      return <TraceTreeDiagram spec={spec} />;
  }
}

function getBlueprintNodes(spec: AgentPlatformDetailSpec): readonly AgentBlueprintNode[] {
  switch (spec.kind) {
    case "pipeline":
    case "sequence":
    case "lifecycle":
    case "contract-boundary":
      return [...spec.stages, ...(spec.failure ? [spec.failure] : [])];
    case "source-map":
      return [
        ...spec.columns.flatMap((column) => column.nodes),
        ...(spec.inset?.stages ?? []),
      ];
    case "state-machine":
      return [...spec.states, ...spec.branches];
    case "control-loop":
      return [...spec.stages, spec.state, spec.exit];
    case "routing-matrix":
      return [spec.source, ...spec.targets];
    case "fan-out":
      return [spec.origin, ...spec.branches, ...(spec.join ? [spec.join] : [])];
    case "decision-gate":
      return [...spec.checkpoints, spec.gate, ...spec.outcomes];
    case "trace-tree":
      return [spec.root, ...spec.branches.flatMap((branch) => [branch.node, ...branch.children])];
  }
}

function BlueprintLegend({
  spec,
}: {
  readonly spec: AgentPlatformDetailSpec;
}): React.JSX.Element {
  const tones = [...new Set(getBlueprintNodes(spec).map((item) => item.tone))]
    .filter((tone) => tone !== "neutral");
  return (
    <ul aria-label="Blueprint legend" className="agent-blueprint-legend">
      {tones.map((tone) => <li data-tone={tone} key={tone}><i aria-hidden="true" />{toneLabels[tone]}</li>)}
    </ul>
  );
}

function BlueprintArtifacts({
  artifacts,
}: {
  readonly artifacts: readonly AgentBlueprintArtifact[];
}): React.JSX.Element {
  return (
    <section aria-label="Engineering implementation notes" className="agent-blueprint-artifacts">
      {artifacts.map((item) => {
        const Icon = artifactIcons[item.kind];
        return (
          <article data-artifact-kind={item.kind} key={`${item.eyebrow}:${item.title}`}>
            <Icon aria-hidden="true" />
            <div>
              <small>{item.eyebrow}</small>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.items && <ul>{item.items.map((entry) => <li key={entry}>{entry}</li>)}</ul>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function AgentPlatformBlueprint({
  recommendation,
  spec,
}: AgentPlatformBlueprintProps): React.JSX.Element {
  const [replayCount, setReplayCount] = useState(0);
  const hasMotion = spec.motion !== "none";

  return (
    <div className="agent-platform-detail">
      <figure
        aria-label={`${spec.title} platform blueprint`}
        className="agent-platform-blueprint"
        data-blueprint-kind={spec.kind}
        data-blueprint-motion={spec.motion}
      >
        <div className="agent-platform-blueprint__toolbar">
          <BlueprintLegend spec={spec} />
          {hasMotion && (
            <button
              className="agent-platform-blueprint__replay"
              onClick={() => setReplayCount((currentCount) => currentCount + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" />
              Replay flow
            </button>
          )}
        </div>
        <div
          className="agent-platform-blueprint__stage"
          data-motion={spec.motion}
          data-replay={replayCount}
          key={`${spec.title}:${replayCount}`}
        >
          <BlueprintStage spec={spec} />
        </div>
        <figcaption><CircleGauge aria-hidden="true" /><span>{spec.caption}</span></figcaption>
      </figure>
      <BlueprintArtifacts artifacts={spec.artifacts} />
      <AgentOpenSourceRecommendations recommendation={recommendation} />
    </div>
  );
}
