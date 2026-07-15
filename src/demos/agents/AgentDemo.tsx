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
import { simulateAgentOrchestration } from "./agent-simulator";
import { agentPhaseStories } from "./agent-story";
import type { AgentApprovalState } from "./agent-types";

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
  const [approvalState, setApprovalState] =
    useState<AgentApprovalState>("pending-primary");
  const story = agentPhaseStories[activePhase];
  const player = useScenePlayer(story, {
    loop: activePhase !== "govern" && activePhase !== "recover",
  });
  const runtimeResult = useMemo(
    () => simulateAgentOrchestration(approvalState),
    [approvalState],
  );
  const eventKind = player.position.event.kind;
  const isPrimaryGate =
    eventKind === "await-approval" && approvalState === "pending-primary";
  const isSaferGate =
    eventKind === "await-reapproval" &&
    (approvalState === "safer-requested" || approvalState === "pending-safer");
  const isBlocked = isPrimaryGate || isSaferGate;
  const currentPhaseIndex = agentPhases.indexOf(activePhase);
  const nextPhase = agentPhases[currentPhaseIndex + 1];
  const nextPhaseLabel = nextPhase
    ? `Next: ${agentPhaseLabels[nextPhase]}`
    : "Restart walkthrough";

  useEffect(() => {
    if (!isBlocked) return;

    if (eventKind === "await-reapproval" && approvalState === "safer-requested") {
      setApprovalState("pending-safer");
    }

    player.controls.pause();
  }, [approvalState, eventKind, isBlocked, player.controls]);

  const handleRestart = (): void => {
    setApprovalState("pending-primary");
    player.controls.restart(false);
  };

  const handleSkip = (): void => {
    if (activePhase !== "govern") {
      player.controls.skip();
      return;
    }

    if (approvalState === "pending-primary" && player.state.sceneIndex < 1) {
      player.controls.goToScene(1, false);
      return;
    }

    if (approvalState === "safer-requested" && player.state.sceneIndex < 3) {
      setApprovalState("pending-safer");
      player.controls.goToScene(3, false);
      return;
    }

    player.controls.skip();
  };

  const handlePrevious = (): void => {
    if (
      activePhase === "govern" &&
      player.state.sceneIndex === 4 &&
      player.state.eventIndex === 0
    ) {
      if (approvalState === "approved-safer") {
        setApprovalState("pending-safer");
        player.controls.goToScene(3, false);
        return;
      }

      setApprovalState("pending-primary");
      player.controls.goToScene(1, false);
      return;
    }

    player.controls.previous();
  };

  return (
    <>
      <WalkthroughProgress progressPercent={player.progressPercent} />
      <div className="walkthrough-workspace__main">
        <AgentStage
          approvalState={approvalState}
          onApprovePrimary={() => {
            setApprovalState("approved-primary");
            player.controls.goToScene(4, true);
          }}
          onApproveSafer={() => {
            setApprovalState("approved-safer");
            player.controls.goToScene(4, true);
          }}
          onLearningOpen={player.controls.pause}
          onRequestSafer={() => {
            setApprovalState("safer-requested");
            player.controls.goToScene(2, true);
          }}
          onStop={() => {
            setApprovalState(
              approvalState === "pending-safer" ? "stopped-safer" : "stopped",
            );
            player.controls.goToScene(4, true);
          }}
          phase={activePhase}
          playbackStatus={player.state.status}
          position={player.position}
          simulation={runtimeResult.data}
        />
        <WalkthroughExplanation
          adapterMode={runtimeResult.adapterMode}
          event={player.position.event}
          footerLabel={isBlocked ? "Human decision required" : "Follow the packet"}
        />
      </div>
      <WalkthroughControls
        blockedReason={isBlocked ? "Approval required" : undefined}
        canGoNext={player.canGoNext}
        canGoPrevious={player.canGoPrevious}
        loopLabel={
          activePhase === "recover"
            ? "Stops after recovery"
            : activePhase === "govern"
              ? "Human-gated"
              : "Architecture loop"
        }
        loopTitle={
          activePhase === "recover"
            ? "This page stops after recovered evidence is reconciled"
            : activePhase === "govern"
              ? "This page pauses at human approval boundaries"
              : "This page restarts after its final step"
        }
        nextPhaseLabel={nextPhaseLabel}
        onNext={player.controls.next}
        onNextPhase={onNextPhase}
        onPrevious={handlePrevious}
        onRestart={handleRestart}
        onSkip={handleSkip}
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
            <p className="eyebrow">Interactive systems atlas</p>
            <h1>See the complete AI agent system at work.</h1>
          </div>
        </div>
        <div className="walkthrough-hero__summary">
          <div aria-hidden="true"><Network /><span /><BrainCircuit /><span /><ShieldCheck /></div>
          <p>
            Trace one CloudOps incident through an engineered harness and a
            bounded observe-decide-act-evaluate loop, from evidence to human authority.
          </p>
        </div>
      </section>

      <section className="walkthrough-workspace agent-workspace" aria-label="Agent orchestration animation workspace">
        <WalkthroughTimeline
          activePhase={activePhase}
          ariaLabel="Agent orchestration walkthrough pages"
          onSelectPhase={(phase) => navigateToAgentPhase(phase)}
          phases={timelinePhases}
        />
        <AgentPhaseWorkspace activePhase={activePhase} key={activePhase} onNextPhase={handleNextPhase} />
      </section>
    </main>
  );
}
