import type { DemoRuntimeAdapter, DemoRuntimeResult } from "../../framework/types";

export type AgentEventKind =
  | "map-system"
  | "show-state-ownership"
  | "show-engineered-loop"
  | "show-trace-contract"
  | "receive-incident"
  | "run-input-hooks"
  | "assemble-context"
  | "select-model"
  | "compact-context"
  | "classify-incident"
  | "decompose-dag"
  | "dispatch-specialists"
  | "establish-handoffs"
  | "query-metrics"
  | "query-logs"
  | "retrieve-runbook"
  | "share-observations"
  | "block-remediation"
  | "run-broad-log-query"
  | "detect-tool-failure"
  | "preserve-completed-work"
  | "retry-narrow-query"
  | "complete-log-retry"
  | "reconcile-evidence"
  | "evaluate-output"
  | "assemble-remediation"
  | "await-approval"
  | "revise-remediation"
  | "await-reapproval"
  | "execute-decision"
  | "verify-recovery"
  | "persist-outcome";

export type AgentApprovalState =
  | "pending-primary"
  | "safer-requested"
  | "pending-safer"
  | "approved-primary"
  | "approved-safer"
  | "stopped"
  | "stopped-safer";

export type AgentAccent = "input" | "generation" | "retrieval" | "evidence";
export type AgentEngineeringConcept = "harness" | "loop";
export type AgentHarnessFacetId =
  | "intent-skills"
  | "context-memory"
  | "tools-isolation"
  | "policy-authority"
  | "trace-evaluation";
export type AgentLoopStage =
  | "observe"
  | "decide"
  | "act"
  | "evaluate"
  | "adapt-exit";
export type AgentLoopPass =
  | "system-framing"
  | "investigation-1"
  | "investigation-2"
  | "remediation";
export type ArchitectureZone =
  | "entry"
  | "runtime"
  | "context"
  | "models"
  | "agents"
  | "tools"
  | "governance";

export type ArchitectureNodeId =
  | "incident-channel"
  | "human-approver"
  | "input-gateway"
  | "orchestrator"
  | "session-context"
  | "global-memory"
  | "skills-library"
  | "context-compactor"
  | "remote-llm"
  | "local-llm"
  | "metrics-agent"
  | "logs-agent"
  | "runbook-agent"
  | "remediation-agent"
  | "metrics-mcp"
  | "logs-mcp"
  | "knowledge-rag"
  | "cloud-control-mcp"
  | "output-hooks"
  | "verified-outcome";

export type ArchitectureNodeKind =
  | "channel"
  | "gateway"
  | "orchestrator"
  | "memory"
  | "skill"
  | "compactor"
  | "model"
  | "agent"
  | "mcp"
  | "rag"
  | "hook"
  | "approval"
  | "outcome";

export type ArchitectureFlowKind =
  | "request"
  | "context"
  | "model"
  | "handoff"
  | "tool"
  | "approval"
  | "memory";

export interface CloudOpsIncident {
  readonly id: "checkout-latency";
  readonly title: string;
  readonly alert: string;
  readonly service: string;
  readonly severity: "SEV-2";
  readonly metrics: readonly { readonly label: string; readonly value: string }[];
}

export interface ArchitectureNode {
  readonly id: ArchitectureNodeId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly zone: ArchitectureZone;
  readonly kind: ArchitectureNodeKind;
  readonly accent: AgentAccent;
  readonly firstTraceStep: number;
  readonly learning: ArchitectureLearningDetail;
}

export interface ArchitectureLearningDetail {
  readonly purpose: string;
  readonly stateAndAuthority: string;
  readonly designRationale: string;
  readonly risk: string;
}

export interface ArchitectureZoneLearningDetail extends ArchitectureLearningDetail {
  readonly label: string;
  readonly summary: string;
}

export type AgentDetailTarget =
  | { readonly kind: "node"; readonly nodeId: ArchitectureNodeId }
  | { readonly kind: "zone"; readonly zone: ArchitectureZone }
  | {
      readonly kind: "concept";
      readonly concept: AgentEngineeringConcept;
    };

export interface ArchitectureEdge {
  readonly id: string;
  readonly sourceId: ArchitectureNodeId;
  readonly targetId: ArchitectureNodeId;
  readonly label: string;
  readonly kind: ArchitectureFlowKind;
  readonly firstTraceStep: number;
}

export interface AgentModelEndpoint {
  readonly id: string;
  readonly label: string;
  readonly location: "remote" | "local";
  readonly stateless: true;
  readonly purpose: string;
}

export interface AgentSkill {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
}

export interface SpecialistAgent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly accent: AgentAccent;
  readonly modelEndpointId: string;
  readonly skillIds: readonly string[];
  readonly workingMemory: string;
  readonly toolServerIds: readonly string[];
}

export interface AgentTask {
  readonly id: string;
  readonly title: string;
  readonly ownerId: string;
  readonly dependsOn: readonly string[];
  readonly status: "planned" | "complete" | "recovered";
}

export interface McpServer {
  readonly id: string;
  readonly label: string;
  readonly access: "read" | "read-write";
  readonly tools: readonly string[];
  readonly authorization: string;
}

export interface AgentToolObservation {
  readonly id: string;
  readonly ownerId: string;
  readonly serverId: string;
  readonly input: string;
  readonly output: string;
  readonly provenance: string;
  readonly status: "success" | "failed" | "recovered";
}

export interface AgentMemoryStore {
  readonly id: string;
  readonly label: string;
  readonly scope: "session" | "global";
  readonly owner: "gateway";
  readonly retention: string;
  readonly entries: readonly string[];
}

export interface AgentPolicyHook {
  readonly id: string;
  readonly label: string;
  readonly phase: "input" | "action" | "output";
  readonly checks: readonly string[];
}

export interface AgentTraceStep {
  readonly number: number;
  readonly eventKind: AgentEventKind;
  readonly label: string;
  readonly packet: string;
  readonly nodeIds: readonly ArchitectureNodeId[];
  readonly edgeIds: readonly string[];
  readonly loopStage: AgentLoopStage;
  readonly loopPass: AgentLoopPass;
  readonly state?: "failed" | "retry" | "recovered";
}

export interface AgentHarnessFacet {
  readonly id: AgentHarnessFacetId;
  readonly label: string;
  readonly summary: string;
  readonly nodeIds: readonly ArchitectureNodeId[];
}

export interface AgentLoopStageDefinition {
  readonly id: AgentLoopStage;
  readonly label: string;
  readonly purpose: string;
}

export interface AgentLoopPolicy {
  readonly objective: string;
  readonly stages: readonly AgentLoopStageDefinition[];
  readonly retryBudget: string;
  readonly completionCriteria: readonly string[];
  readonly stopConditions: readonly string[];
}

export interface RemediationPlan {
  readonly id: "primary" | "safer";
  readonly title: string;
  readonly summary: string;
  readonly actions: readonly string[];
  readonly risk: string;
  readonly verificationWindow: string;
}

export interface AgentVerificationCheck {
  readonly id: string;
  readonly label: string;
  readonly result: string;
  readonly passed: boolean;
}

export interface AgentExternalAction {
  readonly id: string;
  readonly label: string;
  readonly status: "simulated-complete";
}

export interface AgentSimulation {
  readonly incident: CloudOpsIncident;
  readonly nodes: readonly ArchitectureNode[];
  readonly edges: readonly ArchitectureEdge[];
  readonly trace: readonly AgentTraceStep[];
  readonly models: readonly AgentModelEndpoint[];
  readonly skills: readonly AgentSkill[];
  readonly agents: readonly SpecialistAgent[];
  readonly tasks: readonly AgentTask[];
  readonly mcpServers: readonly McpServer[];
  readonly observations: readonly AgentToolObservation[];
  readonly memoryStores: readonly AgentMemoryStore[];
  readonly hooks: readonly AgentPolicyHook[];
  readonly harnessFacets: readonly AgentHarnessFacet[];
  readonly loopPolicy: AgentLoopPolicy;
  readonly primaryPlan: RemediationPlan;
  readonly saferPlan: RemediationPlan;
  readonly checks: readonly AgentVerificationCheck[];
  readonly approvalState: AgentApprovalState;
  readonly externalActions: readonly AgentExternalAction[];
}

export interface AgentRuntimeInput {
  readonly approvalState: AgentApprovalState;
}

export type AgentRuntimeResult = DemoRuntimeResult<AgentSimulation>;
export type AgentRuntimeAdapter = DemoRuntimeAdapter<
  AgentRuntimeInput,
  AgentRuntimeResult
>;
