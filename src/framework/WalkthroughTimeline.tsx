import { Check, Circle } from "lucide-react";

export interface WalkthroughPhase<Phase extends string> {
  readonly id: Phase;
  readonly label: string;
}

interface WalkthroughTimelineProps<Phase extends string> {
  readonly activePhase: Phase;
  readonly ariaLabel: string;
  readonly phases: readonly WalkthroughPhase<Phase>[];
  readonly onSelectPhase: (phase: Phase) => void;
}

export function WalkthroughTimeline<Phase extends string>({
  activePhase,
  ariaLabel,
  phases,
  onSelectPhase,
}: WalkthroughTimelineProps<Phase>): React.JSX.Element {
  const activePhaseIndex = phases.findIndex((phase) => phase.id === activePhase);

  return (
    <nav
      className="walkthrough-timeline"
      aria-label={ariaLabel}
      style={{ "--phase-count": phases.length } as React.CSSProperties}
    >
      {phases.map((phase, phaseIndex) => {
        const isCurrentPhase = phase.id === activePhase;
        const isCompletedPhase = phaseIndex < activePhaseIndex;

        return (
          <button
            aria-current={isCurrentPhase ? "page" : undefined}
            className={`timeline-step${isCurrentPhase ? " is-current" : ""}${isCompletedPhase ? " is-complete" : ""}`}
            key={phase.id}
            onClick={() => onSelectPhase(phase.id)}
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
              <strong>{phase.label}</strong>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
