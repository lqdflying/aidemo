import { Check, Circle } from "lucide-react";

import type { DemoScene } from "../../framework/types";
import type { PlaybackStatus } from "../../framework/playback";
import type { RagEventKind } from "./rag-types";

interface RagTimelineProps {
  readonly scenes: readonly DemoScene<RagEventKind>[];
  readonly activeSceneIndex: number;
  readonly activeEventIndex: number;
  readonly status: PlaybackStatus;
  readonly onSelectScene: (sceneIndex: number) => void;
}

export function RagTimeline({
  scenes,
  activeSceneIndex,
  activeEventIndex,
  status,
  onSelectScene,
}: RagTimelineProps): React.JSX.Element {
  return (
    <nav className="rag-timeline" aria-label="RAG walkthrough steps">
      {scenes.map((scene, sceneIndex) => {
        const isCurrentScene = sceneIndex === activeSceneIndex;
        const isCompletedScene =
          sceneIndex < activeSceneIndex ||
          (isCurrentScene &&
            activeEventIndex >= scene.events.length - 1 &&
            status === "completed");

        return (
          <button
            aria-current={isCurrentScene ? "step" : undefined}
            className={`timeline-step${isCurrentScene ? " is-current" : ""}${isCompletedScene ? " is-complete" : ""}`}
            key={scene.id}
            onClick={() => onSelectScene(sceneIndex)}
            type="button"
          >
            <span className="timeline-step__marker">
              {isCompletedScene ? (
                <Check aria-hidden="true" size={14} />
              ) : (
                <Circle aria-hidden="true" size={10} />
              )}
            </span>
            <span className="timeline-step__copy">
              <small>Act {scene.act}</small>
              <strong>{scene.shortTitle}</strong>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
