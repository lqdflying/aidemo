import type { PlaybackSpeed, PlaybackStatus } from "../../framework/playback";
import { WalkthroughControls } from "../../framework/WalkthroughControls";

interface RagControlsProps {
  readonly status: PlaybackStatus;
  readonly speed: PlaybackSpeed;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly nextPhaseLabel: string;
  readonly onToggle: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onRestart: () => void;
  readonly onSkip: () => void;
  readonly onNextPhase: () => void;
  readonly onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function RagControls({
  status,
  speed,
  canGoPrevious,
  canGoNext,
  nextPhaseLabel,
  onToggle,
  onPrevious,
  onNext,
  onRestart,
  onSkip,
  onNextPhase,
  onSpeedChange,
}: RagControlsProps): React.JSX.Element {
  return (
    <WalkthroughControls
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      nextPhaseLabel={nextPhaseLabel}
      onNext={onNext}
      onNextPhase={onNextPhase}
      onPrevious={onPrevious}
      onRestart={onRestart}
      onSkip={onSkip}
      onSpeedChange={onSpeedChange}
      onToggle={onToggle}
      speed={speed}
      status={status}
    />
  );
}
