import { ArrowRight, Lightbulb, ShieldCheck } from "lucide-react";

import type { SceneEvent } from "../../framework/types";
import type { RagEventKind } from "./rag-types";

interface RagExplanationProps {
  readonly event: SceneEvent<RagEventKind>;
  readonly adapterMode: "simulation" | "live";
}

export function RagExplanation({
  event,
  adapterMode,
}: RagExplanationProps): React.JSX.Element {
  return (
    <aside className="rag-explanation" aria-live="polite">
      <div className="rag-explanation__label">
        <Lightbulb aria-hidden="true" />
        <span>What is happening</span>
      </div>
      <h2>{event.title}</h2>
      <p>{event.explanation}</p>
      <div className="rag-explanation__footer">
        <span>
          <ShieldCheck aria-hidden="true" />
          {adapterMode === "simulation" ? "Deterministic simulation" : "Live adapter"}
        </span>
        <span>
          Follow the path
          <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </aside>
  );
}
