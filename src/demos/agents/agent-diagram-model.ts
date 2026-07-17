import { agentTopologyLabels } from "./agent-knowledge";
import {
  getAgentComponentBlueprint,
  getAgentGroupBlueprint,
  type AgentPlatformDetailSpec,
} from "./agent-platform-details";
import {
  getAgentComponentOpenSourceRecommendation,
  getAgentGroupOpenSourceRecommendation,
  type AgentOpenSourceRecommendation,
} from "./agent-open-source";
import type {
  AgentAccent,
  AgentArchitectureModel,
  AgentComponent,
  AgentComponentGroup,
  AgentConcept,
  AgentConceptTakeaways,
  AgentContractDirection,
  AgentContractLeg,
  AgentDetailTarget,
  AgentEventKind,
  AgentFlowTone,
  AgentGroupId,
  AgentLessonState,
  AgentLessonStep,
  AgentRelationship,
  AgentRelationshipId,
  AgentTopologyKind,
} from "./agent-types";

export interface AgentRelationshipView {
  readonly relationship: AgentRelationship;
  readonly activeDirections: readonly AgentContractDirection[];
  readonly state: AgentLessonState;
}

export interface AgentFlowLegView {
  readonly id: string;
  readonly relationship: AgentRelationship;
  readonly direction: AgentContractDirection;
  readonly sourceGroupId: AgentGroupId;
  readonly targetGroupId: AgentGroupId;
  readonly label: string;
  readonly tone: AgentFlowTone;
  readonly phaseIndex: number;
  readonly phaseCount: 1 | 2 | 3 | 12;
  readonly schedule: "lesson" | "system-overview";
  readonly state: AgentLessonState;
}

interface SystemOverviewFlowLeg {
  readonly relationshipId: AgentRelationshipId;
  readonly direction: AgentContractDirection;
  readonly phaseIndex: number;
}

const systemOverviewFlow: readonly SystemOverviewFlowLeg[] = [
  { relationshipId: "entry-to-runtime", direction: "forward", phaseIndex: 0 },
  { relationshipId: "runtime-to-context", direction: "forward", phaseIndex: 1 },
  { relationshipId: "runtime-to-context", direction: "return", phaseIndex: 2 },
  { relationshipId: "runtime-to-models", direction: "forward", phaseIndex: 3 },
  { relationshipId: "runtime-to-models", direction: "return", phaseIndex: 4 },
  { relationshipId: "runtime-to-agents", direction: "forward", phaseIndex: 5 },
  { relationshipId: "agents-to-tools", direction: "forward", phaseIndex: 6 },
  { relationshipId: "agents-to-tools", direction: "return", phaseIndex: 7 },
  { relationshipId: "agents-to-governance", direction: "forward", phaseIndex: 8 },
  { relationshipId: "governance-to-tools", direction: "forward", phaseIndex: 9 },
  { relationshipId: "tools-to-outcome", direction: "forward", phaseIndex: 10 },
  { relationshipId: "outcome-to-context", direction: "forward", phaseIndex: 11 },
  { relationshipId: "outcome-to-entry", direction: "forward", phaseIndex: 11 },
];

interface AgentDetailContentBase {
  readonly eyebrow: "Component" | "Group" | "Concept";
  readonly label: string;
  readonly summary: string;
  readonly accent: AgentAccent;
}

export type AgentDetailContent = AgentDetailContentBase & (
  | {
      readonly kind: "platform";
      readonly blueprint: AgentPlatformDetailSpec;
      readonly openSourceRecommendation: AgentOpenSourceRecommendation;
    }
  | {
      readonly kind: "concept";
      readonly takeaways: AgentConceptTakeaways;
    }
);

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

export function getAgentLessonStep(
  model: AgentArchitectureModel,
  eventKind: AgentEventKind,
): AgentLessonStep {
  const step = model.trace.find((candidate) => candidate.eventKind === eventKind);
  if (!step) {
    throw new Error(`Missing architecture lesson for event "${eventKind}".`);
  }
  return step;
}

export function getAgentComponent(
  model: AgentArchitectureModel,
  componentId: AgentComponent["id"],
): AgentComponent {
  const component = model.components.find((candidate) => candidate.id === componentId);
  if (!component) {
    throw new Error(`Missing agent component "${componentId}".`);
  }
  return component;
}

export function getAgentGroup(
  model: AgentArchitectureModel,
  groupId: AgentGroupId,
): AgentComponentGroup {
  const group = model.groups.find((candidate) => candidate.id === groupId);
  if (!group) {
    throw new Error(`Missing agent group "${groupId}".`);
  }
  return group;
}

export function getAgentRelationship(
  model: AgentArchitectureModel,
  relationshipId: AgentRelationshipId,
): AgentRelationship {
  const relationship = model.relationships.find(
    (candidate) => candidate.id === relationshipId,
  );
  if (!relationship) {
    throw new Error(`Missing agent relationship "${relationshipId}".`);
  }
  return relationship;
}

export function getAgentConcept(
  model: AgentArchitectureModel,
  conceptId: AgentConcept["id"],
): AgentConcept {
  const concept = model.concepts.find((candidate) => candidate.id === conceptId);
  if (!concept) {
    throw new Error(`Missing agent concept "${conceptId}".`);
  }
  return concept;
}

export function getAgentDetailContent(
  model: AgentArchitectureModel,
  target: AgentDetailTarget,
): AgentDetailContent {
  if (target.kind === "component") {
    const component = getAgentComponent(model, target.componentId);
    const blueprint = getAgentComponentBlueprint(target.componentId);
    return {
      kind: "platform",
      eyebrow: "Component",
      label: blueprint.title,
      summary: blueprint.summary,
      accent: component.accent,
      blueprint,
      openSourceRecommendation: getAgentComponentOpenSourceRecommendation(
        target.componentId,
      ),
    };
  }

  if (target.kind === "group") {
    const group = getAgentGroup(model, target.groupId);
    const blueprint = getAgentGroupBlueprint(target.groupId);
    return {
      kind: "platform",
      eyebrow: "Group",
      label: blueprint.title,
      summary: blueprint.summary,
      accent: group.accent,
      blueprint,
      openSourceRecommendation: getAgentGroupOpenSourceRecommendation(target.groupId),
    };
  }

  const concept = getAgentConcept(model, target.conceptId);
  return {
    kind: "concept",
    eyebrow: "Concept",
    label: concept.label,
    summary: concept.summary,
    accent: "generation",
    takeaways: concept.takeaways,
  };
}

export function getAgentDetailTargetKey(target: AgentDetailTarget | null): string {
  if (!target) return "current-lesson";
  if (target.kind === "component") return `component:${target.componentId}`;
  if (target.kind === "group") return `group:${target.groupId}`;
  return `concept:${target.conceptId}`;
}

export function getActiveGroupIds(
  model: AgentArchitectureModel,
  step: AgentLessonStep,
): readonly AgentGroupId[] {
  const activeComponentIds = new Set(step.activeComponentIds);
  const activeGroups = model.components
    .filter((component) => activeComponentIds.has(component.id))
    .map((component) => component.groupId);

  for (const leg of step.contractLegs) {
    const relationship = getAgentRelationship(model, leg.relationshipId);
    activeGroups.push(relationship.sourceGroupId, relationship.targetGroupId);
  }

  return unique(activeGroups);
}

export function buildRelationshipViews(
  model: AgentArchitectureModel,
  step: AgentLessonStep,
): readonly AgentRelationshipView[] {
  return model.relationships.map((relationship) => ({
    relationship,
    activeDirections: unique(
      step.contractLegs
        .filter((leg) => leg.relationshipId === relationship.id)
        .map((leg) => leg.direction),
    ),
    state: step.state,
  }));
}

function getFlowPhaseCount(step: AgentLessonStep): 1 | 2 | 3 {
  if (step.topology === "fan-out") return 1;

  switch (step.contractLegs.length) {
    case 0:
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    default:
      throw new Error(
        `Unsupported ${step.contractLegs.length}-phase flow for "${step.eventKind}".`,
      );
  }
}

function getFlowTone(
  relationship: AgentRelationship,
  direction: AgentContractDirection,
): AgentFlowTone {
  if (direction === "forward") return relationship.forwardTone;
  if (relationship.interaction === "exchange") return relationship.returnTone;
  throw new Error(`Relationship "${relationship.id}" does not define a return flow.`);
}

export function buildAgentFlowLegViews(
  model: AgentArchitectureModel,
  step: AgentLessonStep,
): readonly AgentFlowLegView[] {
  if (step.eventKind === "show-harness") {
    return systemOverviewFlow.map(({ relationshipId, direction, phaseIndex }) => {
      const relationship = getAgentRelationship(model, relationshipId);
      const sourceGroupId = direction === "forward"
        ? relationship.sourceGroupId
        : relationship.targetGroupId;
      const targetGroupId = direction === "forward"
        ? relationship.targetGroupId
        : relationship.sourceGroupId;

      return {
        id: `${relationshipId}:${direction}`,
        relationship,
        direction,
        sourceGroupId,
        targetGroupId,
        label: direction === "return" && relationship.interaction === "exchange"
          ? relationship.returnLabel
          : relationship.label,
        tone: getFlowTone(relationship, direction),
        phaseIndex,
        phaseCount: 12,
        schedule: "system-overview",
        state: step.state,
      };
    });
  }

  const phaseCount = getFlowPhaseCount(step);

  return step.contractLegs.map((leg, index) => {
    const relationship = getAgentRelationship(model, leg.relationshipId);
    const sourceGroupId = leg.direction === "forward"
      ? relationship.sourceGroupId
      : relationship.targetGroupId;
    const targetGroupId = leg.direction === "forward"
      ? relationship.targetGroupId
      : relationship.sourceGroupId;
    const label = leg.direction === "return" && relationship.interaction === "exchange"
      ? relationship.returnLabel
      : relationship.label;

    return {
      id: `${leg.relationshipId}:${leg.direction}`,
      relationship,
      direction: leg.direction,
      sourceGroupId,
      targetGroupId,
      label,
      tone: getFlowTone(relationship, leg.direction),
      phaseIndex: step.topology === "fan-out" ? 0 : index,
      phaseCount,
      schedule: "lesson",
      state: step.state,
    };
  });
}

export function getLegEndpoints(
  model: AgentArchitectureModel,
  leg: AgentContractLeg,
): readonly [AgentGroupId, AgentGroupId] {
  const relationship = getAgentRelationship(model, leg.relationshipId);
  return leg.direction === "forward"
    ? [relationship.sourceGroupId, relationship.targetGroupId]
    : [relationship.targetGroupId, relationship.sourceGroupId];
}

export function isClosedControlCycle(
  model: AgentArchitectureModel,
  cycle = model.cycles[0],
): boolean {
  if (!cycle || cycle.legs.length < 2) return false;
  const endpoints = cycle.legs.map((leg) => getLegEndpoints(model, leg));
  return endpoints.every(([, target], index) => {
    const nextSource = endpoints[(index + 1) % endpoints.length]?.[0];
    return target === nextSource;
  });
}

export function getTopologyDescription(topology: AgentTopologyKind): string {
  const descriptions: Readonly<Record<AgentTopologyKind, string>> = {
    system: "All component groups stay fixed while the lesson changes focus.",
    sequence: "Each arrow moves one way to the next responsibility.",
    "pair-loop": "The request moves forward and a separate result returns.",
    star: "One coordinator is the hub for several bounded workers.",
    cycle: "The final arrow returns to the first responsibility and closes the loop.",
    retry: "A failed call ends before a new attempt starts in the same direction.",
    "fan-out": "One accepted outcome is distributed through separate contracts.",
  };
  return descriptions[topology];
}

export function getTopologyLabel(topology: AgentTopologyKind): string {
  return agentTopologyLabels[topology];
}

export function getActiveContractLabels(
  views: readonly AgentRelationshipView[],
): readonly string[] {
  return views.flatMap(({ relationship, activeDirections }) =>
    activeDirections.map((direction) => {
      const source = direction === "forward"
        ? relationship.sourceGroupId
        : relationship.targetGroupId;
      const target = direction === "forward"
        ? relationship.targetGroupId
        : relationship.sourceGroupId;
      const label = direction === "return" && relationship.interaction === "exchange"
        ? relationship.returnLabel
        : relationship.label;
      return `${source} → ${target}: ${label}`;
    }),
  );
}
