import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
  SkipForward,
} from "lucide-react";

import type { PlaybackSpeed, PlaybackStatus } from "../../framework/playback";

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

const playbackSpeeds: readonly PlaybackSpeed[] = [0.75, 1, 1.5];

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
  const isPlaying = status === "playing";
  const hasCompleted = status === "completed";

  return (
    <div className="rag-controls" aria-label="Animation controls">
      <div className="rag-controls__primary">
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
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
          className="play-button"
          onClick={onToggle}
          type="button"
        >
          {isPlaying ? (
            <Pause aria-hidden="true" fill="currentColor" />
          ) : (
            <Play aria-hidden="true" fill="currentColor" />
          )}
          {hasCompleted ? "Replay" : isPlaying ? "Pause" : "Play"}
        </button>
        <button
          aria-label="Next animation step"
          className="icon-button"
          disabled={!canGoNext}
          onClick={onNext}
          title="Next step"
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="rag-controls__secondary">
        <span className="loop-indicator" title="This page restarts after its final step">
          <Repeat2 aria-hidden="true" />
          Page loop
        </span>
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
        <button
          className="text-button"
          onClick={onRestart}
          title="Restart this page"
          type="button"
        >
          <RotateCcw aria-hidden="true" />
          Restart page
        </button>
        <button
          className="text-button"
          onClick={onSkip}
          title="Skip to the final step on this page"
          type="button"
        >
          <SkipForward aria-hidden="true" />
          Skip page
        </button>
        <button className="phase-button" onClick={onNextPhase} type="button">
          {nextPhaseLabel}
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
