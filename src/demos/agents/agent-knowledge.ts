import type {
  AgentGroupId,
  AgentLessonState,
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

export const agentLessonStateLabels: Readonly<Record<AgentLessonState, string>> = {
  active: "Active",
  failed: "Timed-out attempt ended",
  retry: "New bounded attempt",
  recovered: "Result accepted",
};
