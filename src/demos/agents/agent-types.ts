import type { DemoRuntimeAdapter, DemoRuntimeResult } from "../../framework/types";

export type AgentEventKind =
  | "map-components"
  | "show-harness"
  | "accept-input"
  | "assemble-context"
  | "call-model"
  | "delegate-workers"
  | "call-function-tool"
  | "retrieve-knowledge"
  | "start-tool-attempt"
  | "record-tool-failure"
  | "retry-tool-call"
  | "accept-tool-result"
  | "review-decision"
  | "close-revision-loop"
  | "allow-bounded-action"
  | "publish-outcome";

export type AgentAccent = "input" | "generation" | "retrieval" | "evidence";

export type AgentGroupId =
  | "entry"
  | "runtime"
  | "context"
  | "models"
  | "agents"
  | "tools"
  | "governance"
  | "outcome";

export type AgentComponentId =
  | "user-application"
  | "event-message"
  | "input-gateway"
  | "coordinator"
  | "task-scheduler"
  | "working-context"
  | "long-term-memory"
  | "skills-instructions"
  | "context-manager"
  | "general-model"
  | "private-model"
  | "worker-a"
  | "worker-b"
  | "worker-c"
  | "function-tool"
  | "retrieval-tool"
  | "data-source"
  | "action-tool"
  | "policy-guard"
  | "output-evaluator"
  | "human-approval"
  | "response-publisher"
  | "memory-writer"
  | "trace-telemetry";

export type AgentComponentKind =
  | "user"
  | "event"
  | "gateway"
  | "coordinator"
  | "scheduler"
  | "context"
  | "memory"
  | "skills"
  | "context-manager"
  | "model"
  | "worker"
  | "function-tool"
  | "retrieval"
  | "data"
  | "action"
  | "policy"
  | "evaluator"
  | "approval"
  | "publisher"
  | "telemetry";

export type AgentConceptId = "harness" | "run-loop" | "typed-contracts";

export type AgentTopologyKind =
  | "system"
  | "sequence"
  | "pair-loop"
  | "star"
  | "cycle"
  | "retry"
  | "fan-out";

export type AgentLessonState = "active" | "failed" | "retry" | "recovered";
export type AgentContractDirection = "forward" | "return";
export type AgentFlowTone = "request" | "response";
export type AgentAttemptStatus = "waiting" | "running" | "timed-out" | "returned";
export type AgentLoopKind =
  | "request-response"
  | "state-feedback"
  | "control-verification";

export type AgentRelationshipId =
  | "entry-to-runtime"
  | "runtime-to-context"
  | "runtime-to-models"
  | "runtime-to-agents"
  | "agents-to-tools"
  | "agents-to-governance"
  | "governance-to-runtime"
  | "governance-to-tools"
  | "governance-to-outcome"
  | "tools-to-outcome"
  | "outcome-to-context"
  | "outcome-to-entry";

export interface AgentContractLeg {
  readonly relationshipId: AgentRelationshipId;
  readonly direction: AgentContractDirection;
}

export interface AgentLearningDetail {
  readonly role: string;
  readonly receives: string;
  readonly returns: string;
  readonly owns: string;
  readonly engineeringNote: string;
  readonly risk: string;
}

export interface AgentComponent {
  readonly id: AgentComponentId;
  readonly groupId: AgentGroupId;
  readonly label: string;
  readonly shortLabel: string;
  readonly kind: AgentComponentKind;
  readonly accent: AgentAccent;
  readonly learning: AgentLearningDetail;
}

export interface AgentComponentGroup {
  readonly id: AgentGroupId;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly accent: AgentAccent;
  readonly componentIds: readonly AgentComponentId[];
  readonly learning: AgentLearningDetail;
}

interface AgentRelationshipBase {
  readonly id: AgentRelationshipId;
  readonly sourceGroupId: AgentGroupId;
  readonly targetGroupId: AgentGroupId;
  readonly label: string;
  readonly forwardTone: AgentFlowTone;
}

export type AgentRelationship = AgentRelationshipBase & (
  | {
      readonly interaction: "handoff";
      readonly loopKind?: never;
      readonly returnLabel?: never;
      readonly returnTone?: never;
    }
  | {
      readonly interaction: "exchange";
      readonly loopKind: Exclude<AgentLoopKind, "control-verification">;
      readonly returnLabel: string;
      readonly returnTone: AgentFlowTone;
    }
);

export interface AgentControlCycle {
  readonly id: "governance-revision-cycle";
  readonly label: string;
  readonly loopKind: "control-verification";
  readonly legs: readonly AgentContractLeg[];
}

export interface AgentConcept {
  readonly id: AgentConceptId;
  readonly label: string;
  readonly summary: string;
  readonly learning: AgentLearningDetail;
}

export interface AgentLessonStep {
  readonly number: number;
  readonly eventKind: AgentEventKind;
  readonly label: string;
  readonly summary: string;
  readonly topology: AgentTopologyKind;
  readonly patternLabel: string;
  readonly activeComponentIds: readonly AgentComponentId[];
  readonly contractLegs: readonly AgentContractLeg[];
  readonly state: AgentLessonState;
  readonly attempt?: 1 | 2;
  readonly attemptStatuses?: readonly [AgentAttemptStatus, AgentAttemptStatus];
  readonly focusTarget?: AgentDetailTarget;
}

export type AgentDetailTarget =
  | { readonly kind: "component"; readonly componentId: AgentComponentId }
  | { readonly kind: "group"; readonly groupId: AgentGroupId }
  | { readonly kind: "concept"; readonly conceptId: AgentConceptId };

export interface AgentArchitectureModel {
  readonly groups: readonly AgentComponentGroup[];
  readonly components: readonly AgentComponent[];
  readonly relationships: readonly AgentRelationship[];
  readonly cycles: readonly AgentControlCycle[];
  readonly concepts: readonly AgentConcept[];
  readonly trace: readonly AgentLessonStep[];
}

export type AgentRuntimeInput = Readonly<Record<string, never>>;
export type AgentRuntimeResult = DemoRuntimeResult<AgentArchitectureModel>;
export type AgentRuntimeAdapter = DemoRuntimeAdapter<AgentRuntimeInput, AgentRuntimeResult>;
