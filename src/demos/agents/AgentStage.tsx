import { useCallback, useState } from "react";

import type { PlaybackStatus } from "../../framework/playback";
import type { StoryPosition } from "../../framework/story";
import { AgentArchitectureMap } from "./AgentArchitectureMap";
import { AgentComponentDialog } from "./AgentComponentDialog";
import { getAgentLessonStep } from "./agent-diagram-model";
import { agentPhases, type AgentPhase } from "./agent-routing";
import type {
  AgentArchitectureModel,
  AgentDetailTarget,
  AgentEventKind,
} from "./agent-types";

interface AgentStageProps {
  readonly model: AgentArchitectureModel;
  readonly onInspect: () => void;
  readonly phase: AgentPhase;
  readonly playbackStatus: PlaybackStatus;
  readonly position: StoryPosition<AgentEventKind>;
}

interface AgentStageSelection {
  readonly target: AgentDetailTarget;
  readonly trigger: HTMLButtonElement;
}

export function AgentStage({
  model,
  onInspect,
  phase,
  playbackStatus,
  position,
}: AgentStageProps): React.JSX.Element {
  const [selection, setSelection] = useState<AgentStageSelection | null>(null);
  const step = getAgentLessonStep(model, position.event.kind);

  const selectTarget = useCallback((
    target: AgentDetailTarget,
    trigger: HTMLButtonElement,
  ): void => {
    setSelection({ target, trigger });
    onInspect();
  }, [onInspect]);

  const closeInspector = useCallback((): void => {
    setSelection(null);
  }, []);

  return (
    <section
      className="agent-stage"
      data-event={position.event.kind}
      data-playback={playbackStatus}
    >
      <div className="agent-stage__topline">
        <div>
          <span>Lesson {agentPhases.indexOf(phase) + 1}</span>
          <strong>{position.scene.title}</strong>
        </div>
        <span>Step {position.eventNumber} / {position.totalEvents}</span>
      </div>
      <div className="agent-stage__canvas">
        <div className="agent-explorer-layout">
          <AgentArchitectureMap
            model={model}
            onSelectTarget={selectTarget}
            selectedTarget={selection?.target ?? null}
            step={step}
          />
        </div>
      </div>
      <AgentComponentDialog
        model={model}
        onClose={closeInspector}
        returnFocusElement={selection?.trigger ?? null}
        target={selection?.target ?? null}
      />
    </section>
  );
}
