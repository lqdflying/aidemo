import type { AgentConceptId } from "./agent-types";

export type AgentConceptLegendTone =
  | "request"
  | "response"
  | "control"
  | "exception";

export interface AgentConceptLegendItem {
  readonly label: string;
  readonly tone: AgentConceptLegendTone;
}

interface AgentConceptDiagramBase {
  readonly id: AgentConceptId;
  readonly caption: string;
  readonly legend: readonly AgentConceptLegendItem[];
}

export type AgentHarnessFacetId =
  | "state"
  | "orchestration"
  | "tools"
  | "policy"
  | "evaluation"
  | "delivery";

export interface AgentHarnessFacet {
  readonly id: AgentHarnessFacetId;
  readonly label: string;
  readonly summary: string;
}

export interface AgentHarnessDiagramSpec extends AgentConceptDiagramBase {
  readonly id: "harness";
  readonly requestLabel: string;
  readonly responseLabel: string;
  readonly facets: readonly AgentHarnessFacet[];
  readonly modelLabel: string;
  readonly modelSummary: string;
}

export type AgentRunLoopStageId = "observe" | "decide" | "act" | "evaluate";

export interface AgentRunLoopStage {
  readonly id: AgentRunLoopStageId;
  readonly label: string;
  readonly summary: string;
}

export interface AgentRunLoopDiagramSpec extends AgentConceptDiagramBase {
  readonly id: "run-loop";
  readonly stages: readonly AgentRunLoopStage[];
  readonly adaptLabel: string;
  readonly adaptSummary: string;
  readonly exitLabel: string;
  readonly exitSummary: string;
}

export interface AgentContractField {
  readonly label: string;
  readonly value: string;
}

export type AgentContractOutcomeTone = "response" | "error" | "absence";

export interface AgentContractOutcome {
  readonly label: string;
  readonly summary: string;
  readonly tone: AgentContractOutcomeTone;
}

export interface AgentTypedContractsDiagramSpec extends AgentConceptDiagramBase {
  readonly id: "typed-contracts";
  readonly producerLabel: string;
  readonly consumerLabel: string;
  readonly requestLabel: string;
  readonly responseLabel: string;
  readonly requestFields: readonly AgentContractField[];
  readonly outcomes: readonly AgentContractOutcome[];
}

export type AgentConceptDiagramSpec =
  | AgentHarnessDiagramSpec
  | AgentRunLoopDiagramSpec
  | AgentTypedContractsDiagramSpec;

const agentConceptDiagramSpecs: Readonly<
  Record<AgentConceptId, AgentConceptDiagramSpec>
> = {
  harness: {
    id: "harness",
    caption:
      "The request enters a controlled application boundary. The harness prepares state and authority around one replaceable model call, verifies the result, and only then delivers a response.",
    legend: [
      { label: "Request", tone: "request" },
      { label: "Verified response", tone: "response" },
      { label: "Harness control", tone: "control" },
    ],
    requestLabel: "Request<T>",
    responseLabel: "Verified Result<T>",
    modelLabel: "Replaceable model",
    modelSummary: "One stateless call",
    facets: [
      {
        id: "state",
        label: "State & context",
        summary: "Assemble approved memory, history, and instructions.",
      },
      {
        id: "orchestration",
        label: "Orchestration",
        summary: "Route work and own progress through the run.",
      },
      {
        id: "policy",
        label: "Policy",
        summary: "Bound identity, scope, permissions, and authority.",
      },
      {
        id: "tools",
        label: "Tools",
        summary: "Validate calls and record typed results or failures.",
      },
      {
        id: "evaluation",
        label: "Evaluation & tracing",
        summary: "Check the outcome and preserve reproducible evidence.",
      },
      {
        id: "delivery",
        label: "Delivery",
        summary: "Publish verified output and explicit state updates.",
      },
    ],
  },
  "run-loop": {
    id: "run-loop",
    caption:
      "The first pass evaluates and adapts once, sending updated state back to Observe. The second pass follows the same controlled stages and exits only after verification.",
    legend: [
      { label: "Run progress", tone: "request" },
      { label: "Adapt loop", tone: "control" },
      { label: "Verified exit", tone: "response" },
    ],
    stages: [
      {
        id: "observe",
        label: "Observe",
        summary: "Read the objective, current state, and prior results.",
      },
      {
        id: "decide",
        label: "Decide",
        summary: "Choose the next bounded step or a stop condition.",
      },
      {
        id: "act",
        label: "Act",
        summary: "Call a model, worker, or tool through a contract.",
      },
      {
        id: "evaluate",
        label: "Evaluate",
        summary: "Verify a result, typed error, or explicit absence.",
      },
    ],
    adaptLabel: "Adapt and observe again",
    adaptSummary: "Update state, constraints, or the retry budget.",
    exitLabel: "Verified exit",
    exitSummary: "Completion or escalation criteria are satisfied.",
  },
  "typed-contracts": {
    id: "typed-contracts",
    caption:
      "A producer sends a named Request<T> to a consumer. The boundary returns one explicit outcome: Result<T>, TypedError, or NoResult, so ownership and failure never disappear between components.",
    legend: [
      { label: "Request<T>", tone: "request" },
      { label: "Result<T>", tone: "response" },
      { label: "Explicit exception", tone: "exception" },
    ],
    producerLabel: "Producer",
    consumerLabel: "Consumer",
    requestLabel: "Request<T>",
    responseLabel: "Result<T> | TypedError | NoResult",
    requestFields: [
      { label: "Schema", value: "versioned payload" },
      { label: "Identity", value: "request + attempt ID" },
      { label: "Scope", value: "bounded authority" },
      { label: "Deadline", value: "explicit timeout" },
      { label: "Ownership", value: "named result owner" },
    ],
    outcomes: [
      {
        label: "Result<T>",
        summary: "Accepted typed value",
        tone: "response",
      },
      {
        label: "TypedError",
        summary: "Machine-readable failure",
        tone: "error",
      },
      {
        label: "NoResult",
        summary: "Explicit absence or timeout",
        tone: "absence",
      },
    ],
  },
};

export function getAgentConceptDiagramSpec(
  conceptId: AgentConceptId,
): AgentConceptDiagramSpec {
  return agentConceptDiagramSpecs[conceptId];
}
