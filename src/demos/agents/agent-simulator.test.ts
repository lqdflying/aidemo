import { describe, expect, it } from "vitest";

import { validateStory } from "../../framework/story";
import {
  agentEngineeringConceptLearning,
  architectureZoneLearning,
  architectureZones,
} from "./agent-knowledge";
import { agentPhases } from "./agent-routing";
import { simulateAgentOrchestration } from "./agent-simulator";
import { agentPhaseStories, agentStory } from "./agent-story";

describe("agent orchestration simulation", () => {
  it("is deterministic and models the complete runtime topology", () => {
    const first = simulateAgentOrchestration("pending-primary");
    const second = simulateAgentOrchestration("pending-primary");

    expect(first).toEqual(second);
    expect(first.data.nodes).toHaveLength(20);
    expect(first.data.agents).toHaveLength(4);
    expect(first.data.mcpServers).toHaveLength(4);
    expect(first.data.trace).toHaveLength(32);
    expect(first.data.harnessFacets).toHaveLength(5);
    expect(first.data.loopPolicy.stages).toHaveLength(5);
    expect(first.data.checks.every((check) => check.passed)).toBe(true);
  });

  it("keeps models stateless and memory owned by the gateway", () => {
    const simulation = simulateAgentOrchestration().data;

    expect(simulation.models.every((model) => model.stateless)).toBe(true);
    expect(simulation.memoryStores.every((store) => store.owner === "gateway")).toBe(true);
    expect(
      simulation.memoryStores.find((store) => store.scope === "session")?.retention,
    ).toMatch(/75%/);
  });

  it("keeps every graph and trace reference valid", () => {
    const simulation = simulateAgentOrchestration().data;
    const nodeIds = new Set(simulation.nodes.map((node) => node.id));
    const edgeIds = new Set(simulation.edges.map((edge) => edge.id));

    for (const edge of simulation.edges) {
      expect(nodeIds.has(edge.sourceId)).toBe(true);
      expect(nodeIds.has(edge.targetId)).toBe(true);
    }

    for (const step of simulation.trace) {
      expect(step.nodeIds.every((nodeId) => nodeIds.has(nodeId))).toBe(true);
      expect(step.edgeIds.every((edgeId) => edgeIds.has(edgeId))).toBe(true);
      expect(simulation.loopPolicy.stages.some((stage) => stage.id === step.loopStage)).toBe(true);
      expect(step.loopPass).not.toBe("");
    }
  });

  it("provides complete architecture learning content for every component and layer", () => {
    const simulation = simulateAgentOrchestration().data;

    for (const node of simulation.nodes) {
      expect(node.learning.purpose).not.toBe("");
      expect(node.learning.stateAndAuthority).not.toBe("");
      expect(node.learning.designRationale).not.toBe("");
      expect(node.learning.risk).not.toBe("");
    }

    for (const zone of architectureZones) {
      const learning = architectureZoneLearning[zone];
      expect(learning.label).not.toBe("");
      expect(learning.summary).not.toBe("");
      expect(learning.purpose).not.toBe("");
      expect(learning.stateAndAuthority).not.toBe("");
      expect(learning.designRationale).not.toBe("");
      expect(learning.risk).not.toBe("");
    }

    for (const learning of Object.values(agentEngineeringConceptLearning)) {
      expect(learning.label).not.toBe("");
      expect(learning.summary).not.toBe("");
      expect(learning.purpose).not.toBe("");
      expect(learning.stateAndAuthority).not.toBe("");
      expect(learning.designRationale).not.toBe("");
      expect(learning.risk).not.toBe("");
      expect(learning.relationship).not.toBe("");
    }

    const coordinator = simulation.nodes.find((node) => node.id === "orchestrator");
    const remediationAgent = simulation.nodes.find((node) => node.id === "remediation-agent");
    expect(coordinator?.learning.designRationale).toMatch(/Router/);
    expect(coordinator?.learning.designRationale).toMatch(/DAG/);
    expect(remediationAgent?.learning.designRationale).toMatch(/DAG/);
  });

  it("records a failed log query and a recovered retry without losing other work", () => {
    const simulation = simulateAgentOrchestration().data;
    const failed = simulation.observations.find((observation) => observation.status === "failed");
    const recovered = simulation.observations.find((observation) => observation.status === "recovered");

    expect(failed?.output).toMatch(/timed out/i);
    expect(recovered?.output).toMatch(/worker-pool exhaustion/i);
    expect(
      simulation.observations.find((observation) => observation.id === "metrics-saturation")?.status,
    ).toBe("success");
    expect(
      simulation.observations.find((observation) => observation.id === "runbook-retrieval")?.provenance,
    ).toContain("KB-17");
  });

  it("keeps a failed call separate from its later retry", () => {
    const simulation = simulateAgentOrchestration().data;
    const blocked = simulation.trace.find((step) => step.eventKind === "block-remediation");
    const running = simulation.trace.find((step) => step.eventKind === "run-broad-log-query");
    const failed = simulation.trace.find((step) => step.eventKind === "detect-tool-failure");
    const adapt = simulation.trace.find((step) => step.eventKind === "preserve-completed-work");
    const retry = simulation.trace.find((step) => step.eventKind === "retry-narrow-query");
    const recovered = simulation.trace.find((step) => step.eventKind === "complete-log-retry");

    expect(blocked?.nodeIds).not.toContain("remediation-agent");
    expect(blocked?.edgeIds).toEqual([]);
    expect(running?.state).toBeUndefined();
    expect(running?.packet).toMatch(/awaiting result/);
    expect(running?.loopStage).toBe("act");
    expect(failed?.state).toBe("failed");
    expect(failed?.packet).toMatch(/no result/);
    expect(failed?.loopStage).toBe("evaluate");
    expect(failed?.loopPass).toBe("investigation-1");
    expect(adapt?.loopStage).toBe("adapt-exit");
    expect(adapt?.loopPass).toBe("investigation-1");
    expect(retry?.state).toBe("retry");
    expect(retry?.packet).toMatch(/new call/);
    expect(retry?.loopStage).toBe("act");
    expect(retry?.loopPass).toBe("investigation-2");
    expect(recovered?.state).toBe("recovered");
    expect(recovered?.packet).toMatch(/result returned/);
    expect(recovered?.loopStage).toBe("evaluate");
    expect(running?.number).toBeLessThan(failed?.number ?? 0);
    expect(failed?.number).toBeLessThan(retry?.number ?? 0);
    expect(retry?.number).toBeLessThan(recovered?.number ?? 0);
  });

  it("never creates Cloud Control actions before approval or after a safe stop", () => {
    expect(simulateAgentOrchestration("pending-primary").data.externalActions).toEqual([]);
    expect(simulateAgentOrchestration("pending-safer").data.externalActions).toEqual([]);
    expect(simulateAgentOrchestration("stopped").data.externalActions).toEqual([]);
    expect(simulateAgentOrchestration("stopped-safer").data.externalActions).toEqual([]);
    expect(simulateAgentOrchestration("approved-primary").data.externalActions).toHaveLength(2);
    expect(simulateAgentOrchestration("approved-safer").data.externalActions).toHaveLength(2);
  });

  it("adds a persistent outcome only after a terminal human decision", () => {
    const pending = simulateAgentOrchestration("pending-primary").data.memoryStores
      .find((store) => store.scope === "global");
    const approved = simulateAgentOrchestration("approved-safer").data.memoryStores
      .find((store) => store.scope === "global");
    const stopped = simulateAgentOrchestration("stopped").data.memoryStores
      .find((store) => store.scope === "global");

    expect(pending?.entries).toHaveLength(1);
    expect(approved?.entries.at(-1)).toMatch(/restored p95/i);
    expect(stopped?.entries.at(-1)).toMatch(/no Cloud Control action/i);
  });
});

describe("agent orchestration stories", () => {
  it("validates the complete story and every routed phase", () => {
    expect(() => validateStory(agentStory)).not.toThrow();

    for (const phase of agentPhases) {
      expect(() => validateStory(agentPhaseStories[phase])).not.toThrow();
    }
  });

  it("provides a seven-minute one-timescale guided sequence", () => {
    const durationMs = agentStory.scenes
      .flatMap((scene) => scene.events)
      .reduce((total, event) => total + event.durationMs, 0);

    expect(durationMs).toBe(420_000);
  });

  it("has one visible trace contract for every story event", () => {
    const storyKinds = agentStory.scenes.flatMap((scene) =>
      scene.events.map((event) => event.kind),
    );
    const traceKinds = simulateAgentOrchestration().data.trace.map(
      (step) => step.eventKind,
    );

    expect(traceKinds).toEqual(storyKinds);
  });

  it("blocks remediation until the separate retry has recovered evidence", () => {
    const executeEvents = agentPhaseStories.execute.scenes.flatMap(
      (scene) => scene.events,
    );
    const recoverEvents = agentPhaseStories.recover.scenes.flatMap(
      (scene) => scene.events,
    );

    expect(executeEvents.at(-1)?.kind).toBe("block-remediation");
    expect(executeEvents.at(-1)?.title).toMatch(/stays blocked/);
    expect(recoverEvents.map((event) => event.kind)).toEqual([
      "run-broad-log-query",
      "detect-tool-failure",
      "preserve-completed-work",
      "retry-narrow-query",
      "complete-log-retry",
      "reconcile-evidence",
      "evaluate-output",
    ]);
    expect(
      recoverEvents.reduce((total, event) => total + event.durationMs, 0),
    ).toBe(75_000);
    expect(
      recoverEvents.find((event) => event.kind === "retry-narrow-query")?.title,
    ).toMatch(/Retry/);
    expect(
      recoverEvents.find((event) => event.kind === "complete-log-retry")?.title,
    ).toMatch(/returns usable evidence/);
    expect(recoverEvents.at(-1)?.explanation).toMatch(/after the separate retry succeeds/);
  });
});
