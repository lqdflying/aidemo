import type { AgentComponentId, AgentGroupId } from "./agent-types";

export type AgentBlueprintTone =
  | "neutral"
  | "request"
  | "response"
  | "control"
  | "evidence"
  | "warning"
  | "danger";

export type AgentBlueprintIconName =
  | "action"
  | "app"
  | "approval"
  | "archive"
  | "check"
  | "clock"
  | "context"
  | "contract"
  | "database"
  | "event"
  | "file"
  | "gateway"
  | "globe"
  | "memory"
  | "message"
  | "model"
  | "network"
  | "policy"
  | "queue"
  | "route"
  | "runtime"
  | "search"
  | "send"
  | "server"
  | "skill"
  | "tool"
  | "trace"
  | "worker";

export type AgentBlueprintMotion =
  | "none"
  | "forward"
  | "bidirectional"
  | "loop"
  | "fan-out";

export interface AgentBlueprintNode {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly icon: AgentBlueprintIconName;
  readonly tone: AgentBlueprintTone;
  readonly meta?: string;
}

export type AgentBlueprintArtifactKind =
  | "contract"
  | "control"
  | "decision"
  | "failure"
  | "state";

export interface AgentBlueprintArtifact {
  readonly kind: AgentBlueprintArtifactKind;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly items?: readonly string[];
}

interface AgentBlueprintBase {
  readonly title: string;
  readonly summary: string;
  readonly caption: string;
  readonly motion: AgentBlueprintMotion;
  readonly artifacts: readonly AgentBlueprintArtifact[];
}

export interface AgentLinearBlueprint extends AgentBlueprintBase {
  readonly kind: "pipeline" | "sequence" | "lifecycle" | "contract-boundary";
  readonly stages: readonly AgentBlueprintNode[];
  readonly returnLabel?: string;
  readonly failure?: AgentBlueprintNode;
}

export interface AgentTopologyColumn {
  readonly label: string;
  readonly nodes: readonly AgentBlueprintNode[];
}

export interface AgentTopologyBlueprint extends AgentBlueprintBase {
  readonly kind: "source-map";
  readonly columns: readonly AgentTopologyColumn[];
  readonly inset?: {
    readonly label: string;
    readonly stages: readonly AgentBlueprintNode[];
  };
  readonly rails?: readonly string[];
}

export interface AgentStateMachineBlueprint extends AgentBlueprintBase {
  readonly kind: "state-machine";
  readonly states: readonly AgentBlueprintNode[];
  readonly branches: readonly AgentBlueprintNode[];
}

export interface AgentControlLoopBlueprint extends AgentBlueprintBase {
  readonly kind: "control-loop";
  readonly stages: readonly AgentBlueprintNode[];
  readonly state: AgentBlueprintNode;
  readonly exit: AgentBlueprintNode;
}

export interface AgentRoutingMatrixBlueprint extends AgentBlueprintBase {
  readonly kind: "routing-matrix";
  readonly source: AgentBlueprintNode;
  readonly criteria: readonly string[];
  readonly targets: readonly AgentBlueprintNode[];
  readonly fallback: string;
}

export interface AgentFanOutBlueprint extends AgentBlueprintBase {
  readonly kind: "fan-out";
  readonly origin: AgentBlueprintNode;
  readonly branches: readonly AgentBlueprintNode[];
  readonly join?: AgentBlueprintNode;
}

export interface AgentDecisionGateBlueprint extends AgentBlueprintBase {
  readonly kind: "decision-gate";
  readonly checkpoints: readonly AgentBlueprintNode[];
  readonly gate: AgentBlueprintNode;
  readonly outcomes: readonly AgentBlueprintNode[];
}

export interface AgentTraceTreeBranch {
  readonly node: AgentBlueprintNode;
  readonly children: readonly AgentBlueprintNode[];
}

export interface AgentTraceTreeBlueprint extends AgentBlueprintBase {
  readonly kind: "trace-tree";
  readonly root: AgentBlueprintNode;
  readonly branches: readonly AgentTraceTreeBranch[];
}

export type AgentPlatformDetailSpec =
  | AgentLinearBlueprint
  | AgentTopologyBlueprint
  | AgentStateMachineBlueprint
  | AgentControlLoopBlueprint
  | AgentRoutingMatrixBlueprint
  | AgentFanOutBlueprint
  | AgentDecisionGateBlueprint
  | AgentTraceTreeBlueprint;

function node(
  id: string,
  label: string,
  detail: string,
  icon: AgentBlueprintIconName,
  tone: AgentBlueprintTone = "neutral",
  meta?: string,
): AgentBlueprintNode {
  return { id, label, detail, icon, tone, ...(meta ? { meta } : {}) };
}

function artifact(
  kind: AgentBlueprintArtifactKind,
  eyebrow: string,
  title: string,
  description: string,
  items?: readonly string[],
): AgentBlueprintArtifact {
  return { kind, eyebrow, title, description, ...(items ? { items } : {}) };
}

export const agentGroupBlueprints = {
  entry: {
    kind: "source-map",
    title: "Input & channels",
    summary: "Normalize every human, application, and event channel into one trusted request boundary.",
    caption: "Transport-specific behavior stops at the adapter. The runtime receives one versioned envelope with identity and delivery semantics intact.",
    motion: "forward",
    columns: [
      {
        label: "Channel sources",
        nodes: [
          node("interactive", "Chat, web & API", "Synchronous request or streamed conversation", "app", "request"),
          node("async", "Queue, event & webhook", "At-least-once delivery and acknowledgement", "event", "request"),
          node("scheduled", "Schedule & automation", "System-triggered work with a service identity", "clock", "request"),
        ],
      },
      {
        label: "Boundary adapters",
        nodes: [
          node("adapter", "Channel adapter", "Decode transport, attachments, sender and reply address", "gateway", "control"),
          node("normalize", "Normalize & validate", "Apply schema version, tenant, correlation and trust metadata", "contract", "control"),
        ],
      },
      {
        label: "Runtime contract",
        nodes: [
          node("envelope", "RequestEnvelope", "goal · identity · tenant · channel · deadline", "contract", "response", "versioned"),
        ],
      },
    ],
    rails: ["Identity & tenant", "Idempotency & correlation", "Attachment policy"],
    artifacts: [
      artifact("contract", "Admission contract", "One envelope, many transports", "Keep channel-specific fields in metadata; expose a stable task payload to the runtime.", ["request_id + conversation_id", "caller and service identity", "reply and cancellation channel"]),
      artifact("failure", "Delivery semantics", "Duplicates are expected", "Deduplicate before starting work and acknowledge only after the request is durably admitted.", ["dedupe key", "ack deadline", "dead-letter route"]),
    ],
  },
  runtime: {
    kind: "control-loop",
    title: "Agent runtime",
    summary: "A durable control plane owns progress around every model, worker, and tool call.",
    caption: "The coordinator advances explicit run state. Models propose work; application code owns budgets, dependencies, retries, cancellation, and exit.",
    motion: "loop",
    stages: [
      node("observe", "Observe", "Read objective, run state and completed results", "runtime", "request"),
      node("decide", "Decide", "Choose the next bounded task or stop rule", "route", "control"),
      node("schedule", "Schedule", "Dispatch ready work under concurrency limits", "queue", "request"),
      node("evaluate", "Evaluate", "Accept, revise, retry, wait or escalate", "check", "response"),
    ],
    state: node("run-record", "Durable run record", "step status · attempts · deadlines · ownership", "database", "evidence"),
    exit: node("exit", "Verified exit", "completion, safe stop or human escalation", "check", "response"),
    artifacts: [
      artifact("state", "State boundary", "Persist before side effects", "Checkpoint the task and attempt identity before dispatch so recovery never guesses what happened.", ["run + task + attempt IDs", "checkpoint version", "lease and cancellation"]),
      artifact("control", "Bounded autonomy", "Budgets are executable rules", "Enforce maximum steps, time, cost, retries and tool scope in runtime code—not in a prompt.", ["wall-clock deadline", "retry budget", "explicit exit condition"]),
    ],
  },
  context: {
    kind: "pipeline",
    title: "Context & memory",
    summary: "Assemble a reproducible context package from explicit state, instructions, memory, and evidence.",
    caption: "Context is selected and ordered by policy. Retrieved material keeps provenance, while durable memory is written only after verification.",
    motion: "forward",
    stages: [
      node("sources", "Approved inputs", "request · run state · skills · memory · evidence", "context", "request"),
      node("rank", "Select & rank", "Access checks, relevance, freshness and trust", "route", "control"),
      node("budget", "Allocate token budget", "Preserve constraints before compressing detail", "context", "control"),
      node("package", "ContextPackage", "ordered content with source references", "contract", "response", "versioned"),
    ],
    failure: node("writeback", "Governed write-back", "Only verified memory candidates reach retention policy", "memory", "evidence"),
    artifacts: [
      artifact("decision", "Assembly order", "Authority before relevance", "System constraints and policy remain ahead of retrieved or user-provided content.", ["instructions", "current run state", "verified evidence", "optional memory"]),
      artifact("failure", "Compaction rule", "Never summarize away control", "Preserve decisions, open work, citations, ownership and safety constraints through every compression pass."),
    ],
  },
  models: {
    kind: "routing-matrix",
    title: "Models",
    summary: "Route each stateless call to the endpoint that fits capability, data boundary, latency, and cost.",
    caption: "The model gateway owns selection and fallback. Every endpoint receives the same typed call boundary and returns an inspectable outcome.",
    motion: "none",
    source: node("gateway", "Model gateway", "One call contract and usage envelope", "gateway", "request"),
    criteria: ["capability", "data class", "residency", "latency", "cost", "availability"],
    targets: [
      node("general", "General model", "Broad reasoning and language tasks", "model", "control"),
      node("private", "Private model", "Restricted data or controlled hosting", "server", "evidence"),
      node("specialist", "Specialized model", "Domain, modality or small fast task", "model", "warning"),
    ],
    fallback: "Fallback may change endpoint, never authority, schema, or verification requirements.",
    artifacts: [
      artifact("contract", "Call boundary", "Stateless by design", "Send prompt, context reference, schema, deadline and policy tags; receive output, usage and typed failure."),
      artifact("decision", "Routing policy", "Measure quality per task class", "Use evaluated capability and operational SLOs rather than a single global default model."),
    ],
  },
  agents: {
    kind: "fan-out",
    title: "Agents & workers",
    summary: "Delegate bounded tasks to specialist workers while one coordinator retains global ownership.",
    caption: "A hub-and-spoke graph or DAG makes dependencies, authority, concurrency and result ownership visible. Workers never become an unstructured swarm.",
    motion: "fan-out",
    origin: node("coordinator", "Coordinator", "Creates typed tasks and owns the complete run", "runtime", "control"),
    branches: [
      node("research", "Research worker", "Read-only search and evidence collection", "search", "evidence"),
      node("analysis", "Analysis worker", "Structured comparison and planning", "worker", "control"),
      node("execution", "Execution worker", "Governed action proposal and verification", "action", "warning"),
    ],
    join: node("merge", "Evaluate & merge", "Reconcile typed results, conflicts and absence", "check", "response"),
    artifacts: [
      artifact("contract", "Worker task", "One owner, one completion rule", "Each task declares context scope, allowed capabilities, result schema, deadline and cancellation behavior."),
      artifact("failure", "Concurrency", "Cancel dependants, not evidence", "Preserve completed evidence while stopping downstream work that depends on a failed or revoked task."),
    ],
  },
  tools: {
    kind: "source-map",
    title: "Tools & knowledge",
    summary: "Unify built capabilities, MCP connections, search, RAG, governed data, and external actions behind typed control planes.",
    caption: "Tools execute capabilities; retrieval returns evidence. MCP tools join the capability registry, MCP resources join context paths, and MCP prompts remain versioned instruction assets.",
    motion: "forward",
    columns: [
      {
        label: "Capability & knowledge sources",
        nodes: [
          node("built", "Built-in functions & APIs", "Deployed code and internal service adapters", "tool", "request"),
          node("mcp", "MCP servers", "Tools · resources · prompts remain distinct", "network", "control"),
          node("search", "Global & enterprise search", "Web-scale and organization-scoped discovery", "globe", "evidence"),
          node("rag", "RAG corpus & index", "Versioned chunks, embeddings and source ACLs", "database", "evidence"),
          node("query", "Governed data query", "Direct records, metrics and events", "server", "evidence"),
        ],
      },
      {
        label: "Platform control plane",
        nodes: [
          node("registry", "Capability registry", "schema · owner · auth · risk · availability", "contract", "control"),
          node("router", "Retrieval router", "policy · query plan · backend selection", "route", "control"),
          node("instructions", "Instruction registry", "MCP prompts and internal skills are versioned assets", "skill", "control"),
        ],
      },
      {
        label: "Controlled execution",
        nodes: [
          node("runner", "Tool runner", "validate · authorize · timeout · retry · sandbox", "runtime", "warning"),
          node("retrieval", "Retrieval pipeline", "rewrite · hybrid search · filter · rerank", "search", "evidence"),
          node("action", "Action executor", "approval · least privilege · verify", "action", "warning"),
        ],
      },
      {
        label: "Typed returns",
        nodes: [
          node("result", "Result<T> | TypedError", "Inspectable function or API outcome", "contract", "response"),
          node("evidence", "Evidence bundle", "citations · provenance · freshness · confidence", "file", "response"),
          node("receipt", "Action receipt", "postcondition · audit ID · rollback status", "check", "response"),
        ],
      },
    ],
    inset: {
      label: "Offline RAG knowledge lifecycle",
      stages: [
        node("rag-source", "Governed sources", "documents, records and media", "archive", "evidence"),
        node("rag-parse", "Parse & chunk", "structure, metadata and ACLs", "file", "control"),
        node("rag-index", "Embed & index", "hybrid lexical + vector access", "database", "control"),
        node("rag-version", "Version corpus", "freshness, lineage and rollback", "check", "response"),
      ],
    },
    rails: ["Identity & secrets", "Authorization & policy", "Timeouts & quotas", "Provenance & telemetry"],
    artifacts: [
      artifact("decision", "Build or connect", "Use one registry contract", "Built-in code gives tight control; API adapters reuse internal services; MCP adds protocol discovery. They should share validation and authorization.", ["owner + version", "input/output schema", "read/write risk class"]),
      artifact("contract", "Knowledge return", "Evidence is not an answer", "Retrieval returns ranked evidence with source locators and freshness. The agent still synthesizes and the evaluator checks grounding."),
      artifact("control", "Write boundary", "Actions require narrower authority", "Bind approval to exact arguments, an idempotency key, expiry, and postcondition verification."),
    ],
  },
  governance: {
    kind: "decision-gate",
    title: "Governance",
    summary: "Place versioned controls wherever data, generated output, or external authority crosses a boundary.",
    caption: "Governance is a cross-cutting control plane, not a final checkbox. Every decision records policy version, inputs, outcome and authority source.",
    motion: "forward",
    checkpoints: [
      node("admission", "Admission", "identity, request and data classification", "gateway", "request"),
      node("context", "Context", "access, provenance and instruction policy", "context", "evidence"),
      node("output", "Output", "schema, grounding and quality", "check", "evidence"),
      node("action", "Action", "scope, risk and human authority", "action", "warning"),
      node("outcome", "Outcome", "redaction, retention and audit", "send", "response"),
    ],
    gate: node("decision", "Policy + evaluation + human authority", "versioned, inspectable decision record", "policy", "control"),
    outcomes: [
      node("allow", "Allow", "advance unchanged", "check", "response"),
      node("constrain", "Constrain / revise", "return exact limits", "route", "warning"),
      node("escalate", "Escalate", "bind a human decision", "approval", "warning"),
      node("deny", "Deny / stop", "safe terminal state", "policy", "danger"),
    ],
    artifacts: [
      artifact("control", "Decision record", "Make control reproducible", "Store policy and evaluator versions, relevant inputs, reason codes, authority, scope and expiry."),
      artifact("failure", "Bypass analysis", "Test every path", "A control exists only if retries, fallbacks, internal jobs and privileged tools cannot route around it."),
    ],
  },
  outcome: {
    kind: "fan-out",
    title: "Outcome & return",
    summary: "Distribute one accepted outcome through independent delivery, memory, and observability contracts.",
    caption: "Completion, response delivery, memory retention and telemetry are separate operations. Each branch reports its own receipt or failure.",
    motion: "fan-out",
    origin: node("accepted", "Accepted outcome", "verified result, action receipt or no-action decision", "check", "control"),
    branches: [
      node("response", "Response delivery", "format, redact, cite, stream and confirm", "send", "response"),
      node("memory", "Governed memory write", "retain only an approved candidate", "memory", "evidence"),
      node("trace", "Trace, metrics & audit", "record operational facts with redaction", "trace", "request"),
    ],
    artifacts: [
      artifact("contract", "Independent receipts", "Partial success stays visible", "A delivered response does not imply memory or telemetry succeeded; record each branch status separately."),
      artifact("failure", "Publication order", "Verify before publishing", "Do not expose partial output or persist run state merely because generation finished."),
    ],
  },
} satisfies Readonly<Record<AgentGroupId, AgentPlatformDetailSpec>>;

export const agentComponentBlueprints = {
  "user-application": {
    kind: "sequence",
    title: "User or application",
    summary: "Express a goal through the same controlled boundary, whether the caller is a person or another service.",
    caption: "The caller supplies intent and constraints, keeps a cancellation channel, and receives a verified response correlated to the original request.",
    motion: "bidirectional",
    stages: [
      node("caller", "Caller", "person, application or upstream workflow", "app", "request"),
      node("request", "RequestEnvelope", "goal · identity · constraints · deadline", "contract", "request"),
      node("platform", "Agent platform", "admit, execute, evaluate and publish", "runtime", "control"),
      node("response", "Verified response", "status · answer · citations · receipts", "check", "response"),
    ],
    returnLabel: "streamed result, typed error, or explicit no-result",
    artifacts: [
      artifact("contract", "Conversation contract", "Keep correlation explicit", "Use request, conversation and tenant IDs independently so retries and parallel turns remain distinguishable."),
      artifact("control", "Caller controls", "Cancellation is a real signal", "Propagate disconnect, cancel and deadline into the runtime instead of only stopping UI rendering."),
    ],
  },
  "event-message": {
    kind: "state-machine",
    title: "Event or message",
    summary: "Turn unreliable delivery into one durable, deduplicated unit of agent work.",
    caption: "At-least-once transports can redeliver. The platform records the dedupe decision and acknowledges only after durable admission.",
    motion: "forward",
    states: [
      node("received", "Received", "capture payload and delivery metadata", "event", "request"),
      node("dedupe", "Deduplicate", "check source + message + semantic key", "archive", "control"),
      node("validate", "Validate", "schema, identity, trust and tenant", "gateway", "control"),
      node("admit", "Durably admit", "create run and checkpoint ownership", "database", "evidence"),
      node("ack", "Acknowledge", "commit delivery only after admission", "check", "response"),
    ],
    branches: [
      node("duplicate", "Duplicate", "return prior admission receipt", "archive", "warning"),
      node("retry", "Transient failure", "negative ack or visibility timeout", "clock", "warning"),
      node("dead", "Invalid or exhausted", "dead-letter with reason code", "event", "danger"),
    ],
    artifacts: [
      artifact("state", "Delivery state", "Transport and run state differ", "Message acknowledgement proves admission, not successful agent completion."),
      artifact("failure", "Poison events", "Bound retries", "Use retry count, backoff and a dead-letter route so one bad event cannot block the partition."),
    ],
  },
  "input-gateway": {
    kind: "pipeline",
    title: "Input gateway",
    summary: "Enforce the first trust boundary before untrusted content reaches context, models, or tools.",
    caption: "The gateway emits either a validated task contract or a typed rejection. It never silently repairs identity, authority, or schema failures.",
    motion: "forward",
    stages: [
      node("schema", "Decode & schema", "size, media type and version", "contract", "request"),
      node("identity", "Authenticate & authorize", "caller, tenant, workload and scope", "gateway", "control"),
      node("quota", "Quota & rate", "cost class, concurrency and deadline", "clock", "control"),
      node("content", "Content controls", "injection, secrets and data classification", "policy", "warning"),
      node("route", "Workflow route", "validated TaskContract or rejection", "route", "response"),
    ],
    failure: node("reject", "Typed rejection", "reason code, safe message and correlation ID", "policy", "danger"),
    artifacts: [
      artifact("contract", "Admission output", "No partially trusted request", "Downstream components consume only a versioned TaskContract carrying identity and policy tags."),
      artifact("failure", "Fail closed", "Unknown identity or schema stops here", "Log a redacted reason and correlation ID without echoing unsafe payload content."),
    ],
  },
  coordinator: {
    kind: "control-loop",
    title: "Coordinator",
    summary: "Observe durable run state, choose one bounded next step, and decide when the run may exit.",
    caption: "The coordinator is application control code. A model may propose a step, but cannot own retries, authority, persistence, or completion.",
    motion: "loop",
    stages: [
      node("observe", "Observe", "objective, state, results and budgets", "runtime", "request"),
      node("decide", "Decide", "next task, wait, retry, revise or stop", "route", "control"),
      node("act", "Dispatch", "model, worker or tool contract", "send", "request"),
      node("evaluate", "Evaluate", "typed outcome and policy decision", "check", "response"),
    ],
    state: node("state", "Run record", "single owner of global progress", "database", "evidence"),
    exit: node("exit", "Exit or escalate", "explicit completion, safe stop or human handoff", "approval", "response"),
    artifacts: [
      artifact("control", "Stop rules", "Autonomy must be finite", "Enforce maximum steps, elapsed time, spend, repeated plans and consecutive failures."),
      artifact("state", "Recovery", "Resume from facts, not prompts", "Persist dispatched attempt IDs and accepted results before calculating the next step."),
    ],
  },
  "task-scheduler": {
    kind: "state-machine",
    title: "Task scheduler",
    summary: "Expose dependencies and dispatch only tasks that are ready, owned, and within concurrency limits.",
    caption: "A DAG makes parallelism and blocking visible. Every task transition is idempotent and tied to a lease or attempt.",
    motion: "forward",
    states: [
      node("blocked", "Blocked", "waiting on prerequisites", "queue", "neutral"),
      node("ready", "Ready", "dependencies and policy satisfied", "check", "request"),
      node("leased", "Leased", "worker owns one attempt until expiry", "clock", "control"),
      node("running", "Running", "heartbeats and cancellation observed", "runtime", "request"),
      node("complete", "Completed", "typed result durably accepted", "check", "response"),
    ],
    branches: [
      node("failed", "Failed", "typed terminal error", "queue", "danger"),
      node("retry", "Retryable", "new attempt after bounded backoff", "clock", "warning"),
      node("cancel", "Cancelled", "propagate to dependent work", "policy", "warning"),
    ],
    artifacts: [
      artifact("state", "Task identity", "Task and attempt are different", "Retries reuse the logical task ID but receive a new attempt ID and lease."),
      artifact("control", "Dependency policy", "Failure propagation is explicit", "Choose whether dependants cancel, degrade, wait for human input, or consume partial evidence."),
    ],
  },
  "working-context": {
    kind: "lifecycle",
    title: "Working context",
    summary: "Hold the inspectable facts, decisions, open work, and artifacts for one active run.",
    caption: "Working context is versioned session state outside the model. Every call receives a selected snapshot and returns proposed updates.",
    motion: "forward",
    stages: [
      node("initialize", "Initialize", "validated objective and constraints", "context", "request"),
      node("enrich", "Enrich", "accepted results, evidence and decisions", "file", "evidence"),
      node("checkpoint", "Checkpoint", "version and ownership after each step", "database", "control"),
      node("compact", "Compact", "preserve control facts and references", "archive", "warning"),
      node("close", "Close", "produce memory candidates, not raw history", "check", "response"),
    ],
    artifacts: [
      artifact("state", "Suggested shape", "Separate facts from narration", "Store objective, constraints, decisions, open tasks, artifacts and accepted evidence as distinct fields."),
      artifact("failure", "Context growth", "Apply limits by category", "Do not let verbose tool output crowd out the current objective, constraints or unresolved work."),
    ],
  },
  "long-term-memory": {
    kind: "lifecycle",
    title: "Long-term memory",
    summary: "Retain verified information across runs with provenance, access control, retention, update, and deletion.",
    caption: "Memory is an external governed store, not hidden model state. Retrieval and writing use separate authorization paths.",
    motion: "forward",
    stages: [
      node("candidate", "Memory candidate", "verified fact, preference or durable outcome", "memory", "request"),
      node("classify", "Verify & classify", "purpose, sensitivity, provenance and TTL", "policy", "control"),
      node("store", "Persist", "record ACL, lineage and version", "database", "evidence"),
      node("retrieve", "Retrieve", "scope, rank and explain relevance", "search", "response"),
      node("maintain", "Update or delete", "expiry, correction and user rights", "archive", "warning"),
    ],
    artifacts: [
      artifact("contract", "Memory record", "Every value carries lineage", "Store source, verification status, owner, access scope, retention class and supersession link."),
      artifact("failure", "Contamination", "Generated output is not automatically memory", "Require an explicit candidate, verification and retention decision before persistence."),
    ],
  },
  "skills-instructions": {
    kind: "lifecycle",
    title: "Skills & instructions",
    summary: "Treat prompts, procedures, schemas, tool policies, and MCP prompts as named versioned application assets.",
    caption: "Instruction assets are selected and composed by the runtime, tested against scenarios, and rolled out with the same discipline as code.",
    motion: "forward",
    stages: [
      node("author", "Author", "purpose, owner, inputs, outputs and policy", "skill", "request"),
      node("version", "Version", "immutable content plus dependency manifest", "archive", "control"),
      node("test", "Evaluate", "golden tasks, adversarial cases and regressions", "check", "evidence"),
      node("compose", "Select & compose", "resolve priority and incompatible assets", "route", "control"),
      node("rollout", "Roll out / rollback", "cohort, metrics and previous safe version", "send", "response"),
    ],
    artifacts: [
      artifact("contract", "Asset manifest", "Dependencies stay visible", "Declare required tools, schemas, model capabilities, context inputs and output contract."),
      artifact("failure", "Instruction conflict", "Composition needs precedence", "Reject incompatible policies or schemas instead of concatenating fragments and hoping the model resolves them."),
    ],
  },
  "context-manager": {
    kind: "pipeline",
    title: "Context manager",
    summary: "Select, order, compact, and budget context while preserving authority and provenance.",
    caption: "The manager produces a reproducible ContextPackage and a manifest explaining what was included, summarized, or omitted.",
    motion: "forward",
    stages: [
      node("collect", "Collect candidates", "instructions · state · memory · retrieved evidence", "context", "request"),
      node("filter", "Authorize & filter", "tenant, ACL, sensitivity and task scope", "policy", "control"),
      node("rank", "Rank", "authority, necessity, freshness and relevance", "route", "control"),
      node("budget", "Allocate & compact", "reserve control content before detail", "archive", "warning"),
      node("package", "ContextPackage", "ordered payload + provenance manifest", "contract", "response"),
    ],
    artifacts: [
      artifact("decision", "Budget policy", "Reserve before ranking", "Allocate fixed space for instructions, objective, constraints and open work before optional evidence or memory."),
      artifact("failure", "Compaction evidence", "Record what changed", "Keep source references and a summary lineage so engineers can reproduce context-related failures."),
    ],
  },
  "general-model": {
    kind: "contract-boundary",
    title: "General model",
    summary: "Provide broad language and reasoning capability through one stateless, replaceable call boundary.",
    caption: "The model receives only approved context and returns generated content or tool intent. It owns neither run state nor authorization.",
    motion: "bidirectional",
    stages: [
      node("request", "ModelRequest<T>", "instructions · context refs · schema · deadline", "contract", "request"),
      node("endpoint", "General model", "one stateless inference call", "model", "control"),
      node("response", "ModelResult<T>", "content · tool intent · usage · finish reason", "contract", "response"),
      node("validate", "Runtime validation", "schema, policy, evidence and completion", "check", "evidence"),
    ],
    returnLabel: "Result<T> | TypedError | NoResult",
    artifacts: [
      artifact("contract", "No hidden authority", "Generated intent is a proposal", "Tool calls and policy claims must cross their own validation and authorization boundaries."),
      artifact("decision", "Default endpoint", "Broad capability, measured limits", "Use per-task quality, latency and cost data; do not infer reliability from fluency."),
    ],
  },
  "private-model": {
    kind: "routing-matrix",
    title: "Private or specialized model",
    summary: "Select a controlled or domain-specific endpoint without changing the surrounding harness contract.",
    caption: "Data boundary and capability determine placement. Fallback never moves restricted content outside its approved residency.",
    motion: "none",
    source: node("gateway", "Model gateway", "classified request and stable result schema", "gateway", "request"),
    criteria: ["data residency", "tenant isolation", "domain capability", "modality", "latency", "capacity"],
    targets: [
      node("vpc", "Private hosted / VPC", "managed endpoint inside controlled network", "server", "control"),
      node("onprem", "On-prem model", "strict residency and local operations", "database", "evidence"),
      node("specialist", "Domain specialist", "narrow evaluated task capability", "model", "warning"),
    ],
    fallback: "Fallback stays inside the same data class or returns an explicit unavailable result.",
    artifacts: [
      artifact("decision", "Placement rule", "Classify before routing", "Bind allowed endpoints to data class, tenant, region and task type in executable policy."),
      artifact("failure", "Model disagreement", "Never silently merge", "Preserve endpoint identity and evaluation result when comparing or falling back between models."),
    ],
  },
  "worker-a": {
    kind: "pipeline",
    title: "Specialist worker A · research pattern",
    summary: "Collect evidence through read-only search and retrieval, then return a typed evidence bundle.",
    caption: "The research worker may discover and rank sources but cannot write external state or declare the final answer verified.",
    motion: "forward",
    stages: [
      node("task", "ResearchTask", "question · scope · source policy · deadline", "contract", "request"),
      node("plan", "Query plan", "choose global, enterprise, RAG or direct data", "route", "control"),
      node("retrieve", "Retrieve & rerank", "deduplicate, filter and preserve citations", "search", "evidence"),
      node("bundle", "EvidenceBundle", "claims · excerpts · locators · freshness", "file", "response"),
    ],
    artifacts: [
      artifact("contract", "Result schema", "Evidence, not prose alone", "Return source IDs, locators, relevant spans, timestamps, confidence and unresolved gaps."),
      artifact("control", "Allowed capabilities", "Read-only by default", "Search and retrieval tools may access only task-scoped corpora and identities."),
    ],
  },
  "worker-b": {
    kind: "pipeline",
    title: "Specialist worker B · analysis pattern",
    summary: "Transform approved evidence into a structured comparison, plan, or recommendation without external writes.",
    caption: "The analysis worker makes assumptions and uncertainty explicit so the coordinator can evaluate or request more evidence.",
    motion: "forward",
    stages: [
      node("task", "AnalysisTask", "objective · criteria · evidence references", "contract", "request"),
      node("verify", "Check sufficiency", "identify conflicts, gaps and stale evidence", "check", "evidence"),
      node("reason", "Compare & plan", "apply declared criteria and constraints", "worker", "control"),
      node("result", "StructuredDecision", "options · trade-offs · assumptions · confidence", "file", "response"),
    ],
    artifacts: [
      artifact("contract", "Decision output", "Separate fact from inference", "Link every material conclusion to evidence or label it as an assumption."),
      artifact("failure", "Insufficient evidence", "Return a gap, not invented certainty", "Use a typed `NeedsEvidence` outcome with the missing question and acceptable source class."),
    ],
  },
  "worker-c": {
    kind: "sequence",
    title: "Specialist worker C · execution pattern",
    summary: "Turn an approved plan into an exact action proposal, then verify the resulting external state.",
    caption: "The execution worker cannot reuse broad authority. Each write is bound to exact arguments, scope, expiry and an idempotency key.",
    motion: "forward",
    stages: [
      node("proposal", "ActionProposal", "operation · arguments · target · expected state", "contract", "request"),
      node("review", "Policy & approval", "risk, scope, identity and expiry", "approval", "control"),
      node("execute", "Action tool", "least-privilege idempotent write", "action", "warning"),
      node("verify", "Postcondition check", "read back state and compare expectation", "check", "evidence"),
      node("receipt", "ActionReceipt", "status · audit ID · rollback availability", "contract", "response"),
    ],
    failure: node("timeout", "Timeout / uncertain state", "do not retry until state is reconciled", "clock", "danger"),
    artifacts: [
      artifact("control", "Authority", "Approval is single-use", "Bind the reviewer decision to operation, arguments, resource, actor, expiry and attempt ID."),
      artifact("failure", "Unknown outcome", "Read before retry", "A timeout can occur after the write committed; reconcile the postcondition before creating a new attempt."),
    ],
  },
  "function-tool": {
    kind: "contract-boundary",
    title: "Function or API tool",
    summary: "Expose built code, internal APIs, or MCP-discovered tools through one validated execution contract.",
    caption: "Discovery identifies a capability; the platform still owns allowlisting, schema validation, identity, timeout, retries, and result normalization.",
    motion: "bidirectional",
    stages: [
      node("sources", "Capability source", "built-in · internal API · MCP tool", "tool", "request"),
      node("registry", "Capability registry", "version · schema · owner · auth · risk", "contract", "control"),
      node("runner", "Controlled runner", "validate · authorize · timeout · isolate", "runtime", "warning"),
      node("return", "Typed return", "Result<T> · TypedError · NoResult", "contract", "response"),
    ],
    returnLabel: "result, error, timeout, or explicit absence",
    failure: node("timeout", "Timeout", "new attempt only after side-effect safety check", "clock", "danger"),
    artifacts: [
      artifact("decision", "Build vs connect", "Keep the boundary stable", "Built-in tools maximize control, API adapters reuse services, and MCP standardizes discovery. All share the same runtime guardrails."),
      artifact("contract", "Tool definition", "Schema is necessary, not sufficient", "Also declare owner, read/write class, identity mode, timeout, retry safety and data classification."),
    ],
  },
  "retrieval-tool": {
    kind: "routing-matrix",
    title: "Retrieval tool",
    summary: "Choose the right knowledge backend and return ranked evidence with provenance—not a final answer.",
    caption: "The retrieval router selects sources by scope, freshness, authority and query type, then normalizes results into one evidence contract.",
    motion: "none",
    source: node("query", "RetrievalQuery", "question · identity · filters · source policy", "search", "request"),
    criteria: ["public vs private", "freshness", "semantic vs exact", "structured vs document", "latency", "source authority"],
    targets: [
      node("global", "Global / web search", "current public discovery with citations", "globe", "evidence"),
      node("enterprise", "Enterprise search", "ACL-aware organization knowledge", "search", "evidence"),
      node("rag", "RAG retriever", "versioned corpus, hybrid retrieval and rerank", "database", "evidence"),
      node("direct", "Direct governed query", "exact records, metrics or events", "server", "evidence"),
    ],
    fallback: "Return partial evidence and source failures explicitly; never silently broaden the allowed search scope.",
    artifacts: [
      artifact("contract", "EvidenceBundle", "Every item stays attributable", "Include source, locator, captured time, freshness, rank score, access scope and the relevant content span."),
      artifact("decision", "RAG is a pipeline", "Separate offline and online quality", "Evaluate ingestion/chunking/index freshness independently from query rewrite, retrieval, reranking and citation use."),
    ],
  },
  "data-source": {
    kind: "source-map",
    title: "Data source",
    summary: "Expose documents, records, events, and measurements through governed adapters instead of prompt-embedded credentials.",
    caption: "Adapters preserve source semantics, access decisions, freshness and provenance while returning a normalized evidence or record contract.",
    motion: "forward",
    columns: [
      {
        label: "Systems of record",
        nodes: [
          node("docs", "Documents & object stores", "files, pages, media and archives", "file", "evidence"),
          node("records", "Databases & business APIs", "transactional and master records", "database", "evidence"),
          node("events", "Events, logs & metrics", "time-series operational signals", "trace", "evidence"),
          node("index", "Search & vector indexes", "derived discovery structures", "search", "evidence"),
        ],
      },
      {
        label: "Governed adapters",
        nodes: [
          node("identity", "Workload identity", "short-lived credentials and tenant scope", "gateway", "control"),
          node("query", "Query adapter", "parameterize, limit, redact and translate", "contract", "control"),
          node("metadata", "Source metadata", "freshness, lineage and consistency model", "archive", "control"),
        ],
      },
      {
        label: "Normalized return",
        nodes: [
          node("result", "RecordSet / Evidence", "typed values with source references", "file", "response"),
        ],
      },
    ],
    rails: ["Credentials never enter prompts", "Source ACLs remain authoritative", "Freshness is part of the result"],
    artifacts: [
      artifact("control", "Credential boundary", "Use platform identity", "The adapter obtains short-lived credentials; the model and prompt never receive reusable secrets."),
      artifact("contract", "Source semantics", "Do not flatten away truth", "Return timestamp, consistency, pagination, units, nullability and provenance with the values."),
    ],
  },
  "action-tool": {
    kind: "sequence",
    title: "Action tool",
    summary: "Change external state only through exact, least-privilege, approved, and verifiable operations.",
    caption: "The write path separates proposal, authority, execution and verification. A receipt describes observed state, not merely an accepted request.",
    motion: "forward",
    stages: [
      node("proposal", "Exact proposal", "operation · target · arguments · expected effect", "contract", "request"),
      node("authority", "Policy / human authority", "scope · actor · expiry · attempt", "approval", "control"),
      node("execute", "Idempotent execution", "least-privilege credential and audit ID", "action", "warning"),
      node("verify", "Postcondition", "read back and compare actual state", "check", "evidence"),
      node("receipt", "ActionReceipt", "succeeded · failed · uncertain · rolled back", "contract", "response"),
    ],
    failure: node("timeout", "Timeout / uncertain", "reconcile external state before retry", "clock", "danger"),
    artifacts: [
      artifact("control", "Idempotency", "Operation identity survives retries", "Use a stable operation key and a new attempt ID; the external service must reject duplicate effects."),
      artifact("failure", "Compensation", "Rollback is a designed capability", "Declare whether an operation supports rollback, forward repair, or mandatory human recovery."),
    ],
  },
  "policy-guard": {
    kind: "decision-gate",
    title: "Policy guard",
    summary: "Apply deterministic, versioned rules to explicit inputs before data, output, or actions advance.",
    caption: "The guard emits a machine-readable decision with reason codes and constraints. It does not ask the model to authorize itself.",
    motion: "forward",
    checkpoints: [
      node("request", "Request facts", "identity, tenant, purpose and data class", "contract", "request"),
      node("resource", "Resource facts", "owner, sensitivity and operation", "database", "evidence"),
      node("context", "Run facts", "risk, prior decisions and requested scope", "context", "evidence"),
    ],
    gate: node("engine", "Versioned policy engine", "rules + attributes + policy version", "policy", "control"),
    outcomes: [
      node("allow", "Allow", "advance with decision ID", "check", "response"),
      node("constrain", "Constrain", "narrow data, tools or arguments", "route", "warning"),
      node("escalate", "Escalate", "request named human authority", "approval", "warning"),
      node("deny", "Deny", "safe rejection with reason code", "policy", "danger"),
    ],
    artifacts: [
      artifact("contract", "PolicyDecision", "Inputs and reason remain inspectable", "Record policy version, subject, resource, action, relevant attributes, outcome, constraints and expiry."),
      artifact("failure", "Placement", "Guard every alternate path", "Apply the same policy at retries, fallbacks, batch jobs, internal tools and direct administrator routes."),
    ],
  },
  "output-evaluator": {
    kind: "pipeline",
    title: "Output evaluator",
    summary: "Combine deterministic, grounding, task-quality, and human checks without hiding uncertainty.",
    caption: "Evaluation returns pass, revise, fail, or uncertain with evidence. A model judge is one signal, never the complete authority chain.",
    motion: "forward",
    stages: [
      node("schema", "Schema & invariants", "parse, types, ranges and required fields", "contract", "control"),
      node("grounding", "Grounding", "claims map to permitted evidence", "search", "evidence"),
      node("quality", "Task quality", "completeness, relevance and success criteria", "check", "control"),
      node("judge", "Model judge · optional", "rubric score with known limitations", "model", "warning"),
      node("human", "Human review · when required", "domain or authority-sensitive assessment", "approval", "warning"),
      node("result", "EvalResult", "pass · revise · fail · uncertain", "contract", "response"),
    ],
    artifacts: [
      artifact("decision", "Evaluator composition", "Use the cheapest reliable layer first", "Run deterministic and evidence checks before expensive or subjective evaluation."),
      artifact("failure", "Calibration", "Fluent is not correct", "Track false accept/reject rates by task class and retain uncertainty instead of forcing binary confidence."),
    ],
  },
  "human-approval": {
    kind: "decision-gate",
    title: "Human approval",
    summary: "Present a decision-ready packet and bind one human decision to one exact action scope.",
    caption: "The reviewer sees the operation, arguments, evidence, risk and expected effect. Approval cannot become a reusable broad permission token.",
    motion: "forward",
    checkpoints: [
      node("operation", "Exact operation", "target, arguments and expected postcondition", "action", "request"),
      node("evidence", "Supporting evidence", "source references and evaluation result", "file", "evidence"),
      node("risk", "Risk & recovery", "blast radius, reversibility and expiry", "policy", "warning"),
    ],
    gate: node("reviewer", "Named human reviewer", "identity, role and decision timestamp", "approval", "control"),
    outcomes: [
      node("approve", "Approve", "exact scope + expiry + attempt", "check", "response"),
      node("revise", "Revise", "return explicit constraints", "route", "warning"),
      node("reject", "Reject", "terminal reason or alternative", "policy", "danger"),
    ],
    artifacts: [
      artifact("contract", "Approval token", "Narrow and single-use", "Bind reviewer, operation, arguments hash, resource, actor, expiry, attempt and policy decision."),
      artifact("failure", "Stale approval", "Invalidate on material change", "Any change to arguments, evidence, target, risk or elapsed validity requires a new review."),
    ],
  },
  "response-publisher": {
    kind: "pipeline",
    title: "Response publisher",
    summary: "Transform and deliver an accepted outcome through the requested channel with a delivery receipt.",
    caption: "Publishing is separate from generation so redaction, citations, channel formatting, streaming and delivery failure stay explicit.",
    motion: "forward",
    stages: [
      node("accepted", "Accepted result", "verified content and evidence references", "check", "request"),
      node("transform", "Transform & redact", "audience, locale, policy and channel limits", "policy", "control"),
      node("cite", "Attach evidence", "stable locators and disclosure labels", "file", "evidence"),
      node("deliver", "Channel adapter", "stream, send, callback or publish", "send", "request"),
      node("receipt", "DeliveryReceipt", "delivered · partial · failed · cancelled", "contract", "response"),
    ],
    failure: node("delivery-failure", "Delivery failed", "retry transport without regenerating content", "message", "danger"),
    artifacts: [
      artifact("contract", "Stable content ID", "Delivery retries reuse content", "Separate accepted response identity from channel attempt identity."),
      artifact("failure", "Partial streaming", "Do not imply completion early", "Mark stream state and send a terminal status when generation, policy, or delivery stops."),
    ],
  },
  "memory-writer": {
    kind: "decision-gate",
    title: "Verified memory writer",
    summary: "Persist only an explicit, verified memory candidate that passes retention and access policy.",
    caption: "The writer excludes raw run history and hidden reasoning. It returns a receipt identifying what was stored, superseded, or rejected.",
    motion: "forward",
    checkpoints: [
      node("candidate", "MemoryCandidate", "fact or outcome + provenance + confidence", "memory", "request"),
      node("verification", "Verification", "accepted evidence and evaluator result", "check", "evidence"),
      node("retention", "Retention policy", "purpose, ACL, TTL and deletion rights", "policy", "control"),
    ],
    gate: node("writer", "Memory write boundary", "dedupe, supersede, encrypt and audit", "database", "control"),
    outcomes: [
      node("persisted", "Persisted", "record ID, version and expiry", "check", "response"),
      node("superseded", "Updated", "link old and new versions", "archive", "evidence"),
      node("rejected", "Rejected", "reason and no retained payload", "policy", "danger"),
    ],
    artifacts: [
      artifact("contract", "Write receipt", "Retention is inspectable", "Return record ID, source, policy version, ACL, expiry and superseded record when applicable."),
      artifact("failure", "Privacy boundary", "Never store hidden reasoning", "Retain approved facts, preferences and outcomes—not chain-of-thought, unnecessary prompts or raw sensitive context."),
    ],
  },
  "trace-telemetry": {
    kind: "trace-tree",
    title: "Trace & telemetry",
    summary: "Correlate runs, model calls, workers, retrieval, tools, governance, and delivery without over-capturing sensitive content.",
    caption: "A trace explains control flow and latency; metrics show aggregate health; logs and audit records preserve selected operational and authority facts.",
    motion: "none",
    root: node("run", "Agent run span", "run ID · conversation ID · tenant · final status", "trace", "control"),
    branches: [
      {
        node: node("reasoning", "Reasoning operations", "model and worker boundaries", "model", "request"),
        children: [
          node("model-call", "Model call", "endpoint · latency · tokens · finish reason", "model", "neutral"),
          node("worker-call", "Worker task", "task · attempt · owner · typed status", "worker", "neutral"),
        ],
      },
      {
        node: node("external", "Knowledge & tools", "retrieval and external interactions", "tool", "evidence"),
        children: [
          node("retrieval", "Retrieval", "backend · result count · source refs", "search", "neutral"),
          node("tool-call", "Tool call", "tool · attempt · timeout · typed result", "tool", "neutral"),
        ],
      },
      {
        node: node("control", "Control decisions", "policy, evaluation and approval", "policy", "warning"),
        children: [
          node("policy", "Policy decision", "version · outcome · reason code", "policy", "neutral"),
          node("delivery", "Outcome delivery", "channel · receipt · final status", "send", "neutral"),
        ],
      },
    ],
    artifacts: [
      artifact("control", "Correlation", "IDs connect every boundary", "Propagate run, task, attempt, tool-call and policy-decision IDs through spans and receipts."),
      artifact("failure", "Sensitive content", "Metadata by default, content by policy", "Redact or hash prompts, retrieved text, tool arguments and results; apply explicit opt-in sampling for payload capture."),
    ],
  },
} satisfies Readonly<Record<AgentComponentId, AgentPlatformDetailSpec>>;

export function getAgentGroupBlueprint(groupId: AgentGroupId): AgentPlatformDetailSpec {
  return agentGroupBlueprints[groupId];
}

export function getAgentComponentBlueprint(
  componentId: AgentComponentId,
): AgentPlatformDetailSpec {
  return agentComponentBlueprints[componentId];
}
