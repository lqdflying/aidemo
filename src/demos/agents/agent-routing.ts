export type AgentPhase =
  | "overview"
  | "prepare"
  | "route"
  | "execute"
  | "recover"
  | "govern";

export const agentPhases: readonly AgentPhase[] = [
  "overview",
  "prepare",
  "route",
  "execute",
  "recover",
  "govern",
];

export const agentPhaseLabels: Readonly<Record<AgentPhase, string>> = {
  overview: "System",
  prepare: "Input + context",
  route: "Models + agents",
  execute: "Tools",
  recover: "Timeouts + retries",
  govern: "Govern + return",
};

const phaseByPathSuffix: Readonly<Record<string, AgentPhase>> = {
  overview: "overview",
  prepare: "prepare",
  route: "route",
  execute: "execute",
  recover: "recover",
  govern: "govern",
  plan: "prepare",
  delegate: "route",
  adapt: "recover",
  approve: "govern",
};

export function getAgentPhaseFromPath(pathname: string): AgentPhase {
  const normalizedPath = pathname.replace(/\/+$/, "");
  const suffix = normalizedPath.split("/").at(-1) ?? "";
  return phaseByPathSuffix[suffix] ?? "overview";
}

export function getAgentPath(phase: AgentPhase): string {
  return `/demos/agent-orchestration/${phase}`;
}

export function navigateToAgentPhase(
  phase: AgentPhase,
  replace = false,
): void {
  const historyMethod = replace ? "replaceState" : "pushState";
  window.history[historyMethod]({}, "", getAgentPath(phase));
  window.dispatchEvent(new PopStateEvent("popstate"));
}
