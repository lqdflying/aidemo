import type {
  AgentGroupId,
  AgentLessonState,
  AgentLoopKind,
  AgentTopologyKind,
} from "./agent-types";

export const agentGroupOrder: readonly AgentGroupId[] = [
  "entry",
  "runtime",
  "context",
  "models",
  "agents",
  "tools",
  "governance",
  "outcome",
];

export const agentTopologyLabels: Readonly<Record<AgentTopologyKind, string>> = {
  system: "System map",
  sequence: "One-way sequence",
  "pair-loop": "Request / return loop",
  star: "Hub / star",
  cycle: "Closed control cycle",
  retry: "Separate retry",
  "fan-out": "Outcome fan-out",
};

export const agentLoopKindLabels: Readonly<Record<AgentLoopKind, string>> = {
  "request-response": "Request / response loop",
  "state-feedback": "State feedback loop",
  "control-verification": "Control / verification loop",
};

export const agentLessonStateLabels: Readonly<Record<AgentLessonState, string>> = {
  active: "Active",
  failed: "Timed-out attempt ended",
  retry: "New bounded attempt",
  recovered: "Result accepted",
};
