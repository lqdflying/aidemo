import type {
  AgentEngineeringConcept,
  AgentLoopPass,
  ArchitectureLearningDetail,
  ArchitectureZone,
  ArchitectureZoneLearningDetail,
} from "./agent-types";

export interface AgentEngineeringConceptLearningDetail
  extends ArchitectureLearningDetail {
  readonly label: string;
  readonly summary: string;
  readonly relationship: string;
}

export const agentLoopPassLabels: Readonly<Record<AgentLoopPass, string>> = {
  "system-framing": "System framing",
  "investigation-1": "Investigation pass 1",
  "investigation-2": "Investigation pass 2",
  remediation: "Remediation pass",
};

export const agentEngineeringConceptLearning: Readonly<
  Record<AgentEngineeringConcept, AgentEngineeringConceptLearningDetail>
> = {
  harness: {
    label: "Harness Engineering",
    summary: "The legible, enforceable environment that turns model capability into dependable agent work.",
    purpose: "Define the agent's intent, context, state, tools, permissions, execution boundaries, traces, and quality checks outside the model.",
    stateAndAuthority: "The harness owns workflow state and enforcement. Models propose decisions inside the context and authority supplied for one call.",
    designRationale: "Reliability improves when instructions, interfaces, policies, and feedback are inspectable system artifacts instead of assumptions hidden in prompts.",
    risk: "An underspecified harness can give a capable model stale context, broad tools, weak stop rules, or no reliable way to verify its work.",
    relationship: "The harness defines the environment and constraints; the engineered loop repeatedly uses that environment until it reaches a verified exit.",
  },
  loop: {
    label: "Loop Engineering",
    summary: "The explicit observe, decide, act, evaluate, and adapt-or-exit cycle that drives the run toward a verified outcome.",
    purpose: "Control what happens on each pass, which evidence advances state, when a retry is allowed, and when the run completes, waits, or escalates.",
    stateAndAuthority: "The coordinator owns the loop state. A model can recommend the next step, but policy and observed results decide whether the loop advances.",
    designRationale: "A designed loop makes convergence, retry budgets, human gates, and completion criteria visible instead of allowing accidental endless autonomy.",
    risk: "A loop without bounded retries, independent evaluation, or exit conditions can repeat bad actions, hide failure, and consume resources without converging.",
    relationship: "The loop is the run protocol inside the harness; it cannot safely operate without the harness's context, tools, permissions, state, and evaluators.",
  },
};

export const architectureZones: readonly ArchitectureZone[] = [
  "entry",
  "runtime",
  "context",
  "models",
  "agents",
  "tools",
  "governance",
];

export const architectureZoneLearning: Readonly<
  Record<ArchitectureZone, ArchitectureZoneLearningDetail>
> = {
  entry: {
    label: "Entry channel",
    summary: "Where operational signals become bounded requests for the agent runtime.",
    purpose: "Receive incident signals and return verified operator-facing status without owning orchestration.",
    stateAndAuthority: "The channel transports messages; validation, workflow state, and production authority live elsewhere.",
    designRationale: "A clean entry boundary makes external input, identity, and delivery behavior independently governable.",
    risk: "Untrusted or noisy input can select the wrong workflow before the runtime has enough context.",
  },
  runtime: {
    label: "Agent runtime",
    summary: "The controlled loop that admits, routes, coordinates, and completes work.",
    purpose: "Own workflow progress, authorization, retries, dependency state, and the final return contract.",
    stateAndAuthority: "The gateway and coordinator own runtime state; models advise but do not remember or authorize.",
    designRationale: "This demo combines a Router for workflow selection with a DAG for parallel, dependency-aware execution.",
    risk: "An unbounded or overly privileged runtime can spread one bad decision across every connected system.",
  },
  context: {
    label: "Context plane",
    summary: "Explicit working state, persistent memory, skills, and context-budget management.",
    purpose: "Assemble only the facts and procedures needed for the current model or specialist call.",
    stateAndAuthority: "Session and persistent state are gateway-owned and governed outside stateless model endpoints.",
    designRationale: "Externalized context makes retention, provenance, compaction, and recovery visible and testable.",
    risk: "Stale memory, missing provenance, or destructive compaction can quietly change the meaning of a task.",
  },
  models: {
    label: "Stateless models",
    summary: "Remote and local reasoning endpoints selected according to task and data boundary.",
    purpose: "Transform approved context into plans, summaries, structured observations, or tool intents.",
    stateAndAuthority: "Each call is stateless; models own neither session memory nor permission to use a tool.",
    designRationale: "Model placement follows privacy and capability needs without changing the surrounding control plane.",
    risk: "Treating a model as a trusted database or policy engine hides state and weakens authorization.",
  },
  agents: {
    label: "Specialist graph",
    summary: "Bounded workers arranged as a dependency graph instead of an unstructured swarm.",
    purpose: "Run metrics, logs, and knowledge work in parallel, then unlock remediation after their evidence arrives.",
    stateAndAuthority: "Each specialist owns task-local working memory and only its assigned skills and tools.",
    designRationale: "The DAG preserves completed work, exposes dependencies, and allows one failed branch to retry independently.",
    risk: "Unclear ownership or handoff schemas can duplicate work and make evidence impossible to reconcile.",
  },
  tools: {
    label: "MCP + RAG tools",
    summary: "Typed boundaries between agents and operational data or actions.",
    purpose: "Expose approved metrics, logs, knowledge retrieval, and production-control capabilities.",
    stateAndAuthority: "Read servers use scoped tokens; Cloud Control remains write-gated by exact human-approved actions.",
    designRationale: "MCP makes tool names, inputs, outputs, provenance, and authorization inspectable at every call.",
    risk: "Broad scopes, weak argument validation, or missing provenance can turn a useful tool into a control-plane hazard.",
  },
  governance: {
    label: "Governance + outcome",
    summary: "Quality, human authority, execution boundaries, and measured recovery.",
    purpose: "Verify the recommendation, obtain authority, constrain writes, and confirm the service actually recovered.",
    stateAndAuthority: "Quality gates may reject output; only the human approves writes; only verified outcomes reach memory.",
    designRationale: "Separating proposal, approval, execution, and verification prevents implied authority and false success.",
    risk: "Loose approval scopes or incomplete recovery checks can make a technically successful action operationally unsafe.",
  },
};
