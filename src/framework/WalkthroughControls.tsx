import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
  SkipForward,
} from "lucide-react";

import type { PlaybackSpeed, PlaybackStatus } from "./playback";

interface WalkthroughControlsProps {
  readonly blockedReason?: string;
  readonly canGoNext: boolean;
  readonly canGoPrevious: boolean;
  readonly loopLabel?: string;
  readonly loopTitle?: string;
  readonly nextPhaseLabel: string;
  readonly onNext: () => void;
  readonly onNextPhase: () => void;
  readonly onPrevious: () => void;
  readonly onRestart: () => void;
  readonly onSkip: () => void;
  readonly onSpeedChange: (speed: PlaybackSpeed) => void;
  readonly onToggle: () => void;
  readonly speed: PlaybackSpeed;
  readonly status: PlaybackStatus;
}

const playbackSpeeds: readonly PlaybackSpeed[] = [0.75, 1, 1.5];

export function WalkthroughControls({
  blockedReason,
  canGoNext,
  canGoPrevious,
  loopLabel = "Page loop",
  loopTitle = "This page restarts after its final step",
  nextPhaseLabel,
  onNext,
  onNextPhase,
  onPrevious,
  onRestart,
  onSkip,
  onSpeedChange,
  onToggle,
  speed,
  status,
}: WalkthroughControlsProps): React.JSX.Element {
  const isBlocked = Boolean(blockedReason);
  const isPlaying = status === "playing";
  const hasCompleted = status === "completed";

  return (
    <div className="walkthrough-controls" aria-label="Animation controls">
      <div className="walkthrough-controls__primary">
        <button
          aria-label="Previous animation step"
          className="icon-button"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          title="Previous step"
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          aria-describedby={isBlocked ? "walkthrough-blocked-reason" : undefined}
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
          className="play-button"
          disabled={isBlocked}
          onClick={onToggle}
          type="button"
        >
          {isBlocked ? (
            <LockKeyhole aria-hidden="true" />
          ) : isPlaying ? (
            <Pause aria-hidden="true" fill="currentColor" />
          ) : (
            <Play aria-hidden="true" fill="currentColor" />
          )}
          {isBlocked
            ? "Decision needed"
            : hasCompleted
              ? "Replay"
              : isPlaying
                ? "Pause"
                : "Play"}
        </button>
        <button
          aria-label="Next animation step"
          className="icon-button"
          disabled={!canGoNext || isBlocked}
          onClick={onNext}
          title="Next step"
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="walkthrough-controls__secondary">
        <span className="loop-indicator" title={loopTitle}>
          <Repeat2 aria-hidden="true" />
          {loopLabel}
        </span>
        {blockedReason && (
          <span className="blocked-indicator" id="walkthrough-blocked-reason">
            <LockKeyhole aria-hidden="true" />
            {blockedReason}
          </span>
        )}
        <div className="speed-control" aria-label="Playback speed">
          {playbackSpeeds.map((playbackSpeed) => (
            <button
              aria-pressed={speed === playbackSpeed}
              className={speed === playbackSpeed ? "is-selected" : ""}
              key={playbackSpeed}
              onClick={() => onSpeedChange(playbackSpeed)}
              type="button"
            >
              {playbackSpeed}x
            </button>
          ))}
        </div>
        <button className="text-button" onClick={onRestart} type="button">
          <RotateCcw aria-hidden="true" />
          Restart page
        </button>
        <button
          className="text-button"
          disabled={isBlocked}
          onClick={onSkip}
          type="button"
        >
          <SkipForward aria-hidden="true" />
          Skip page
        </button>
        <button
          className="phase-button"
          disabled={isBlocked}
          onClick={onNextPhase}
          type="button"
        >
          {nextPhaseLabel}
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
