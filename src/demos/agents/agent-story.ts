import type { DemoScene, DemoStory } from "../../framework/types";
import type { AgentPhase } from "./agent-routing";
import type { AgentEventKind } from "./agent-types";

const overviewScene: DemoScene<AgentEventKind> = {
  id: "overview",
  act: 1,
  title: "System: see the complete agent architecture",
  shortTitle: "System",
  summary: "Start with stable groups before showing any relationship.",
  events: [
    {
      id: "overview-map-components",
      kind: "map-components",
      title: "Eight groups make the system legible",
      explanation:
        "Input, runtime, context, models, workers, tools, governance, and outcome stay in fixed positions so students can build a reliable mental map.",
      durationMs: 9000,
      easing: "ease-out",
      accent: "retrieval",
    },
    {
      id: "overview-show-harness",
      kind: "show-harness",
      title: "The harness is larger than the model",
      explanation:
        "Application code owns state, routing, tools, permissions, retries, evaluation, and delivery around every stateless model call.",
      durationMs: 12000,
      easing: "ease-in-out",
      accent: "generation",
      dependencies: ["overview-map-components"],
    },
  ],
};

const prepareScene: DemoScene<AgentEventKind> = {
  id: "prepare",
  act: 2,
  title: "Input + context: build a bounded request",
  shortTitle: "Input + context",
  summary: "Admission is linear; state exchange is a loop.",
  events: [
    {
      id: "prepare-accept-input",
      kind: "accept-input",
      title: "Input crosses one controlled boundary",
      explanation:
        "A channel carries the request to the gateway. Validation and authorization happen before the coordinator accepts the task.",
      durationMs: 9000,
      easing: "ease-out",
      accent: "input",
    },
    {
      id: "prepare-assemble-context",
      kind: "assemble-context",
      title: "Runtime and context exchange explicit state",
      explanation:
        "The runtime updates working state and receives an approved context package containing only the facts, memory, and instructions needed now.",
      durationMs: 9000,
      easing: "ease-in-out",
      accent: "evidence",
      dependencies: ["prepare-accept-input"],
    },
  ],
};

const routeScene: DemoScene<AgentEventKind> = {
  id: "route",
  act: 3,
  title: "Models + agents: call, route, and coordinate",
  shortTitle: "Models + agents",
  summary: "Model calls return; workers form a hub-and-spoke graph.",
  events: [
    {
      id: "route-call-model",
      kind: "call-model",
      title: "A model call is a request and return",
      explanation:
        "The runtime supplies context for one call. The stateless model returns a response or tool intent but keeps no run memory or authority.",
      durationMs: 10000,
      easing: "ease-in-out",
      accent: "generation",
    },
    {
      id: "route-delegate-workers",
      kind: "delegate-workers",
      title: "One coordinator fans work out to several workers",
      explanation:
        "Each worker receives a bounded task, scoped context, allowed capabilities, and an expected result schema before returning typed evidence.",
      durationMs: 10000,
      easing: "spring",
      accent: "generation",
      dependencies: ["route-call-model"],
    },
  ],
};

const executeScene: DemoScene<AgentEventKind> = {
  id: "execute",
  act: 4,
  title: "Tools: use typed functions and knowledge",
  shortTitle: "Tools",
  summary: "Tool and retrieval calls use explicit request-return contracts.",
  events: [
    {
      id: "execute-call-function-tool",
      kind: "call-function-tool",
      title: "A worker calls a typed function",
      explanation:
        "Validated arguments cross the tool boundary. A typed result or explicit error returns before the worker can advance.",
      durationMs: 10000,
      easing: "ease-out",
      accent: "retrieval",
    },
    {
      id: "execute-retrieve-knowledge",
      kind: "retrieve-knowledge",
      title: "Retrieval returns evidence with provenance",
      explanation:
        "A retrieval tool returns ranked evidence and source locators. Generation and retrieval remain separate responsibilities.",
      durationMs: 10000,
      easing: "ease-in-out",
      accent: "evidence",
      dependencies: ["execute-call-function-tool"],
    },
  ],
};

const recoverScene: DemoScene<AgentEventKind> = {
  id: "recover",
  act: 5,
  title: "Evaluate + retry: keep attempts separate",
  shortTitle: "Evaluate + retry",
  summary: "A timeout ends one call; a retry starts another.",
  events: [
    {
      id: "recover-start-attempt",
      kind: "start-tool-attempt",
      title: "Attempt 1 starts and waits",
      explanation:
        "While the bounded tool call is running, no result exists and dependent work cannot treat the request as evidence.",
      durationMs: 8000,
      easing: "linear",
      accent: "retrieval",
    },
    {
      id: "recover-record-failure",
      kind: "record-tool-failure",
      title: "Attempt 1 reaches its deadline",
      explanation:
        "The call is recorded as timed out. Its deadline expired with no result, so it cannot be treated as evidence.",
      durationMs: 8000,
      easing: "ease-out",
      accent: "input",
      dependencies: ["recover-start-attempt"],
    },
    {
      id: "recover-retry-tool-call",
      kind: "retry-tool-call",
      title: "Attempt 2 is a new bounded call",
      explanation:
        "The retry has its own identity and may narrow arguments or scope while reusing only approved state and authorization.",
      durationMs: 8000,
      easing: "spring",
      accent: "retrieval",
      dependencies: ["recover-record-failure"],
    },
    {
      id: "recover-accept-result",
      kind: "accept-tool-result",
      title: "Attempt 2 returns a usable result",
      explanation:
        "Only the successful return advances the run. Attempt 1 remains visible as a separate timed-out observation.",
      durationMs: 8000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["recover-retry-tool-call"],
    },
  ],
};

const governScene: DemoScene<AgentEventKind> = {
  id: "govern",
  act: 6,
  title: "Govern + return: control, verify, and publish",
  shortTitle: "Govern + return",
  summary: "Governance can approve, revise, reject, or stop before a verified outcome is distributed.",
  events: [
    {
      id: "govern-review-decision",
      kind: "review-decision",
      title: "Evaluation comes before authority",
      explanation:
        "Policy and output evaluation inspect a scoped proposal. Human approval remains a separate authority boundary for sensitive actions.",
      durationMs: 9000,
      easing: "ease-out",
      accent: "input",
    },
    {
      id: "govern-close-revision-loop",
      kind: "close-revision-loop",
      title: "Revision visibly closes the control cycle",
      explanation:
        "Revision constraints return through runtime to the worker. Approval, revision, rejection, and stop are explicit outcomes rather than model guesses.",
      durationMs: 9000,
      easing: "ease-in-out",
      accent: "generation",
      dependencies: ["govern-review-decision"],
    },
    {
      id: "govern-allow-bounded-action",
      kind: "allow-bounded-action",
      title: "Approved authority follows a one-way path",
      explanation:
        "Only the exact permitted capability and arguments reach a write-capable tool. A stop decision instead records a no-action outcome.",
      durationMs: 9000,
      easing: "ease-out",
      accent: "input",
      dependencies: ["govern-close-revision-loop"],
    },
    {
      id: "govern-publish-outcome",
      kind: "publish-outcome",
      title: "One verified outcome fans out three ways",
      explanation:
        "Returning a response, writing verified memory, and recording trace telemetry are separate contracts with separate policies.",
      durationMs: 9000,
      easing: "ease-out",
      accent: "evidence",
      dependencies: ["govern-allow-bounded-action"],
    },
  ],
};

const scenes: readonly DemoScene<AgentEventKind>[] = [
  overviewScene,
  prepareScene,
  routeScene,
  executeScene,
  recoverScene,
  governScene,
];

export const agentPhaseStories: Readonly<Record<AgentPhase, DemoStory<AgentEventKind>>> = {
  overview: { id: "agent-system", title: "How AI agents work / System", scenes: [overviewScene] },
  prepare: { id: "agent-input-context", title: "How AI agents work / Input + context", scenes: [prepareScene] },
  route: { id: "agent-models-agents", title: "How AI agents work / Models + agents", scenes: [routeScene] },
  execute: { id: "agent-tools", title: "How AI agents work / Tools", scenes: [executeScene] },
  recover: { id: "agent-evaluate-retry", title: "How AI agents work / Evaluate + retry", scenes: [recoverScene] },
  govern: { id: "agent-govern-return", title: "How AI agents work / Govern + return", scenes: [governScene] },
};

export const agentStory: DemoStory<AgentEventKind> = {
  id: "agent-system-explorer",
  title: "How AI agents work",
  scenes,
};
