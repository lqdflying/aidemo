import {
  ArrowLeft,
  BrainCircuit,
  Network,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { InternalLink } from "../../app/InternalLink";
import { WalkthroughControls } from "../../framework/WalkthroughControls";
import { WalkthroughExplanation } from "../../framework/WalkthroughExplanation";
import { WalkthroughProgress } from "../../framework/WalkthroughProgress";
import { WalkthroughTimeline } from "../../framework/WalkthroughTimeline";
import { useScenePlayer } from "../../framework/useScenePlayer";
import { AgentStage } from "./AgentStage";
import {
  agentPhaseLabels,
  agentPhases,
  getAgentPhaseFromPath,
  navigateToAgentPhase,
  type AgentPhase,
} from "./agent-routing";
import { simulateAgentArchitecture } from "./agent-simulator";
import { agentPhaseStories } from "./agent-story";

interface AgentPhaseWorkspaceProps {
  readonly activePhase: AgentPhase;
  readonly onNextPhase: () => void;
}

const timelinePhases = agentPhases.map((phase) => ({
  id: phase,
  label: agentPhaseLabels[phase],
}));

function AgentPhaseWorkspace({
  activePhase,
  onNextPhase,
}: AgentPhaseWorkspaceProps): React.JSX.Element {
  const story = agentPhaseStories[activePhase];
  const stopsAfterLesson = activePhase === "recover" || activePhase === "govern";
  const holdsFinalFlow = activePhase === "overview";
  const player = useScenePlayer(story, {
    endBehavior: holdsFinalFlow
      ? "hold-final"
      : stopsAfterLesson
        ? "complete"
        : "loop",
  });
  const runtimeResult = useMemo(() => simulateAgentArchitecture(), []);
  const currentPhaseIndex = agentPhases.indexOf(activePhase);
  const nextPhase = agentPhases[currentPhaseIndex + 1];
  const nextPhaseLabel = nextPhase
    ? `Next: ${agentPhaseLabels[nextPhase]}`
    : "Restart walkthrough";

  const handleNext = (): void => {
    if (holdsFinalFlow) {
      player.controls.pause();
    }
    player.controls.next();
  };

  return (
    <>
      <WalkthroughProgress progressPercent={player.progressPercent} />
      <div className="walkthrough-workspace__main">
        <AgentStage
          model={runtimeResult.data}
          onInspect={player.controls.pause}
          phase={activePhase}
          playbackStatus={player.state.status}
          position={player.position}
        />
        <WalkthroughExplanation
          adapterMode={runtimeResult.adapterMode}
          event={player.position.event}
          footerLabel="Read the topology"
        />
      </div>
      <WalkthroughControls
        canGoNext={player.canGoNext}
        canGoPrevious={player.canGoPrevious}
        loopLabel={holdsFinalFlow
          ? "Final flow stays live"
          : stopsAfterLesson
            ? "Stops after this lesson"
            : "Guided lesson loop"}
        loopTitle={holdsFinalFlow
          ? "The group tour runs once, then the full system flow continues until paused or restarted"
          : stopsAfterLesson
            ? "This lesson stops after its final step"
            : "This lesson restarts after its final step"}
        nextPhaseLabel={nextPhaseLabel}
        onNext={handleNext}
        onNextPhase={onNextPhase}
        onPrevious={player.controls.previous}
        onRestart={() => player.controls.restart(false)}
        onSkip={player.controls.skip}
        onSpeedChange={player.controls.setSpeed}
        onToggle={player.controls.toggle}
        speed={player.state.speed}
        status={player.state.status}
      />
    </>
  );
}

export function AgentDemo(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<AgentPhase>(() =>
    getAgentPhaseFromPath(window.location.pathname),
  );

  useEffect(() => {
    const handleHistoryChange = (): void => {
      setActivePhase(getAgentPhaseFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, []);

  const currentPhaseIndex = agentPhases.indexOf(activePhase);
  const nextPhase = agentPhases[currentPhaseIndex + 1];

  const handleNextPhase = (): void => {
    navigateToAgentPhase(nextPhase ?? "overview", !nextPhase);
  };

  return (
    <main className="walkthrough-demo agent-demo">
      <section className="walkthrough-hero">
        <div>
          <InternalLink className="back-link" href="/">
            <ArrowLeft aria-hidden="true" size={18} />All demos
          </InternalLink>
          <div className="walkthrough-hero__title">
            <p className="eyebrow">Interactive architecture explorer</p>
            <h1>How AI agents work(designing)</h1>
          </div>
        </div>
        <div className="walkthrough-hero__summary">
          <div aria-hidden="true"><Network /><span /><BrainCircuit /><span /><ShieldCheck /></div>
          <p>
            Learn the reusable components of an AI agent system, then follow
            each sequence, exchange, loop, retry, and governed outcome.
          </p>
        </div>
      </section>

      <section
        aria-label="AI agent architecture learning workspace"
        className="walkthrough-workspace agent-workspace"
      >
        <WalkthroughTimeline
          activePhase={activePhase}
          ariaLabel="AI agent system lessons"
          onSelectPhase={(phase) => navigateToAgentPhase(phase)}
          phases={timelinePhases}
        />
        <AgentPhaseWorkspace
          activePhase={activePhase}
          key={activePhase}
          onNextPhase={handleNextPhase}
        />
      </section>
    </main>
  );
}
