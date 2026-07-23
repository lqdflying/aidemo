import type {
  AgentArchitectureModel,
  AgentComponent,
  AgentComponentGroup,
  AgentConcept,
  AgentContractLeg,
  AgentControlCycle,
  AgentLessonStep,
  AgentRelationship,
  AgentRelationshipId,
  AgentRuntimeResult,
} from "./agent-types";

const groups: readonly AgentComponentGroup[] = [
  {
    id: "entry",
    label: "Input & channels",
    shortLabel: "Input",
    summary: "People, applications, and events that ask the agent system to do work.",
    accent: "input",
    componentIds: ["user-application", "event-message"],
  },
  {
    id: "runtime",
    label: "Orchestrator",
    shortLabel: "Orchestrator",
    summary: "The orchestration layer that admits requests, coordinates agent work, and owns run lifecycle. Also known as the agent runtime.",
    accent: "generation",
    componentIds: ["input-gateway", "coordinator", "task-scheduler"],
  },
  {
    id: "context",
    label: "Context & memory",
    shortLabel: "Context",
    summary: "Explicit working context, retained memory, instructions, and context management.",
    accent: "evidence",
    componentIds: [
      "working-context",
      "long-term-memory",
      "skills-instructions",
      "context-manager",
    ],
  },
  {
    id: "models",
    label: "Models",
    shortLabel: "Models",
    summary: "Stateless reasoning endpoints selected for capability, cost, latency, and data boundaries.",
    accent: "generation",
    componentIds: ["general-model", "private-model"],
  },
  {
    id: "agents",
    label: "Agents & workers",
    shortLabel: "Agents",
    summary: "Multiple bounded workers that handle separate tasks and return typed results.",
    accent: "generation",
    componentIds: ["worker-a", "worker-b", "worker-c"],
  },
  {
    id: "tools",
    label: "Tools & knowledge",
    shortLabel: "Tools",
    summary: "Typed boundaries to functions, retrieval, data, and write-capable actions.",
    accent: "retrieval",
    componentIds: ["function-tool", "retrieval-tool", "data-source", "action-tool"],
  },
  {
    id: "governance",
    label: "Governance",
    shortLabel: "Governance",
    summary: "Policy, evaluation, and human authority that constrain what may advance.",
    accent: "input",
    componentIds: ["policy-guard", "output-evaluator", "human-approval"],
  },
  {
    id: "outcome",
    label: "Outcome & return",
    shortLabel: "Outcome",
    summary: "A verified result distributed to the requester, memory, and observability.",
    accent: "evidence",
    componentIds: ["response-publisher", "memory-writer", "trace-telemetry"],
  },
];

const components: readonly AgentComponent[] = [
  {
    id: "user-application",
    groupId: "entry",
    label: "User or application",
    shortLabel: "User / app",
    kind: "user",
    accent: "input",
  },
  {
    id: "event-message",
    groupId: "entry",
    label: "Event or message",
    shortLabel: "Event / message",
    kind: "event",
    accent: "input",
  },
  {
    id: "input-gateway",
    groupId: "runtime",
    label: "Input gateway",
    shortLabel: "Gateway",
    kind: "gateway",
    accent: "retrieval",
  },
  {
    id: "coordinator",
    groupId: "runtime",
    label: "Coordinator",
    shortLabel: "Coordinator",
    kind: "coordinator",
    accent: "generation",
  },
  {
    id: "task-scheduler",
    groupId: "runtime",
    label: "Task scheduler",
    shortLabel: "Scheduler",
    kind: "scheduler",
    accent: "generation",
  },
  {
    id: "working-context",
    groupId: "context",
    label: "Working context",
    shortLabel: "Working context",
    kind: "context",
    accent: "evidence",
  },
  {
    id: "long-term-memory",
    groupId: "context",
    label: "Long-term memory",
    shortLabel: "Long-term memory",
    kind: "memory",
    accent: "evidence",
  },
  {
    id: "skills-instructions",
    groupId: "context",
    label: "Skills & instructions",
    shortLabel: "Skills",
    kind: "skills",
    accent: "generation",
  },
  {
    id: "context-manager",
    groupId: "context",
    label: "Context manager",
    shortLabel: "Context manager",
    kind: "context-manager",
    accent: "evidence",
  },
  {
    id: "general-model",
    groupId: "models",
    label: "General model",
    shortLabel: "General model",
    kind: "model",
    accent: "generation",
  },
  {
    id: "private-model",
    groupId: "models",
    label: "Private or specialized model",
    shortLabel: "Private model",
    kind: "model",
    accent: "generation",
  },
  ...(["worker-a", "worker-b", "worker-c"] as const).map((id, index): AgentComponent => ({
    id,
    groupId: "agents",
    label: `Specialist worker ${String.fromCharCode(65 + index)}`,
    shortLabel: `Worker ${String.fromCharCode(65 + index)}`,
    kind: "worker",
    accent: index === 1 ? "retrieval" : "generation",
  })),
  {
    id: "function-tool",
    groupId: "tools",
    label: "Function or API tool",
    shortLabel: "Function / API",
    kind: "function-tool",
    accent: "retrieval",
  },
  {
    id: "retrieval-tool",
    groupId: "tools",
    label: "Retrieval tool",
    shortLabel: "Retrieval",
    kind: "retrieval",
    accent: "evidence",
  },
  {
    id: "data-source",
    groupId: "tools",
    label: "Data source",
    shortLabel: "Data source",
    kind: "data",
    accent: "evidence",
  },
  {
    id: "action-tool",
    groupId: "tools",
    label: "Action tool",
    shortLabel: "Action tool",
    kind: "action",
    accent: "input",
  },
  {
    id: "policy-guard",
    groupId: "governance",
    label: "Policy guard",
    shortLabel: "Policy guard",
    kind: "policy",
    accent: "input",
  },
  {
    id: "output-evaluator",
    groupId: "governance",
    label: "Output evaluator",
    shortLabel: "Evaluator",
    kind: "evaluator",
    accent: "evidence",
  },
  {
    id: "human-approval",
    groupId: "governance",
    label: "Human approval",
    shortLabel: "Human approval",
    kind: "approval",
    accent: "input",
  },
  {
    id: "response-publisher",
    groupId: "outcome",
    label: "Response publisher",
    shortLabel: "Response",
    kind: "publisher",
    accent: "evidence",
  },
  {
    id: "memory-writer",
    groupId: "outcome",
    label: "Verified memory writer",
    shortLabel: "Memory write",
    kind: "memory",
    accent: "evidence",
  },
  {
    id: "trace-telemetry",
    groupId: "outcome",
    label: "Trace & telemetry",
    shortLabel: "Trace / telemetry",
    kind: "telemetry",
    accent: "retrieval",
  },
];

const relationships: readonly AgentRelationship[] = [
  { id: "entry-to-runtime", sourceGroupId: "entry", targetGroupId: "runtime", label: "bounded request", forwardTone: "request", interaction: "handoff" },
  { id: "runtime-to-context", sourceGroupId: "runtime", targetGroupId: "context", label: "working-state update", forwardTone: "request", returnLabel: "approved context", returnTone: "response", interaction: "exchange", loopKind: "state-feedback" },
  { id: "runtime-to-models", sourceGroupId: "runtime", targetGroupId: "models", label: "prompt + context", forwardTone: "request", returnLabel: "response or tool intent", returnTone: "response", interaction: "exchange", loopKind: "request-response" },
  { id: "runtime-to-agents", sourceGroupId: "runtime", targetGroupId: "agents", label: "bounded tasks", forwardTone: "request", returnLabel: "typed worker results", returnTone: "response", interaction: "exchange", loopKind: "request-response" },
  { id: "agents-to-tools", sourceGroupId: "agents", targetGroupId: "tools", label: "validated tool call", forwardTone: "request", returnLabel: "result or explicit error", returnTone: "response", interaction: "exchange", loopKind: "request-response" },
  { id: "agents-to-governance", sourceGroupId: "agents", targetGroupId: "governance", label: "result or proposed action", forwardTone: "request", interaction: "handoff" },
  { id: "governance-to-runtime", sourceGroupId: "governance", targetGroupId: "runtime", label: "decision or revision constraints", forwardTone: "response", interaction: "handoff" },
  { id: "governance-to-tools", sourceGroupId: "governance", targetGroupId: "tools", label: "scoped authority", forwardTone: "request", interaction: "handoff" },
  { id: "governance-to-outcome", sourceGroupId: "governance", targetGroupId: "outcome", label: "verified no-action decision", forwardTone: "response", interaction: "handoff" },
  { id: "tools-to-outcome", sourceGroupId: "tools", targetGroupId: "outcome", label: "tool result or action receipt", forwardTone: "response", interaction: "handoff" },
  { id: "outcome-to-context", sourceGroupId: "outcome", targetGroupId: "context", label: "verified memory write", forwardTone: "response", interaction: "handoff" },
  { id: "outcome-to-entry", sourceGroupId: "outcome", targetGroupId: "entry", label: "verified response", forwardTone: "response", interaction: "handoff" },
];

function leg(
  relationshipId: AgentRelationshipId,
  direction: AgentContractLeg["direction"] = "forward",
): AgentContractLeg {
  return { relationshipId, direction };
}

const cycles: readonly AgentControlCycle[] = [
  {
    id: "governance-revision-cycle",
    label: "Governance revision cycle",
    loopKind: "control-verification",
    legs: [
      leg("agents-to-governance"),
      leg("governance-to-runtime"),
      leg("runtime-to-agents"),
    ],
  },
];

const concepts: readonly AgentConcept[] = [
  {
    id: "harness",
    label: "Agent harness",
    summary: "The application code that surrounds model calls with state, tools, policy, evaluation, and observability.",
    takeaways: {
      engineeringPrinciple: "The harness is the production system; a model is one replaceable component inside it.",
      failureMode: "Weak harness controls can make a capable model unsafe or make failures impossible to reproduce.",
    },
  },
  {
    id: "run-loop",
    label: "Agent run loop",
    summary: "Observe state, decide the next step, act, evaluate the result, then adapt or exit.",
    takeaways: {
      engineeringPrinciple: "A production loop needs explicit completion criteria, retry budgets, and wait or escalation states.",
      failureMode: "Missing exit rules can repeat work indefinitely or accept an unverified result.",
    },
  },
  {
    id: "typed-contracts",
    label: "Typed contracts",
    summary: "Every boundary names what moves forward, what may return, and which component owns the result.",
    takeaways: {
      engineeringPrinciple: "Typed contracts allow models, workers, and tools to change independently while tests preserve system behavior.",
      failureMode: "Implicit contracts hide failed calls and make ownership ambiguous.",
    },
  },
];

const allComponentIds = components.map(({ id }) => id);

const trace: readonly AgentLessonStep[] = [
  { number: 1, eventKind: "map-components", label: "Map the system groups", summary: "Eight stable groups show what exists before any flow is animated.", topology: "system", patternLabel: "Stable system map", activeComponentIds: allComponentIds, contractLegs: [], state: "active", focusTarget: { kind: "group", groupId: "runtime" } },
  { number: 2, eventKind: "show-harness", label: "Locate the agent harness", summary: "The harness surrounds models with runtime state, tools, policy, evaluation, and delivery.", topology: "system", patternLabel: "Responsibility boundary", activeComponentIds: ["input-gateway", "coordinator", "working-context", "general-model", "worker-a", "function-tool", "policy-guard", "response-publisher"], contractLegs: [], state: "active", focusTarget: { kind: "concept", conceptId: "harness" } },
  { number: 3, eventKind: "accept-input", label: "Admit a bounded request", summary: "Input crosses one controlled boundary before orchestration begins.", topology: "sequence", patternLabel: "One-way sequence", activeComponentIds: ["user-application", "event-message", "input-gateway", "coordinator"], contractLegs: [leg("entry-to-runtime")], state: "active" },
  { number: 4, eventKind: "assemble-context", label: "Read and update explicit state", summary: "Runtime and context exchange approved working state; the model stores nothing.", topology: "pair-loop", patternLabel: "State feedback loop", activeComponentIds: ["coordinator", "working-context", "long-term-memory", "skills-instructions", "context-manager"], contractLegs: [leg("runtime-to-context"), leg("runtime-to-context", "return")], state: "active" },
  { number: 5, eventKind: "call-model", label: "Call a stateless model", summary: "The runtime sends context for one call and receives a response or tool intent.", topology: "pair-loop", patternLabel: "Request / response loop", activeComponentIds: ["coordinator", "working-context", "general-model", "private-model"], contractLegs: [leg("runtime-to-models"), leg("runtime-to-models", "return")], state: "active" },
  { number: 6, eventKind: "delegate-workers", label: "Fan work out to bounded workers", summary: "One coordinator remains the hub while multiple workers own separate tasks.", topology: "star", patternLabel: "Hub / star", activeComponentIds: ["coordinator", "task-scheduler", "worker-a", "worker-b", "worker-c"], contractLegs: [leg("runtime-to-agents"), leg("runtime-to-agents", "return")], state: "active" },
  { number: 7, eventKind: "call-function-tool", label: "Call a typed function", summary: "A worker sends validated arguments and waits for a typed result or error.", topology: "pair-loop", patternLabel: "Tool request / return", activeComponentIds: ["worker-a", "function-tool", "data-source"], contractLegs: [leg("agents-to-tools"), leg("agents-to-tools", "return")], state: "active" },
  { number: 8, eventKind: "retrieve-knowledge", label: "Retrieve grounded knowledge", summary: "Retrieval returns evidence and provenance before a model uses it as context.", topology: "pair-loop", patternLabel: "Retrieval request / return", activeComponentIds: ["worker-b", "retrieval-tool", "data-source"], contractLegs: [leg("agents-to-tools"), leg("agents-to-tools", "return")], state: "active" },
  { number: 9, eventKind: "observe-results", label: "Feed tool results into the next model call", summary: "Typed tool evidence returns through the runtime so the model can decide the next bounded step.", topology: "pair-loop", patternLabel: "Observe / decide loop", activeComponentIds: ["coordinator", "working-context", "general-model", "worker-a", "worker-b"], contractLegs: [leg("runtime-to-models"), leg("runtime-to-models", "return")], state: "active" },
  { number: 10, eventKind: "start-tool-attempt", label: "Start attempt 1", summary: "The first bounded tool request is running; no result exists yet.", topology: "retry", patternLabel: "Attempt 1 · request", activeComponentIds: ["worker-c", "function-tool"], contractLegs: [leg("agents-to-tools")], state: "active", attempt: 1, attemptStatuses: ["running", "waiting"] },
  { number: 11, eventKind: "record-tool-failure", label: "Record the timeout", summary: "Attempt 1 reaches its deadline with no result and cannot be treated as evidence.", topology: "retry", patternLabel: "Attempt 1 · timed out", activeComponentIds: ["worker-c", "function-tool"], contractLegs: [leg("agents-to-tools")], state: "failed", attempt: 1, attemptStatuses: ["timed-out", "waiting"] },
  { number: 12, eventKind: "retry-tool-call", label: "Start a separate bounded retry", summary: "Attempt 2 is a new request with its own identity and narrowed contract.", topology: "retry", patternLabel: "Attempt 2 · request", activeComponentIds: ["worker-c", "function-tool"], contractLegs: [leg("agents-to-tools")], state: "retry", attempt: 2, attemptStatuses: ["timed-out", "running"] },
  { number: 13, eventKind: "accept-tool-result", label: "Accept the returned result", summary: "Attempt 2 succeeds; only now may its typed result advance the run.", topology: "retry", patternLabel: "Attempt 2 · returned", activeComponentIds: ["worker-c", "function-tool", "coordinator"], contractLegs: [leg("agents-to-tools", "return")], state: "recovered", attempt: 2, attemptStatuses: ["timed-out", "returned"] },
  { number: 14, eventKind: "review-decision", label: "Evaluate before authority", summary: "Policy, evaluation, and human review receive a scoped proposal before sensitive work can advance.", topology: "sequence", patternLabel: "Governed review", activeComponentIds: ["worker-a", "policy-guard", "output-evaluator", "human-approval"], contractLegs: [leg("agents-to-governance")], state: "active" },
  { number: 15, eventKind: "close-revision-loop", label: "Return revision constraints", summary: "A revision decision returns through runtime and closes the control cycle on the worker.", topology: "cycle", patternLabel: "Control / verification cycle", activeComponentIds: ["worker-a", "policy-guard", "output-evaluator", "human-approval", "coordinator", "task-scheduler"], contractLegs: cycles[0]!.legs, state: "active" },
  { number: 16, eventKind: "allow-bounded-action", label: "Use only scoped authority", summary: "An approved action follows a one-way path through the exact permitted tool to an outcome.", topology: "sequence", patternLabel: "Governed action sequence", activeComponentIds: ["human-approval", "action-tool", "trace-telemetry"], contractLegs: [leg("governance-to-tools"), leg("tools-to-outcome")], state: "active" },
  { number: 17, eventKind: "publish-outcome", label: "Publish the verified outcome", summary: "One accepted outcome fans out separately to the requester and memory, while telemetry is recorded within the outcome boundary.", topology: "fan-out", patternLabel: "Outcome fan-out", activeComponentIds: ["response-publisher", "memory-writer", "trace-telemetry", "long-term-memory", "user-application"], contractLegs: [leg("outcome-to-context"), leg("outcome-to-entry")], state: "active", focusTarget: { kind: "group", groupId: "outcome" } },
];

const architectureModel: AgentArchitectureModel = {
  groups,
  components,
  relationships,
  cycles,
  concepts,
  trace,
};

export function simulateAgentArchitecture(): AgentRuntimeResult {
  return {
    data: architectureModel,
    generatedAt: "2026-01-01T00:00:00.000Z",
    adapterMode: "simulation",
  };
}
