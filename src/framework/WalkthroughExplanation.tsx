import { ArrowRight, Lightbulb, ShieldCheck } from "lucide-react";

import type { SceneEvent } from "./types";

interface WalkthroughExplanationProps<EventKind extends string> {
  readonly adapterMode: "simulation" | "live";
  readonly event: SceneEvent<EventKind>;
  readonly footerLabel?: string;
}

export function WalkthroughExplanation<EventKind extends string>({
  adapterMode,
  event,
  footerLabel = "Follow the path",
}: WalkthroughExplanationProps<EventKind>): React.JSX.Element {
  return (
    <aside className="walkthrough-explanation" aria-live="polite">
      <div className="walkthrough-explanation__label">
        <Lightbulb aria-hidden="true" />
        <span>What is happening</span>
      </div>
      <h2>{event.title}</h2>
      <p>{event.explanation}</p>
      <div className="walkthrough-explanation__footer">
        <span>
          <ShieldCheck aria-hidden="true" />
          {adapterMode === "simulation"
            ? "Deterministic simulation"
            : "Live adapter"}
        </span>
        <span>
          {footerLabel}
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </aside>
  );
}
