import { WalkthroughTimeline } from "../../framework/WalkthroughTimeline";
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
  const phases = ragPhases.map((phase) => ({
    id: phase,
    label: ragPhaseLabels[phase],
  }));

  return (
    <WalkthroughTimeline
      activePhase={activePhase}
      ariaLabel="RAG walkthrough pages"
      onSelectPhase={onSelectPhase}
      phases={phases}
    />
  );
}
