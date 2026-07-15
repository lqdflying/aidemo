import type {
  AgentApprovalState,
  AgentExternalAction,
  AgentHarnessFacet,
  AgentLoopPolicy,
  AgentRuntimeAdapter,
  AgentRuntimeResult,
  AgentSimulation,
  AgentTraceStep,
  ArchitectureEdge,
  ArchitectureNode,
  RemediationPlan,
} from "./agent-types";

const nodes: readonly ArchitectureNode[] = [
  {
    id: "incident-channel",
    label: "ChatOps + monitoring",
    shortLabel: "Incident alert",
    description: "Receives the operational alert and carries the final status back to the operator.",
    zone: "entry",
    kind: "channel",
    accent: "input",
    firstTraceStep: 5,
    learning: {
      purpose: "Turn an operational signal into a bounded incident request and return verified status to the operator.",
      stateAndAuthority: "Carries messages only; it owns neither workflow state nor permission to change the service.",
      designRationale: "Separating the communication channel from the agent runtime keeps alerts and operator updates auditable.",
      risk: "Noisy or unvalidated alerts can select the wrong workflow or expose sensitive operational context.",
    },
  },
  {
    id: "human-approver",
    label: "Human approver",
    shortLabel: "Approver",
    description: "Owns authority for service-capacity changes and restarts.",
    zone: "governance",
    kind: "approval",
    accent: "input",
    firstTraceStep: 27,
    learning: {
      purpose: "Review the evidence-backed action set and grant, revise, or deny authority for write operations.",
      stateAndAuthority: "Owns the final decision; the agent may propose actions but cannot manufacture this authority.",
      designRationale: "A human boundary is appropriate where remediation changes production capacity or restarts instances.",
      risk: "Vague approval scopes can unintentionally authorize actions beyond the reviewed plan.",
    },
  },
  {
    id: "input-gateway",
    label: "Agent gateway + input hooks",
    shortLabel: "Gateway",
    description: "Validates, classifies, decomposes, authorizes, and routes the request.",
    zone: "runtime",
    kind: "gateway",
    accent: "retrieval",
    firstTraceStep: 6,
    learning: {
      purpose: "Validate the request, enforce input policy, classify the incident, and admit it to the correct workflow.",
      stateAndAuthority: "Owns authorization and routing state; it passes only approved context into orchestration.",
      designRationale: "A single controlled entry point prevents every model and specialist from reimplementing security policy.",
      risk: "A permissive gateway can propagate prompt injection, excessive data, or an incorrectly authorized task.",
    },
  },
  {
    id: "orchestrator",
    label: "Coordinator loop",
    shortLabel: "Orchestrator",
    description: "Owns workflow state and repeats model, tool, and verification steps until return.",
    zone: "runtime",
    kind: "orchestrator",
    accent: "generation",
    firstTraceStep: 1,
    learning: {
      purpose: "Coordinate model calls, specialist tasks, tool observations, retries, approvals, and final return.",
      stateAndAuthority: "Owns workflow progress through gateway-managed state; model endpoints remain stateless advisers.",
      designRationale: "A Router selects the bounded workflow, while a DAG exposes parallel investigations and explicit dependencies.",
      risk: "An unbounded loop or overly privileged coordinator can amplify failures across every connected system.",
    },
  },
  {
    id: "session-context",
    label: "Session context",
    shortLabel: "Session",
    description: "In-memory working state for this incident run.",
    zone: "context",
    kind: "memory",
    accent: "evidence",
    firstTraceStep: 7,
    learning: {
      purpose: "Hold the working facts, constraints, task graph, evidence references, and unresolved branches for this run.",
      stateAndAuthority: "Gateway-owned and session-scoped; it is not hidden state inside an LLM endpoint.",
      designRationale: "Explicit session state makes retries, pauses, handoffs, and human review reproducible.",
      risk: "Unbounded or stale context can crowd out current constraints and cause evidence to be misapplied.",
    },
  },
  {
    id: "global-memory",
    label: "Gateway-owned memory",
    shortLabel: "Global memory",
    description: "Persistent verified incident outcomes owned outside the model.",
    zone: "context",
    kind: "memory",
    accent: "evidence",
    firstTraceStep: 2,
    learning: {
      purpose: "Recall and persist only verified outcomes that are useful across incident runs.",
      stateAndAuthority: "Gateway-owned persistent state; writes occur only after outcome verification.",
      designRationale: "Keeping memory outside the model makes retention, deletion, provenance, and access policy enforceable.",
      risk: "Persisting an unverified diagnosis can bias future incidents and turn one mistake into a repeated failure.",
    },
  },
  {
    id: "skills-library",
    label: "CloudOps skills",
    shortLabel: "Skills",
    description: "Prompt templates and procedures loaded before a model call.",
    zone: "context",
    kind: "skill",
    accent: "generation",
    firstTraceStep: 7,
    learning: {
      purpose: "Provide reusable incident, evidence, remediation, and communication procedures before model calls.",
      stateAndAuthority: "Versioned runtime guidance; skills shape behavior but do not grant tool permission.",
      designRationale: "Separating procedures from prompts makes operational knowledge reviewable and reusable across agents.",
      risk: "Outdated skills can encode obsolete runbooks or unsafe remediation assumptions.",
    },
  },
  {
    id: "context-compactor",
    label: "Context compactor",
    shortLabel: "Compactor",
    description: "Summarizes older messages at 75% utilization while preserving evidence and open work.",
    zone: "context",
    kind: "compactor",
    accent: "evidence",
    firstTraceStep: 9,
    learning: {
      purpose: "Reduce older context while preserving constraints, evidence locators, decisions, and unfinished work.",
      stateAndAuthority: "Transforms session context under gateway policy and cannot discard protected facts.",
      designRationale: "Deliberate compaction keeps long-running workflows inside model limits without silently losing control state.",
      risk: "Poor summaries can erase exceptions, provenance, or an unresolved failure branch.",
    },
  },
  {
    id: "remote-llm",
    label: "Remote LLM",
    shortLabel: "Remote model",
    description: "Stateless endpoint used for general planning and synthesis.",
    zone: "models",
    kind: "model",
    accent: "generation",
    firstTraceStep: 8,
    learning: {
      purpose: "Support general planning, decomposition, and synthesis with explicitly assembled context.",
      stateAndAuthority: "Stateless remote endpoint; it receives a request and returns a response or tool intent.",
      designRationale: "Remote capacity is used where the approved data boundary allows broader reasoning workloads.",
      risk: "Sending sensitive or unnecessary context across the boundary can violate data policy.",
    },
  },
  {
    id: "local-llm",
    label: "Local LLM",
    shortLabel: "Local model",
    description: "Stateless local endpoint used for sensitive log summarization.",
    zone: "models",
    kind: "model",
    accent: "generation",
    firstTraceStep: 8,
    learning: {
      purpose: "Summarize sensitive operational logs inside the controlled environment.",
      stateAndAuthority: "Stateless local endpoint with no ownership of session memory or tool authorization.",
      designRationale: "Model placement follows the data boundary instead of forcing every task through one endpoint.",
      risk: "A weaker local model may omit signals, so its output still requires evidence and quality checks.",
    },
  },
  {
    id: "metrics-agent",
    label: "Metrics Investigator",
    shortLabel: "Metrics Agent",
    description: "Tests the saturation hypothesis against time-series evidence.",
    zone: "agents",
    kind: "agent",
    accent: "retrieval",
    firstTraceStep: 12,
    learning: {
      purpose: "Test the capacity-saturation hypothesis against time-series telemetry.",
      stateAndAuthority: "Owns bounded working memory for its task and has read-only access to Metrics MCP.",
      designRationale: "A dedicated investigator produces a small, typed observation instead of flooding the coordinator with raw series.",
      risk: "The wrong window or baseline can make normal traffic variation look like a production fault.",
    },
  },
  {
    id: "logs-agent",
    label: "Log Investigator",
    shortLabel: "Log Agent",
    description: "Searches operational logs within a bounded, read-only scope.",
    zone: "agents",
    kind: "agent",
    accent: "retrieval",
    firstTraceStep: 12,
    learning: {
      purpose: "Find the operational failure signature inside authorized log fields and time ranges.",
      stateAndAuthority: "Owns only its task memory and read-only Logs MCP scope; sensitive summarization stays local.",
      designRationale: "Isolating log work allows narrow retries without repeating successful branches.",
      risk: "Broad searches can time out, over-collect data, or return misleading coincidental errors.",
    },
  },
  {
    id: "runbook-agent",
    label: "Runbook Researcher",
    shortLabel: "Runbook Agent",
    description: "Retrieves grounded operational procedures from the knowledge base.",
    zone: "agents",
    kind: "agent",
    accent: "evidence",
    firstTraceStep: 12,
    learning: {
      purpose: "Retrieve grounded operational guidance with source locators from the approved knowledge base.",
      stateAndAuthority: "Owns query and citation working state; it can read approved documents but cannot change them.",
      designRationale: "A specialist can evaluate retrieval quality and hand back evidence rather than an unsupported recommendation.",
      risk: "A semantically similar but outdated runbook can be confidently irrelevant unless provenance is checked.",
    },
  },
  {
    id: "remediation-agent",
    label: "Remediation Planner",
    shortLabel: "Remediation",
    description: "Builds an action plan only after its evidence dependencies complete.",
    zone: "agents",
    kind: "agent",
    accent: "generation",
    firstTraceStep: 12,
    learning: {
      purpose: "Join completed evidence into a bounded remediation proposal with risk, rollback, and verification.",
      stateAndAuthority: "May draft actions but receives no write authority until the human-approved boundary is crossed.",
      designRationale: "The DAG blocks remediation until required evidence tasks have produced structured observations.",
      risk: "Acting on partial evidence can treat a symptom while worsening the underlying incident.",
    },
  },
  {
    id: "metrics-mcp",
    label: "Metrics MCP",
    shortLabel: "Metrics MCP",
    description: "Read-only observability tools for latency, errors, traffic, and saturation.",
    zone: "tools",
    kind: "mcp",
    accent: "retrieval",
    firstTraceStep: 15,
    learning: {
      purpose: "Expose incident-scoped telemetry queries for latency, errors, traffic, saturation, and recovery.",
      stateAndAuthority: "Read-only server with an incident-scoped observability token.",
      designRationale: "MCP makes tool names, arguments, authorization, and returned observations explicit at the boundary.",
      risk: "Expensive or poorly bounded queries can overload observability systems and delay diagnosis.",
    },
  },
  {
    id: "logs-mcp",
    label: "Logs MCP",
    shortLabel: "Logs MCP",
    description: "Read-only log query tools with bounded time windows and field access.",
    zone: "tools",
    kind: "mcp",
    accent: "retrieval",
    firstTraceStep: 16,
    learning: {
      purpose: "Expose bounded search and aggregation over approved operational log fields.",
      stateAndAuthority: "Read-only server enforcing service, time-window, and field-level policy.",
      designRationale: "A tool boundary lets the runtime narrow and retry queries without giving the model direct log access.",
      risk: "Overly broad queries can time out or reveal sensitive fields outside the incident scope.",
    },
  },
  {
    id: "knowledge-rag",
    label: "Knowledge MCP + RAG",
    shortLabel: "Knowledge RAG",
    description: "Retrieves cited runbook passages from an embedded document index.",
    zone: "tools",
    kind: "rag",
    accent: "evidence",
    firstTraceStep: 17,
    learning: {
      purpose: "Retrieve runbook passages and expose their citations from an embedded operations collection.",
      stateAndAuthority: "Read-only retrieval layer; source documents and index policy remain externally governed.",
      designRationale: "RAG grounds operational advice in inspectable knowledge rather than relying on model recall.",
      risk: "Weak retrieval, stale indexing, or missing citations can make a plausible answer unsafe to follow.",
    },
  },
  {
    id: "cloud-control-mcp",
    label: "Cloud Control MCP",
    shortLabel: "Cloud Control",
    description: "Write-capable capacity and restart tools guarded by explicit approval.",
    zone: "tools",
    kind: "mcp",
    accent: "input",
    firstTraceStep: 30,
    learning: {
      purpose: "Execute capacity and rolling-restart operations after all policy and approval conditions pass.",
      stateAndAuthority: "Write-capable MCP server gated by an exact approved action set, arguments, rollback, and verification window.",
      designRationale: "Keeping writes behind a separate server makes the dangerous boundary visible and enforceable.",
      risk: "A broad token or mismatched arguments can turn a safe proposal into an excessive production change.",
    },
  },
  {
    id: "output-hooks",
    label: "Output hooks + evaluator",
    shortLabel: "Quality gate",
    description: "Redacts, transforms, grounds, and evaluates the recommendation before return.",
    zone: "governance",
    kind: "hook",
    accent: "evidence",
    firstTraceStep: 25,
    learning: {
      purpose: "Redact secrets, normalize observations, verify citations, and evaluate recommendation quality before return.",
      stateAndAuthority: "May reject or recall an output but cannot approve or execute a production action.",
      designRationale: "Post-processing policy is deterministic and independently testable instead of being left to prompt compliance.",
      risk: "A shallow evaluator can accept unsupported advice or remove evidence needed for human review.",
    },
  },
  {
    id: "verified-outcome",
    label: "Verified outcome",
    shortLabel: "Outcome",
    description: "The observed result that may be returned and persisted after verification.",
    zone: "governance",
    kind: "outcome",
    accent: "evidence",
    firstTraceStep: 31,
    learning: {
      purpose: "Represent measured service recovery after the approved action completes.",
      stateAndAuthority: "Becomes persistable only after verification checks pass; it is evidence, not a model assertion.",
      designRationale: "Closing the loop on observed outcomes prevents execution success from being confused with incident recovery.",
      risk: "A short or incomplete verification window can hide regressions and create false confidence.",
    },
  },
];

const edges: readonly ArchitectureEdge[] = [
  { id: "alert-to-gateway", sourceId: "incident-channel", targetId: "input-gateway", label: "alert", kind: "request", firstTraceStep: 5 },
  { id: "gateway-to-orchestrator", sourceId: "input-gateway", targetId: "orchestrator", label: "validated task", kind: "request", firstTraceStep: 6 },
  { id: "orchestrator-to-session", sourceId: "orchestrator", targetId: "session-context", label: "working state", kind: "context", firstTraceStep: 7 },
  { id: "global-to-session", sourceId: "global-memory", targetId: "session-context", label: "recall", kind: "memory", firstTraceStep: 7 },
  { id: "skills-to-orchestrator", sourceId: "skills-library", targetId: "orchestrator", label: "skills", kind: "context", firstTraceStep: 7 },
  { id: "session-to-compactor", sourceId: "session-context", targetId: "context-compactor", label: "token budget", kind: "context", firstTraceStep: 9 },
  { id: "orchestrator-to-remote", sourceId: "orchestrator", targetId: "remote-llm", label: "general context", kind: "model", firstTraceStep: 8 },
  { id: "orchestrator-to-local", sourceId: "orchestrator", targetId: "local-llm", label: "sensitive context", kind: "model", firstTraceStep: 8 },
  { id: "orchestrator-to-metrics-agent", sourceId: "orchestrator", targetId: "metrics-agent", label: "metrics task", kind: "handoff", firstTraceStep: 12 },
  { id: "orchestrator-to-logs-agent", sourceId: "orchestrator", targetId: "logs-agent", label: "logs task", kind: "handoff", firstTraceStep: 12 },
  { id: "orchestrator-to-runbook-agent", sourceId: "orchestrator", targetId: "runbook-agent", label: "runbook task", kind: "handoff", firstTraceStep: 12 },
  { id: "agents-to-remediation", sourceId: "runbook-agent", targetId: "remediation-agent", label: "evidence handoff", kind: "handoff", firstTraceStep: 13 },
  { id: "metrics-agent-to-mcp", sourceId: "metrics-agent", targetId: "metrics-mcp", label: "query", kind: "tool", firstTraceStep: 15 },
  { id: "logs-agent-to-mcp", sourceId: "logs-agent", targetId: "logs-mcp", label: "query", kind: "tool", firstTraceStep: 16 },
  { id: "runbook-agent-to-rag", sourceId: "runbook-agent", targetId: "knowledge-rag", label: "retrieve", kind: "tool", firstTraceStep: 17 },
  { id: "remediation-to-output", sourceId: "remediation-agent", targetId: "output-hooks", label: "proposal", kind: "request", firstTraceStep: 25 },
  { id: "output-to-approval", sourceId: "output-hooks", targetId: "human-approver", label: "verified plan", kind: "approval", firstTraceStep: 26 },
  { id: "approval-to-cloud", sourceId: "human-approver", targetId: "cloud-control-mcp", label: "approved action", kind: "approval", firstTraceStep: 30 },
  { id: "cloud-to-outcome", sourceId: "cloud-control-mcp", targetId: "verified-outcome", label: "action result", kind: "tool", firstTraceStep: 31 },
  { id: "outcome-to-memory", sourceId: "verified-outcome", targetId: "global-memory", label: "verified write", kind: "memory", firstTraceStep: 32 },
];

const allNodeIds = nodes.map((node) => node.id);
const allEdgeIds = edges.map((edge) => edge.id);

const trace: readonly AgentTraceStep[] = [
  { number: 1, eventKind: "map-system", label: "Map the harness", packet: "legible + enforceable environment", nodeIds: allNodeIds, edgeIds: allEdgeIds, loopStage: "decide", loopPass: "system-framing" },
  { number: 2, eventKind: "show-state-ownership", label: "Locate state ownership", packet: "gateway-owned state", nodeIds: ["orchestrator", "session-context", "global-memory", "remote-llm", "local-llm"], edgeIds: ["orchestrator-to-session", "global-to-session", "orchestrator-to-remote", "orchestrator-to-local"], loopStage: "observe", loopPass: "system-framing" },
  { number: 3, eventKind: "show-engineered-loop", label: "Expose the control loop", packet: "observe → decide → act → evaluate → adapt / exit", nodeIds: ["orchestrator", "session-context", "output-hooks", "human-approver", "verified-outcome"], edgeIds: ["orchestrator-to-session", "remediation-to-output", "output-to-approval", "cloud-to-outcome", "outcome-to-memory"], loopStage: "decide", loopPass: "system-framing" },
  { number: 4, eventKind: "show-trace-contract", label: "Expose boundary contracts", packet: "typed request + observation", nodeIds: ["incident-channel", "input-gateway", "orchestrator", "output-hooks", "human-approver"], edgeIds: ["alert-to-gateway", "gateway-to-orchestrator", "output-to-approval"], loopStage: "evaluate", loopPass: "system-framing" },
  { number: 5, eventKind: "receive-incident", label: "Receive SEV-2 alert", packet: "p95 2.8s · errors 8.4%", nodeIds: ["incident-channel"], edgeIds: ["alert-to-gateway"], loopStage: "observe", loopPass: "investigation-1" },
  { number: 6, eventKind: "run-input-hooks", label: "Validate and authorize", packet: "safe · authorized · policy match", nodeIds: ["input-gateway"], edgeIds: ["gateway-to-orchestrator"], loopStage: "evaluate", loopPass: "investigation-1" },
  { number: 7, eventKind: "assemble-context", label: "Assemble bounded context", packet: "alert + memory + skills", nodeIds: ["orchestrator", "session-context", "global-memory", "skills-library"], edgeIds: ["orchestrator-to-session", "global-to-session", "skills-to-orchestrator"], loopStage: "observe", loopPass: "investigation-1" },
  { number: 8, eventKind: "select-model", label: "Select the model boundary", packet: "remote planning · local logs", nodeIds: ["orchestrator", "remote-llm", "local-llm"], edgeIds: ["orchestrator-to-remote", "orchestrator-to-local"], loopStage: "decide", loopPass: "investigation-1" },
  { number: 9, eventKind: "compact-context", label: "Compact at 75%", packet: "summary + evidence refs", nodeIds: ["session-context", "context-compactor"], edgeIds: ["session-to-compactor"], loopStage: "adapt-exit", loopPass: "investigation-1" },
  { number: 10, eventKind: "classify-incident", label: "Classify workflow", packet: "SEV-2 performance incident", nodeIds: ["input-gateway", "orchestrator"], edgeIds: ["gateway-to-orchestrator"], loopStage: "decide", loopPass: "investigation-1" },
  { number: 11, eventKind: "decompose-dag", label: "Build the DAG", packet: "3 parallel · 1 dependent", nodeIds: ["orchestrator", "metrics-agent", "logs-agent", "runbook-agent", "remediation-agent"], edgeIds: ["orchestrator-to-metrics-agent", "orchestrator-to-logs-agent", "orchestrator-to-runbook-agent", "agents-to-remediation"], loopStage: "decide", loopPass: "investigation-1" },
  { number: 12, eventKind: "dispatch-specialists", label: "Dispatch bounded work", packet: "role + skills + tools + schema", nodeIds: ["orchestrator", "metrics-agent", "logs-agent", "runbook-agent", "remediation-agent"], edgeIds: ["orchestrator-to-metrics-agent", "orchestrator-to-logs-agent", "orchestrator-to-runbook-agent"], loopStage: "act", loopPass: "investigation-1" },
  { number: 13, eventKind: "establish-handoffs", label: "Define handoff contracts", packet: "facts + provenance", nodeIds: ["metrics-agent", "logs-agent", "runbook-agent", "remediation-agent"], edgeIds: ["agents-to-remediation"], loopStage: "decide", loopPass: "investigation-1" },
  { number: 14, eventKind: "query-metrics", label: "Open metrics branch", packet: "read-only metrics scope", nodeIds: ["metrics-agent", "metrics-mcp"], edgeIds: ["metrics-agent-to-mcp"], loopStage: "act", loopPass: "investigation-1" },
  { number: 15, eventKind: "query-logs", label: "Open logs branch", packet: "local summarization path", nodeIds: ["logs-agent", "logs-mcp", "local-llm"], edgeIds: ["logs-agent-to-mcp", "orchestrator-to-local"], loopStage: "act", loopPass: "investigation-1" },
  { number: 16, eventKind: "retrieve-runbook", label: "Retrieve cited runbook", packet: "KB-17 §4.2", nodeIds: ["runbook-agent", "knowledge-rag"], edgeIds: ["runbook-agent-to-rag"], loopStage: "act", loopPass: "investigation-1" },
  { number: 17, eventKind: "share-observations", label: "Share structured observations", packet: "owner + source + status", nodeIds: ["metrics-agent", "logs-agent", "runbook-agent", "orchestrator"], edgeIds: ["orchestrator-to-metrics-agent", "orchestrator-to-logs-agent", "orchestrator-to-runbook-agent"], loopStage: "observe", loopPass: "investigation-1" },
  { number: 18, eventKind: "block-remediation", label: "Keep remediation blocked", packet: "missing logs evidence", nodeIds: ["orchestrator", "session-context"], edgeIds: [], loopStage: "evaluate", loopPass: "investigation-1" },
  { number: 19, eventKind: "run-broad-log-query", label: "Run attempt 1", packet: "attempt 1 · 2h query · awaiting result", nodeIds: ["logs-agent", "logs-mcp", "local-llm"], edgeIds: ["logs-agent-to-mcp", "orchestrator-to-local"], loopStage: "act", loopPass: "investigation-1" },
  { number: 20, eventKind: "detect-tool-failure", label: "End failed attempt 1", packet: "attempt 1 · timeout · no result", nodeIds: ["logs-agent", "logs-mcp"], edgeIds: ["logs-agent-to-mcp"], loopStage: "evaluate", loopPass: "investigation-1", state: "failed" },
  { number: 21, eventKind: "preserve-completed-work", label: "Adapt without losing evidence", packet: "metrics + runbook retained", nodeIds: ["metrics-agent", "runbook-agent", "orchestrator"], edgeIds: ["metrics-agent-to-mcp", "runbook-agent-to-rag"], loopStage: "adapt-exit", loopPass: "investigation-1" },
  { number: 22, eventKind: "retry-narrow-query", label: "Run separate attempt 2", packet: "new call · attempt 2 · 15m window · awaiting result", nodeIds: ["logs-agent", "logs-mcp", "local-llm"], edgeIds: ["logs-agent-to-mcp", "orchestrator-to-local"], loopStage: "act", loopPass: "investigation-2", state: "retry" },
  { number: 23, eventKind: "complete-log-retry", label: "Complete attempt 2", packet: "attempt 2 · result returned · evidence recorded", nodeIds: ["logs-agent", "logs-mcp", "local-llm"], edgeIds: ["logs-agent-to-mcp", "orchestrator-to-local"], loopStage: "evaluate", loopPass: "investigation-2", state: "recovered" },
  { number: 24, eventKind: "reconcile-evidence", label: "Reconcile diagnosis", packet: "saturation + logs + runbook", nodeIds: ["orchestrator", "metrics-agent", "logs-agent", "runbook-agent", "remediation-agent"], edgeIds: ["agents-to-remediation"], loopStage: "evaluate", loopPass: "investigation-2" },
  { number: 25, eventKind: "evaluate-output", label: "Run output quality gate", packet: "redacted · cited · supported", nodeIds: ["remediation-agent", "output-hooks"], edgeIds: ["remediation-to-output"], loopStage: "evaluate", loopPass: "investigation-2" },
  { number: 26, eventKind: "assemble-remediation", label: "Prepare action proposal", packet: "scale 6→10 + restart 1", nodeIds: ["remediation-agent", "output-hooks", "human-approver"], edgeIds: ["remediation-to-output", "output-to-approval"], loopStage: "decide", loopPass: "remediation" },
  { number: 27, eventKind: "await-approval", label: "Wait at write boundary", packet: "human authority required", nodeIds: ["human-approver", "cloud-control-mcp"], edgeIds: ["output-to-approval"], loopStage: "adapt-exit", loopPass: "remediation" },
  { number: 28, eventKind: "revise-remediation", label: "Build safer revision", packet: "scale 6→8 + rolling canary", nodeIds: ["human-approver", "remediation-agent", "output-hooks"], edgeIds: ["remediation-to-output", "output-to-approval"], loopStage: "adapt-exit", loopPass: "remediation" },
  { number: 29, eventKind: "await-reapproval", label: "Request authority again", packet: "revised actions · revised risk", nodeIds: ["human-approver", "cloud-control-mcp"], edgeIds: ["output-to-approval"], loopStage: "adapt-exit", loopPass: "remediation" },
  { number: 30, eventKind: "execute-decision", label: "Honor the decision", packet: "approved actions only", nodeIds: ["human-approver", "cloud-control-mcp"], edgeIds: ["approval-to-cloud"], loopStage: "act", loopPass: "remediation" },
  { number: 31, eventKind: "verify-recovery", label: "Verify service recovery", packet: "p95 420ms · errors 0.7%", nodeIds: ["cloud-control-mcp", "metrics-mcp", "verified-outcome"], edgeIds: ["cloud-to-outcome", "metrics-agent-to-mcp"], loopStage: "evaluate", loopPass: "remediation" },
  { number: 32, eventKind: "persist-outcome", label: "Write verified memory", packet: "decision + evidence + outcome", nodeIds: ["verified-outcome", "global-memory", "incident-channel"], edgeIds: ["outcome-to-memory"], loopStage: "adapt-exit", loopPass: "remediation" },
];

const harnessFacets: readonly AgentHarnessFacet[] = [
  {
    id: "intent-skills",
    label: "Intent & skills",
    summary: "Goal contracts, workflow selection, and versioned CloudOps procedures.",
    nodeIds: ["incident-channel", "input-gateway", "orchestrator", "skills-library"],
  },
  {
    id: "context-memory",
    label: "Context & memory",
    summary: "Session state, verified memory, provenance, and token-budget compaction.",
    nodeIds: ["session-context", "global-memory", "context-compactor"],
  },
  {
    id: "tools-isolation",
    label: "Tools & isolation",
    summary: "Typed model and MCP boundaries selected by data location and task scope.",
    nodeIds: ["remote-llm", "local-llm", "metrics-mcp", "logs-mcp", "knowledge-rag", "cloud-control-mcp"],
  },
  {
    id: "policy-authority",
    label: "Policy & authority",
    summary: "Input, action, and output policy with an exact human-controlled write boundary.",
    nodeIds: ["input-gateway", "output-hooks", "human-approver", "cloud-control-mcp"],
  },
  {
    id: "trace-evaluation",
    label: "Trace & evaluation",
    summary: "Structured observations, quality gates, recovery checks, and verified outcomes.",
    nodeIds: ["orchestrator", "output-hooks", "metrics-mcp", "verified-outcome"],
  },
];

const loopPolicy: AgentLoopPolicy = {
  objective: "Restore checkout service health using cited evidence and only explicitly authorized production actions.",
  stages: [
    { id: "observe", label: "Observe", purpose: "Read the signal, state, and tool observations without inventing missing evidence." },
    { id: "decide", label: "Decide", purpose: "Choose a bounded workflow, dependency, model, or next action from explicit state." },
    { id: "act", label: "Act", purpose: "Run a scoped handoff, read call, or approved write through a typed boundary." },
    { id: "evaluate", label: "Evaluate", purpose: "Check the returned result, evidence, authorization, and completion criteria." },
    { id: "adapt-exit", label: "Adapt / exit", purpose: "Preserve work, retry within budget, wait for a human, escalate, or finish." },
  ],
  retryBudget: "One separate narrowed Logs MCP attempt after the original call ends in failure.",
  completionCriteria: [
    "Metrics, logs, and cited runbook evidence agree",
    "Every write matches an exact human-approved action",
    "Observed p95 latency reaches 420ms and errors fall below 0.7%",
  ],
  stopConditions: [
    "Stop the failed call immediately when its 8-second timeout is observed",
    "Escalate with remediation blocked if the one-call retry budget is exhausted",
    "Wait at every write boundary until the human approves, revises, or stops",
    "Persist only a verified recovery or an explicit no-action human decision",
  ],
};

const primaryPlan: RemediationPlan = {
  id: "primary",
  title: "Restore capacity now",
  summary: "Scale the checkout worker pool and replace the unhealthy instance.",
  actions: [
    "Scale workers from 6 to 10",
    "Restart one unhealthy checkout instance",
    "Rollback if errors rise above 2%",
  ],
  risk: "Moderate · one coordinated write window",
  verificationWindow: "Observe p95 latency and errors for 5 minutes",
};

const saferPlan: RemediationPlan = {
  id: "safer",
  title: "Use a rolling canary",
  summary: "Increase capacity in a smaller step and restart one instance at a time.",
  actions: [
    "Scale workers from 6 to 8",
    "Restart one instance, then verify",
    "Continue only while p95 and errors improve",
  ],
  risk: "Low · bounded canary with an automatic stop",
  verificationWindow: "Evaluate after every instance for 5 minutes",
};

function getExternalActions(
  approvalState: AgentApprovalState,
): readonly AgentExternalAction[] {
  if (approvalState === "approved-primary") {
    return [
      { id: "scale-primary", label: "Scale checkout workers from 6 to 10", status: "simulated-complete" },
      { id: "restart-primary", label: "Restart one unhealthy instance", status: "simulated-complete" },
    ];
  }

  if (approvalState === "approved-safer") {
    return [
      { id: "scale-canary", label: "Scale checkout workers from 6 to 8", status: "simulated-complete" },
      { id: "restart-canary", label: "Restart one canary instance", status: "simulated-complete" },
    ];
  }

  return [];
}

export function simulateAgentOrchestration(
  approvalState: AgentApprovalState = "pending-primary",
): AgentRuntimeResult {
  const hasTerminalDecision =
    approvalState === "approved-primary" ||
    approvalState === "approved-safer" ||
    approvalState === "stopped" ||
    approvalState === "stopped-safer";

  const simulation: AgentSimulation = {
    incident: {
      id: "checkout-latency",
      title: "Checkout API latency incident",
      alert: "Sustained checkout degradation for 6 minutes",
      service: "checkout-api",
      severity: "SEV-2",
      metrics: [
        { label: "p95 latency", value: "2.8s" },
        { label: "Error rate", value: "8.4%" },
        { label: "Worker saturation", value: "94%" },
      ],
    },
    nodes,
    edges,
    trace,
    models: [
      { id: "remote-llm", label: "Remote LLM", location: "remote", stateless: true, purpose: "Planning, decomposition, and synthesis with approved context" },
      { id: "local-llm", label: "Local LLM", location: "local", stateless: true, purpose: "Sensitive log summarization inside the controlled boundary" },
    ],
    skills: [
      { id: "incident-triage", label: "Incident triage", purpose: "Severity classification and initial task graph" },
      { id: "source-evaluation", label: "Source evaluation", purpose: "Provenance and evidence-quality checks" },
      { id: "safe-remediation", label: "Safe remediation", purpose: "Risk, rollback, canary, and verification policy" },
      { id: "status-writing", label: "Status writing", purpose: "Concise operator-facing incident updates" },
    ],
    agents: [
      { id: "metrics-agent", name: "Metrics Investigator", role: "Confirm saturation and measure recovery", accent: "retrieval", modelEndpointId: "remote-llm", skillIds: ["incident-triage", "source-evaluation"], workingMemory: "Time range, metric series, and saturation hypothesis", toolServerIds: ["metrics-mcp"] },
      { id: "logs-agent", name: "Log Investigator", role: "Find the operational failure signature", accent: "retrieval", modelEndpointId: "local-llm", skillIds: ["source-evaluation"], workingMemory: "Authorized fields, query window, and recovered excerpts", toolServerIds: ["logs-mcp"] },
      { id: "runbook-agent", name: "Runbook Researcher", role: "Retrieve cited operational guidance", accent: "evidence", modelEndpointId: "remote-llm", skillIds: ["source-evaluation"], workingMemory: "Query, cited passages, and document locators", toolServerIds: ["knowledge-rag"] },
      { id: "remediation-agent", name: "Remediation Planner", role: "Join evidence into a controlled action plan", accent: "generation", modelEndpointId: "remote-llm", skillIds: ["safe-remediation", "status-writing"], workingMemory: "Diagnosis, dependencies, risk, approval, and verification", toolServerIds: ["cloud-control-mcp"] },
    ],
    tasks: [
      { id: "inspect-metrics", title: "Inspect service metrics", ownerId: "metrics-agent", dependsOn: [], status: "complete" },
      { id: "inspect-logs", title: "Find failure signature", ownerId: "logs-agent", dependsOn: [], status: "recovered" },
      { id: "retrieve-runbook", title: "Retrieve recovery runbook", ownerId: "runbook-agent", dependsOn: [], status: "complete" },
      { id: "draft-remediation", title: "Draft verified remediation", ownerId: "remediation-agent", dependsOn: ["inspect-metrics", "inspect-logs", "retrieve-runbook"], status: "complete" },
    ],
    mcpServers: [
      { id: "metrics-mcp", label: "Metrics MCP", access: "read", tools: ["query_timeseries", "compare_baseline", "watch_recovery"], authorization: "Incident-scoped observability token" },
      { id: "logs-mcp", label: "Logs MCP", access: "read", tools: ["search_logs", "aggregate_signature"], authorization: "Read-only service and time-window policy" },
      { id: "knowledge-rag", label: "Knowledge MCP + RAG", access: "read", tools: ["retrieve_runbook", "open_citation"], authorization: "Approved operations document collection" },
      { id: "cloud-control-mcp", label: "Cloud Control MCP", access: "read-write", tools: ["scale_service", "rolling_restart", "read_deployment"], authorization: "Human approval plus bounded action policy" },
    ],
    observations: [
      { id: "metrics-saturation", ownerId: "metrics-agent", serverId: "metrics-mcp", input: "checkout-api, last 30m, latency/errors/saturation", output: "Worker saturation reached 94%; traffic rose 31%", provenance: "Metrics series M-204 · 10s resolution", status: "success" },
      { id: "logs-timeout", ownerId: "logs-agent", serverId: "logs-mcp", input: "checkout-api, last 2h, all fields", output: "Query timed out after 8 seconds", provenance: "Logs request L-881", status: "failed" },
      { id: "logs-recovered", ownerId: "logs-agent", serverId: "logs-mcp", input: "checkout-api, last 15m, worker exhaustion fields", output: "Repeated worker-pool exhaustion before 5xx bursts", provenance: "Logs request L-884 · sensitive fields redacted", status: "recovered" },
      { id: "runbook-retrieval", ownerId: "runbook-agent", serverId: "knowledge-rag", input: "checkout saturation rolling recovery", output: "Scale gradually, restart one instance, verify before continuing", provenance: "Runbook KB-17 §4.2 · similarity 0.91", status: "success" },
    ],
    memoryStores: [
      { id: "session-context", label: "Session context", scope: "session", owner: "gateway", retention: "Current incident only; compacted at 75%", entries: ["SEV-2 checkout alert", "Authorization and policy result", "Task graph and unresolved log branch", "Evidence references and approval state"] },
      { id: "global-memory", label: "Global memory", scope: "global", owner: "gateway", retention: "Verified incident outcomes only", entries: ["Prior checkout saturation resolved with rolling capacity", ...(hasTerminalDecision ? [approvalState === "stopped" || approvalState === "stopped-safer" ? "Human stopped the run; no Cloud Control action occurred" : "Approved remediation restored p95 to 420ms and errors below 0.7%"] : [])] },
    ],
    hooks: [
      { id: "input-hook", label: "Pre-reasoning input hook", phase: "input", checks: ["Safety filtering", "Prompt-injection protection", "Authorization", "Input validation", "Incident policy"] },
      { id: "action-hook", label: "MCP action hook", phase: "action", checks: ["Tool allowlist", "Argument validation", "Read/write scope", "Human authority", "Rollback policy"] },
      { id: "output-hook", label: "Post-process output hook", phase: "output", checks: ["Secret redaction", "Data normalization", "Citation verification", "Quality evaluation", "Recall on failure"] },
    ],
    harnessFacets,
    loopPolicy,
    primaryPlan,
    saferPlan,
    checks: [
      { id: "evidence", label: "Evidence", result: "Metrics + logs + cited runbook", passed: true },
      { id: "authorization", label: "Authorization", result: "Read tools allowed; write tools gated", passed: true },
      { id: "rollback", label: "Rollback", result: "Stop if errors exceed 2%", passed: true },
      { id: "privacy", label: "Data policy", result: "Sensitive log fields redacted", passed: true },
      { id: "quality", label: "Quality", result: "Recommendation supported by sources", passed: true },
    ],
    approvalState,
    externalActions: getExternalActions(approvalState),
  };

  return {
    adapterMode: "simulation",
    generatedAt: "2026-07-15T00:00:00.000Z",
    data: simulation,
  };
}

export const agentSimulationAdapter: AgentRuntimeAdapter = {
  mode: "simulation",
  async run(input, signal) {
    if (signal?.aborted) {
      throw new DOMException("The simulation was cancelled.", "AbortError");
    }

    return Promise.resolve(simulateAgentOrchestration(input.approvalState));
  },
};
