import type { DemoScene, DemoStory } from "../../framework/types";
import type { AgentPhase } from "./agent-routing";
import type { AgentEventKind } from "./agent-types";

const overviewScene: DemoScene<AgentEventKind> = {
  id: "overview",
  act: 1,
  title: "Overview: see the complete agent system",
  shortTitle: "Overview",
  summary: "One map shows the harness around the model and the loop that drives the run.",
  events: [
    {
      id: "overview-map-system",
      kind: "map-system",
      title: "Start with the engineered harness",
      explanation:
        "A production agent is more than a model. Its harness makes intent, context, state, tools, permissions, traces, evaluation, and human authority legible and enforceable.",
      durationMs: 10000,
      easing: "ease-out",
      accent: "generation",
    },
    {
      id: "overview-state-ownership",
      kind: "show-state-ownership",
      title: "The model does not own state",
      explanation:
        "Session context and persistent memory belong to the gateway. Remote and local LLM endpoints receive assembled context for each call.",
      durationMs: 9000,
      easing: "ease-in-out",
      accent: "evidence",
      dependencies: ["overview-map-system"],
    },
    {
      id: "overview-engineered-loop",
      kind: "show-engineered-loop",
      title: "Engineer the loop, not only the prompt",
      explanation:
        "The coordinator observes state, decides the next bounded step, acts through approved tools, evaluates the result, then adapts or exits against explicit rules.",
      durationMs: 10000,
      easing: "ease-in-out",
      accent: "generation",
      dependencies: ["overview-state-ownership"],
    },
    {
      id: "overview-trace-contract",
      kind: "show-trace-contract",
      title: "Every boundary has a contract",
      explanation:
        "Numbered packets make requests, context, handoffs, tool observations, approvals, and memory writes visible without exposing hidden reasoning.",
      durationMs: 10000,
      easing: "ease-out",
      accent: "retrieval",
      dependencies: ["overview-engineered-loop"],
    },
  ],
};

const prepareScene: DemoScene<AgentEventKind> = {
  id: "prepare",
  act: 2,
  title: "Prepare: guard the input and assemble context",
  shortTitle: "Prepare",
  summary: "The runtime validates the incident before a model sees it.",
  events: [
    {
      id: "prepare-receive-incident",
      kind: "receive-incident",
      title: "A checkout alert enters ChatOps",
      explanation:
        "Monitoring reports p95 latency of 2.8 seconds and an 8.4% error rate for the checkout API.",
      durationMs: 14000,
      easing: "ease-out",
      accent: "input",
    },
    {
      id: "prepare-input-hooks",
      kind: "run-input-hooks",
      title: "Input hooks run before orchestration",
      explanation:
        "Safety filtering, injection protection, authorization, input validation, and incident policy checks run before context assembly.",
      durationMs: 15000,
      easing: "ease-in-out",
      accent: "input",
      dependencies: ["prepare-receive-incident"],
    },
    {
      id: "prepare-assemble-context",
      kind: "assemble-context",
      title: "Recall only relevant state",
      explanation:
        "The gateway combines the live alert, session facts, verified incident history, and CloudOps skills into a bounded working context.",
      durationMs: 15000,
      easing: "spring",
      accent: "evidence",
      dependencies: ["prepare-input-hooks"],
    },
    {
      id: "prepare-select-model",
      kind: "select-model",
      title: "Choose a model for the data boundary",
      explanation:
        "General planning can use a remote LLM; sensitive log summarization stays with a local LLM. Both endpoints remain stateless.",
      durationMs: 14000,
      easing: "ease-in-out",
      accent: "generation",
      dependencies: ["prepare-assemble-context"],
    },
    {
      id: "prepare-compact-context",
      kind: "compact-context",
      title: "Compact before the context window fills",
      explanation:
        "At 75% utilization, the runtime summarizes older messages while preserving constraints, evidence references, and unresolved work.",
      durationMs: 14000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["prepare-select-model"],
    },
  ],
};

const routeScene: DemoScene<AgentEventKind> = {
  id: "route",
  act: 3,
  title: "Route: decompose the incident into a graph",
  shortTitle: "Route",
  summary: "The gateway creates bounded work and explicit dependencies.",
  events: [
    {
      id: "route-classify-incident",
      kind: "classify-incident",
      title: "Classify intent and severity",
      explanation:
        "The coordinator identifies a SEV-2 performance incident and selects the CloudOps investigation workflow.",
      durationMs: 15000,
      easing: "ease-out",
      accent: "generation",
    },
    {
      id: "route-decompose-dag",
      kind: "decompose-dag",
      title: "Build a dependency graph",
      explanation:
        "Metrics, logs, and runbook retrieval can start in parallel. Remediation waits for their structured observations.",
      durationMs: 15000,
      easing: "spring",
      accent: "generation",
      dependencies: ["route-classify-incident"],
    },
    {
      id: "route-dispatch-specialists",
      kind: "dispatch-specialists",
      title: "Dispatch specialists with bounded scope",
      explanation:
        "Each agent receives its own role, skills, working memory, model policy, allowed MCP servers, and expected output schema.",
      durationMs: 15000,
      easing: "ease-in-out",
      accent: "retrieval",
      dependencies: ["route-decompose-dag"],
    },
    {
      id: "route-establish-handoffs",
      kind: "establish-handoffs",
      title: "Handoffs carry facts, not hidden thought",
      explanation:
        "Specialists exchange compact observations with provenance. The gateway still owns global state and workflow control.",
      durationMs: 15000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["route-dispatch-specialists"],
    },
  ],
};

const executeScene: DemoScene<AgentEventKind> = {
  id: "execute",
  act: 4,
  title: "Execute: agents use models, MCP, and RAG",
  shortTitle: "Execute",
  summary: "Parallel workers gather evidence through controlled tool hosts.",
  events: [
    {
      id: "execute-query-metrics",
      kind: "query-metrics",
      title: "Metrics confirm capacity saturation",
      explanation:
        "The Metrics Agent reads the observability MCP server and finds worker saturation at 94% after the latest traffic increase.",
      durationMs: 16000,
      easing: "ease-out",
      accent: "retrieval",
    },
    {
      id: "execute-query-logs",
      kind: "query-logs",
      title: "Logs search for the failure signature",
      explanation:
        "The Log Agent sends a read-only query through the Logs MCP server while sensitive excerpts remain on the local model path.",
      durationMs: 16000,
      easing: "ease-in-out",
      accent: "retrieval",
      dependencies: ["execute-query-metrics"],
    },
    {
      id: "execute-retrieve-runbook",
      kind: "retrieve-runbook",
      title: "RAG retrieves the grounded runbook",
      explanation:
        "The Runbook Agent searches embedded operational documents and returns the rolling-capacity procedure with source locators.",
      durationMs: 16000,
      easing: "spring",
      accent: "evidence",
      dependencies: ["execute-query-logs"],
    },
    {
      id: "execute-share-observations",
      kind: "share-observations",
      title: "Observations return with provenance",
      explanation:
        "Each result records its owner, input, source, status, and evidence so the coordinator can reconcile facts safely.",
      durationMs: 16000,
      easing: "ease-in-out",
      accent: "evidence",
      dependencies: ["execute-retrieve-runbook"],
    },
    {
      id: "execute-block-remediation",
      kind: "block-remediation",
      title: "The remediation branch stays blocked",
      explanation:
        "The metrics and runbook branches completed, but the missing log evidence does not satisfy the dependency. No remediation is drafted.",
      durationMs: 16000,
      easing: "ease-out",
      accent: "generation",
      dependencies: ["execute-share-observations"],
    },
  ],
};

const recoverScene: DemoScene<AgentEventKind> = {
  id: "recover",
  act: 5,
  title: "Recover: re-plan one failed branch",
  shortTitle: "Recover",
  summary: "Completed work survives while the log branch retries safely.",
  events: [
    {
      id: "recover-run-broad-query",
      kind: "run-broad-log-query",
      title: "Attempt 1 runs the broad log query",
      explanation:
        "The Logs Agent opens a bounded read-only MCP call. While it is running, no observation exists and no dependent work can advance.",
      durationMs: 12000,
      easing: "linear",
      accent: "retrieval",
    },
    {
      id: "recover-detect-failure",
      kind: "detect-tool-failure",
      title: "Attempt 1 suddenly times out",
      explanation:
        "The failed MCP observation becomes explicit state; the agent does not invent a result or hide the missing evidence.",
      durationMs: 6000,
      easing: "ease-out",
      accent: "input",
      dependencies: ["recover-run-broad-query"],
    },
    {
      id: "recover-preserve-work",
      kind: "preserve-completed-work",
      title: "Preserve completed branches",
      explanation:
        "Verified metrics and runbook evidence stay complete while the coordinator re-plans only the log task.",
      durationMs: 8000,
      easing: "ease-in-out",
      accent: "evidence",
      dependencies: ["recover-detect-failure"],
    },
    {
      id: "recover-retry-query",
      kind: "retry-narrow-query",
      title: "Retry with a narrower authorized query",
      explanation:
        "Attempt 2 is a new MCP call. The Logs Agent reuses authorization, restricts the window to 15 minutes, and waits for separate evidence.",
      durationMs: 14000,
      easing: "spring",
      accent: "retrieval",
      dependencies: ["recover-preserve-work"],
    },
    {
      id: "recover-complete-retry",
      kind: "complete-log-retry",
      title: "Attempt 2 returns usable evidence",
      explanation:
        "The narrower call succeeds and records repeated checkout worker exhaustion. Attempt 1 remains a failed observation in the trace.",
      durationMs: 10000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["recover-retry-query"],
    },
    {
      id: "recover-reconcile-evidence",
      kind: "reconcile-evidence",
      title: "Reconcile all branches",
      explanation:
        "The coordinator joins saturation metrics, recovered logs, and the cited runbook into one evidence-backed diagnosis.",
      durationMs: 12000,
      easing: "ease-in-out",
      accent: "generation",
      dependencies: ["recover-complete-retry"],
    },
    {
      id: "recover-evaluate-output",
      kind: "evaluate-output",
      title: "Draft and quality-check the plan",
      explanation:
        "Only after the separate retry succeeds does the Remediation Agent draft a plan. Output hooks then redact, normalize, and verify its evidence.",
      durationMs: 13000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["recover-reconcile-evidence"],
    },
  ],
};

const governScenes: readonly DemoScene<AgentEventKind>[] = [
  {
    id: "govern-proposal",
    act: 6,
    title: "Govern: require authority before action",
    shortTitle: "Govern",
    summary: "A verified remediation reaches the human control boundary.",
    events: [
      {
        id: "govern-assemble-remediation",
        kind: "assemble-remediation",
        title: "Assemble a controlled remediation",
        explanation:
          "The primary plan scales checkout workers from six to ten and restarts one unhealthy instance, with explicit rollback checks.",
        durationMs: 14000,
        easing: "ease-out",
        accent: "generation",
      },
    ],
  },
  {
    id: "govern-primary-gate",
    act: 6,
    title: "Govern: require authority before action",
    shortTitle: "Govern",
    summary: "Read-only investigation stops at the write boundary.",
    events: [
      {
        id: "govern-await-primary",
        kind: "await-approval",
        title: "Pause before Cloud Control",
        explanation:
          "The system can investigate autonomously, but it cannot change service capacity or restart an instance without explicit approval.",
        durationMs: 12000,
        easing: "ease-out",
        accent: "input",
        dependencies: ["govern-assemble-remediation"],
      },
    ],
  },
  {
    id: "govern-safer-revision",
    act: 6,
    title: "Govern: require authority before action",
    shortTitle: "Govern",
    summary: "Human feedback becomes a bounded safer plan.",
    events: [
      {
        id: "govern-revise-remediation",
        kind: "revise-remediation",
        title: "Create a rolling-canary alternative",
        explanation:
          "The revised plan scales from six to eight, restarts one instance at a time, and checks p95 latency and errors before continuing.",
        durationMs: 16000,
        easing: "spring",
        accent: "generation",
        dependencies: ["govern-await-primary"],
      },
    ],
  },
  {
    id: "govern-safer-gate",
    act: 6,
    title: "Govern: require authority before action",
    shortTitle: "Govern",
    summary: "A revision request is not permission to act.",
    events: [
      {
        id: "govern-await-safer",
        kind: "await-reapproval",
        title: "Ask again before the safer plan runs",
        explanation:
          "The changed action set returns to the human gate with its own risk, verification window, and stop option.",
        durationMs: 12000,
        easing: "ease-out",
        accent: "input",
        dependencies: ["govern-revise-remediation"],
      },
    ],
  },
  {
    id: "govern-outcome",
    act: 6,
    title: "Govern: require authority before action",
    shortTitle: "Govern",
    summary: "The runtime executes, verifies, and remembers only what was authorized.",
    events: [
      {
        id: "govern-execute-decision",
        kind: "execute-decision",
        title: "Honor the human decision exactly",
        explanation:
          "Approved actions execute through the simulated Cloud Control MCP server. A stop decision creates no write calls.",
        durationMs: 15000,
        easing: "ease-out",
        accent: "evidence",
        dependencies: ["govern-assemble-remediation"],
      },
      {
        id: "govern-verify-recovery",
        kind: "verify-recovery",
        title: "Observe the service after action",
        explanation:
          "The Metrics Agent verifies p95 latency at 420 milliseconds and errors below 0.7% before the workflow can close.",
        durationMs: 13000,
        easing: "ease-in-out",
        accent: "evidence",
        dependencies: ["govern-execute-decision"],
      },
      {
        id: "govern-persist-outcome",
        kind: "persist-outcome",
        title: "Persist only the verified outcome",
        explanation:
          "The gateway writes the decision, evidence, action result, and verification to global memory; the stateless LLM stores nothing.",
        durationMs: 12000,
        easing: "ease-out",
        accent: "evidence",
        dependencies: ["govern-verify-recovery"],
      },
    ],
  },
];

export const agentPhaseStories: Readonly<
  Record<AgentPhase, DemoStory<AgentEventKind>>
> = {
  overview: {
    id: "agent-overview",
    title: "Agent Orchestration / Overview",
    scenes: [overviewScene],
  },
  prepare: {
    id: "agent-prepare",
    title: "Agent Orchestration / Prepare",
    scenes: [prepareScene],
  },
  route: {
    id: "agent-route",
    title: "Agent Orchestration / Route",
    scenes: [routeScene],
  },
  execute: {
    id: "agent-execute",
    title: "Agent Orchestration / Execute",
    scenes: [executeScene],
  },
  recover: {
    id: "agent-recover",
    title: "Agent Orchestration / Recover",
    scenes: [recoverScene],
  },
  govern: {
    id: "agent-govern",
    title: "Agent Orchestration / Govern",
    scenes: governScenes,
  },
};

export const agentStory: DemoStory<AgentEventKind> = {
  id: "agent-orchestration-explainer",
  title: "Agent Orchestration",
  scenes: [
    overviewScene,
    prepareScene,
    routeScene,
    executeScene,
    recoverScene,
    ...governScenes,
  ],
};
