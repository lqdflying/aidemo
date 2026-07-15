export type RagPhase = "index" | "retrieve" | "generate";

export const ragPhases: readonly RagPhase[] = ["index", "retrieve", "generate"];

export const ragPhaseLabels: Readonly<Record<RagPhase, string>> = {
  index: "Index",
  retrieve: "Retrieve",
  generate: "Generate",
};

export function getRagPhaseFromPath(pathname: string): RagPhase {
  const normalizedPath = pathname.replace(/\/+$/, "");

  if (normalizedPath.endsWith("/retrieve")) {
    return "retrieve";
  }

  if (normalizedPath.endsWith("/generate")) {
    return "generate";
  }

  return "index";
}

export function getRagPath(phase: RagPhase): string {
  return `/demos/rag/${phase}`;
}

export function navigateToRagPhase(
  phase: RagPhase,
  question?: string,
  replace = false,
): void {
  const searchParams = new URLSearchParams();
  if (question && phase !== "index") {
    searchParams.set("question", question);
  }

  const queryString = searchParams.toString();
  const nextPath = `${getRagPath(phase)}${queryString ? `?${queryString}` : ""}`;
  const historyMethod = replace ? "replaceState" : "pushState";
  window.history[historyMethod]({}, "", nextPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
