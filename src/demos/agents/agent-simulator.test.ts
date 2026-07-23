import { describe, expect, it } from "vitest";

import { validateStory } from "../../framework/story";
import {
  buildAgentFlowLegViews,
  getAgentLessonStep,
  isClosedControlCycle,
} from "./agent-diagram-model";
import { agentGroupOrder } from "./agent-knowledge";
import { agentComponentBlueprints, agentGroupBlueprints } from "./agent-platform-details";
import { agentPhases } from "./agent-routing";
import { simulateAgentArchitecture } from "./agent-simulator";
import { agentPhaseStories, agentStory } from "./agent-story";

describe("generic agent architecture model", () => {
  it("is deterministic and contains every reusable architecture atom once", () => {
    const first = simulateAgentArchitecture();
    const second = simulateAgentArchitecture();
    const model = first.data;

    expect(first).toEqual(second);
    expect(model.groups.map(({ id }) => id)).toEqual(agentGroupOrder);
    expect(model.groups).toHaveLength(8);
    expect(model.components).toHaveLength(24);
    expect(model.relationships).toHaveLength(12);
    expect(model.concepts).toHaveLength(3);
    expect(model.trace).toHaveLength(17);

    const declaredIds = model.groups.flatMap(({ componentIds }) => componentIds);
    const componentIds = model.components.map(({ id }) => id);
    expect(declaredIds).toHaveLength(new Set(declaredIds).size);
    expect(new Set(declaredIds)).toEqual(new Set(componentIds));

    for (const component of model.components) {
      const owner = model.groups.find(({ id }) => id === component.groupId);
      expect(owner?.componentIds).toContain(component.id);
    }
  });

  it("resolves every relationship, trace leg, and closed control cycle", () => {
    const model = simulateAgentArchitecture().data;
    const groupIds = new Set(model.groups.map(({ id }) => id));
    const relationshipIds = new Set(model.relationships.map(({ id }) => id));
    const componentIds = new Set(model.components.map(({ id }) => id));

    for (const relationship of model.relationships) {
      expect(groupIds.has(relationship.sourceGroupId)).toBe(true);
      expect(groupIds.has(relationship.targetGroupId)).toBe(true);
      if (relationship.interaction === "exchange") {
        expect(relationship.returnLabel).not.toBe("");
        expect(relationship.returnTone).toBe("response");
      }
    }

    for (const step of model.trace) {
      expect(step.activeComponentIds.every((id) => componentIds.has(id))).toBe(true);
      expect(step.contractLegs.every((leg) => relationshipIds.has(leg.relationshipId))).toBe(true);
    }

    expect(model.cycles).toHaveLength(1);
    expect(isClosedControlCycle(model)).toBe(true);
  });

  it("animates every relationship in a lesson or the system overview", () => {
    const model = simulateAgentArchitecture().data;
    const lessonRelationshipIds = new Set(
      model.trace.flatMap(({ contractLegs }) =>
        contractLegs.map(({ relationshipId }) => relationshipId),
      ),
    );
    const overviewRelationshipIds = new Set(
      buildAgentFlowLegViews(
        model,
        getAgentLessonStep(model, "show-harness"),
      ).map(({ relationship }) => relationship.id),
    );
    const animatedRelationshipIds = new Set([
      ...lessonRelationshipIds,
      ...overviewRelationshipIds,
    ]);

    expect([...animatedRelationshipIds].sort()).toEqual(
      model.relationships.map(({ id }) => id).slice().sort(),
    );
  });

  it("keeps concept takeaways complete", () => {
    const model = simulateAgentArchitecture().data;
    for (const concept of model.concepts) {
      expect(concept.takeaways.engineeringPrinciple).not.toBe("");
      expect(concept.takeaways.failureMode).not.toBe("");
    }
  });

  it("models failure and retry as separate calls with exact direction", () => {
    const trace = simulateAgentArchitecture().data.trace;
    const attempts = trace.filter((step) => step.topology === "retry");

    expect(attempts.map(({ eventKind }) => eventKind)).toEqual([
      "start-tool-attempt",
      "record-tool-failure",
      "retry-tool-call",
      "accept-tool-result",
    ]);
    expect(attempts.map(({ attempt }) => attempt)).toEqual([1, 1, 2, 2]);
    expect(attempts.map(({ state }) => state)).toEqual([
      "active",
      "failed",
      "retry",
      "recovered",
    ]);
    expect(attempts.map(({ contractLegs }) => contractLegs)).toEqual([
      [{ relationshipId: "agents-to-tools", direction: "forward" }],
      [{ relationshipId: "agents-to-tools", direction: "forward" }],
      [{ relationshipId: "agents-to-tools", direction: "forward" }],
      [{ relationshipId: "agents-to-tools", direction: "return" }],
    ]);
    expect(attempts.map(({ attemptStatuses }) => attemptStatuses)).toEqual([
      ["running", "waiting"],
      ["timed-out", "waiting"],
      ["timed-out", "running"],
      ["timed-out", "returned"],
    ]);
  });

  it("keeps scenario language out of the generic teaching model", () => {
    const modelText = JSON.stringify(simulateAgentArchitecture().data);
    const storyText = JSON.stringify(agentStory);
    const scenarioTerms = /CloudOps|checkout|Logs MCP|remediation|Cloud Control|incident/i;

    expect(modelText).not.toMatch(scenarioTerms);
    expect(storyText).not.toMatch(scenarioTerms);
  });

  it("uses plain-first canvas labels and reserves specialist terms for details", () => {
    const model = simulateAgentArchitecture().data;
    const visibleCopy = JSON.stringify({
      groups: model.groups.map(({ label, shortLabel, summary }) => ({ label, shortLabel, summary })),
      components: model.components.map(({ label, shortLabel }) => ({ label, shortLabel })),
      trace: model.trace.map(({ label, summary, patternLabel }) => ({ label, summary, patternLabel })),
    });
    const engineeringBlueprints = JSON.stringify({
      groups: agentGroupBlueprints,
      components: agentComponentBlueprints,
    });

    expect(visibleCopy).not.toMatch(/\b(?:MCP|RAG|DAG)\b/);
    expect(engineeringBlueprints).toMatch(/\bMCP\b/);
    expect(engineeringBlueprints).toMatch(/\bRAG\b/);
    expect(engineeringBlueprints).toMatch(/\bDAG\b/);
  });
});

describe("agent architecture stories", () => {
  it("validates the complete story and every routed lesson", () => {
    expect(() => validateStory(agentStory)).not.toThrow();
    for (const phase of agentPhases) {
      expect(() => validateStory(agentPhaseStories[phase])).not.toThrow();
    }
  });

  it("provides one trace lesson for every story event", () => {
    const storyKinds = agentStory.scenes.flatMap((scene) =>
      scene.events.map(({ kind }) => kind),
    );
    const traceKinds = simulateAgentArchitecture().data.trace.map(
      ({ eventKind }) => eventKind,
    );

    expect(traceKinds).toEqual(storyKinds);
    expect(agentStory.scenes.flatMap(({ events }) => events)
      .reduce((total, event) => total + event.durationMs, 0)).toBe(157_000);
  });

  it("preserves the six teachable deep-link lessons", () => {
    expect(Object.keys(agentPhaseStories)).toEqual(agentPhases);
    expect(agentPhaseStories.overview.scenes[0]?.shortTitle).toBe("System");
    expect(agentPhaseStories.prepare.scenes[0]?.shortTitle).toBe("Input + context");
    expect(agentPhaseStories.route.scenes[0]?.shortTitle).toBe("Models + agents");
    expect(agentPhaseStories.execute.scenes[0]?.shortTitle).toBe("Tools");
    expect(agentPhaseStories.recover.scenes[0]?.shortTitle).toBe("Timeouts + retries");
    expect(agentPhaseStories.govern.scenes[0]?.shortTitle).toBe("Govern + return");
  });
});
