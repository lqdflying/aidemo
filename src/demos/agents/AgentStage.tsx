import {
  Check,
  CheckCircle2,
  CloudCog,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import type { PlaybackStatus } from "../../framework/playback";
import type { StoryPosition } from "../../framework/story";
import { AgentArchitectureMap } from "./AgentArchitectureMap";
import { AgentLearningDialog } from "./AgentLearningDialog";
import { agentPhases, type AgentPhase } from "./agent-routing";
import type {
  AgentApprovalState,
  AgentDetailTarget,
  AgentEventKind,
  AgentSimulation,
  RemediationPlan,
} from "./agent-types";

interface AgentStageProps {
  readonly approvalState: AgentApprovalState;
  readonly onApprovePrimary: () => void;
  readonly onApproveSafer: () => void;
  readonly onLearningOpen: () => void;
  readonly onRequestSafer: () => void;
  readonly onStop: () => void;
  readonly phase: AgentPhase;
  readonly playbackStatus: PlaybackStatus;
  readonly position: StoryPosition<AgentEventKind>;
  readonly simulation: AgentSimulation;
}

function RemediationPlanCard({ plan }: { readonly plan: RemediationPlan }): React.JSX.Element {
  return (
    <article className="agent-remediation__plan">
      <div className="agent-remediation__plan-heading">
        <ShieldCheck aria-hidden="true" />
        <div><small>Verified remediation</small><h3>{plan.title}</h3></div>
      </div>
      <p>{plan.summary}</p>
      <ul>{plan.actions.map((action) => <li key={action}>{action}</li>)}</ul>
      <dl>
        <div><dt>Risk</dt><dd>{plan.risk}</dd></div>
        <div><dt>Verify</dt><dd>{plan.verificationWindow}</dd></div>
      </dl>
    </article>
  );
}

function RemediationDecisionPanel({
  approvalState,
  currentEvent,
  onApprovePrimary,
  onApproveSafer,
  onRequestSafer,
  onStop,
  simulation,
}: Pick<
  AgentStageProps,
  | "approvalState"
  | "onApprovePrimary"
  | "onApproveSafer"
  | "onRequestSafer"
  | "onStop"
  | "simulation"
> & { readonly currentEvent: AgentEventKind }): React.JSX.Element {
  const usesSaferPlan = [
    "safer-requested",
    "pending-safer",
    "approved-safer",
    "stopped-safer",
  ].includes(approvalState);
  const plan = usesSaferPlan ? simulation.saferPlan : simulation.primaryPlan;
  const isPrimaryGate = currentEvent === "await-approval" && approvalState === "pending-primary";
  const isSaferGate = currentEvent === "await-reapproval" && approvalState === "pending-safer";
  const didStop = approvalState === "stopped" || approvalState === "stopped-safer";
  const didApprove = approvalState === "approved-primary" || approvalState === "approved-safer";

  return (
    <section className="agent-remediation" aria-label="Human remediation decision">
      <RemediationPlanCard plan={plan} />
      <div className="agent-remediation__gate" data-state={isPrimaryGate || isSaferGate ? "waiting" : didApprove ? "approved" : didStop ? "stopped" : "locked"}>
        {isPrimaryGate || isSaferGate ? (
          <>
            <LockKeyhole aria-hidden="true" />
            <div><small>Human authority required</small><h3>{isSaferGate ? "Approve the rolling canary?" : "Approve the remediation?"}</h3><p>No Cloud Control write has occurred.</p></div>
            <div className="agent-remediation__actions" role="group" aria-label="Remediation decision">
              <button className="agent-remediation__approve" onClick={isSaferGate ? onApproveSafer : onApprovePrimary} type="button">
                <Check aria-hidden="true" />{isSaferGate ? "Approve safer plan" : "Approve remediation"}
              </button>
              {!isSaferGate && <button onClick={onRequestSafer} type="button">Request safer canary</button>}
              <button onClick={onStop} type="button">Stop without acting</button>
            </div>
          </>
        ) : didApprove ? (
          <>
            <CheckCircle2 aria-hidden="true" />
            <div><small>Approved actions</small><h3>Cloud Control actions complete</h3><p>{simulation.externalActions.map((action) => action.label).join(" · ")}</p></div>
          </>
        ) : didStop ? (
          <>
            <TriangleAlert aria-hidden="true" />
            <div><small>Safe stop</small><h3>No external action</h3><p>The human ended the run before any write-capable tool call.</p></div>
          </>
        ) : (
          <>
            <CloudCog aria-hidden="true" />
            <div><small>Cloud Control locked</small><h3>Read-only investigation</h3><p>The action proposal is still moving toward the human boundary.</p></div>
          </>
        )}
      </div>
    </section>
  );
}

export function AgentStage({
  approvalState,
  onApprovePrimary,
  onApproveSafer,
  onLearningOpen,
  onRequestSafer,
  onStop,
  phase,
  playbackStatus,
  position,
  simulation,
}: AgentStageProps): React.JSX.Element {
  const [detailHistory, setDetailHistory] = useState<readonly AgentDetailTarget[]>([]);
  const selectedDetail = detailHistory.at(-1) ?? null;
  const traceStep = simulation.trace.find((step) => step.eventKind === position.event.kind);

  if (!traceStep) {
    throw new Error(`Missing architecture trace for event "${position.event.kind}".`);
  }

  const openDetail = (target: AgentDetailTarget): void => {
    setDetailHistory([target]);
    onLearningOpen();
  };

  return (
    <>
      <section className="agent-stage" data-event={position.event.kind} data-playback={playbackStatus}>
        <div className="agent-stage__topline">
          <div><span>Act {agentPhases.indexOf(phase) + 1}</span><strong>{position.scene.title}</strong></div>
          <span>Step {position.eventNumber} / {position.totalEvents}</span>
        </div>
        <div className="agent-stage__canvas">
          <AgentArchitectureMap onOpenDetail={openDetail} phase={phase} simulation={simulation} traceStep={traceStep} />
          {phase === "govern" && (
            <RemediationDecisionPanel
              approvalState={approvalState}
              currentEvent={position.event.kind}
              onApprovePrimary={onApprovePrimary}
              onApproveSafer={onApproveSafer}
              onRequestSafer={onRequestSafer}
              onStop={onStop}
              simulation={simulation}
            />
          )}
        </div>
      </section>
      <AgentLearningDialog
        canGoBack={detailHistory.length > 1}
        onBack={() => setDetailHistory((history) => history.slice(0, -1))}
        onClose={() => setDetailHistory([])}
        onNavigate={(target) => setDetailHistory((history) => [...history, target])}
        simulation={simulation}
        target={selectedDetail}
        traceStep={traceStep}
      />
    </>
  );
}
