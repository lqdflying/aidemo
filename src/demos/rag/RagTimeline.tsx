import { Check, Circle } from "lucide-react";

import type { RagPhase } from "./rag-routing";
import { ragPhaseLabels, ragPhases } from "./rag-routing";

interface RagTimelineProps {
  readonly activePhase: RagPhase;
  readonly onSelectPhase: (phase: RagPhase) => void;
}

export function RagTimeline({
  activePhase,
  onSelectPhase,
}: RagTimelineProps): React.JSX.Element {
  const activePhaseIndex = ragPhases.indexOf(activePhase);

  return (
    <nav className="rag-timeline" aria-label="RAG walkthrough pages">
      {ragPhases.map((phase, phaseIndex) => {
        const isCurrentPhase = phase === activePhase;
        const isCompletedPhase = phaseIndex < activePhaseIndex;

        return (
          <button
            aria-current={isCurrentPhase ? "page" : undefined}
            className={`timeline-step${isCurrentPhase ? " is-current" : ""}${isCompletedPhase ? " is-complete" : ""}`}
            key={phase}
            onClick={() => onSelectPhase(phase)}
            type="button"
          >
            <span className="timeline-step__marker">
              {isCompletedPhase ? (
                <Check aria-hidden="true" size={14} />
              ) : (
                <Circle aria-hidden="true" size={10} />
              )}
            </span>
            <span className="timeline-step__copy">
              <small>Act {phaseIndex + 1}</small>
              <strong>{ragPhaseLabels[phase]}</strong>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
