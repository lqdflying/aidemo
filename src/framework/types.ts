export type SemanticAccent =
  | "neutral"
  | "input"
  | "retrieval"
  | "evidence"
  | "generation";

export type MotionEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "spring";

export interface EvidenceReference {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly excerpt: string;
  readonly locator?: string;
}

export interface SceneEvent<EventKind extends string = string> {
  readonly id: string;
  readonly kind: EventKind;
  readonly title: string;
  readonly explanation: string;
  readonly durationMs: number;
  readonly easing: MotionEasing;
  readonly accent: SemanticAccent;
  readonly dependencies?: readonly string[];
}

export interface DemoScene<EventKind extends string = string> {
  readonly id: string;
  readonly act: number;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly events: readonly SceneEvent<EventKind>[];
}

export interface DemoStory<EventKind extends string = string> {
  readonly id: string;
  readonly title: string;
  readonly scenes: readonly DemoScene<EventKind>[];
}

export interface DemoRuntimeAdapter<Input, Output> {
  readonly mode: "simulation" | "live";
  run(input: Input, signal?: AbortSignal): Promise<Output>;
}

export interface DemoRuntimeResult<Data> {
  readonly data: Data;
  readonly generatedAt: string;
  readonly adapterMode: DemoRuntimeAdapter<unknown, unknown>["mode"];
}
