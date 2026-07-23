import { describe, expect, it } from "vitest";

import {
  buildAgentFlowLegViews,
  getActiveGroupIds,
  getAgentDetailContent,
  getAgentDetailTargetKey,
  getAgentDetailTargetLabel,
  getAgentLessonStep,
  getLegEndpoints,
  getTopologyDescription,
  isClosedControlCycle,
} from "./agent-diagram-model";
import { simulateAgentArchitecture } from "./agent-simulator";

describe("agent diagram model", () => {
  const model = simulateAgentArchitecture().data;

  it("labels focus targets for lesson inspect chips", () => {
    expect(getAgentDetailTargetLabel(model, { kind: "group", groupId: "runtime" }))
      .toBe("Orchestrator");
    expect(getAgentDetailTargetLabel(model, { kind: "concept", conceptId: "harness" }))
      .toBe("Agent harness");
    expect(getAgentDetailTargetLabel(model, { kind: "group", groupId: "outcome" }))
      .toBe("Outcome & return");
  });

  it("activates one direction for a sequence and two for an exchange loop", () => {
    const sequence = getAgentLessonStep(model, "accept-input");
    const exchange = getAgentLessonStep(model, "assemble-context");
    const sequenceFlow = buildAgentFlowLegViews(model, sequence);
    const exchangeFlow = buildAgentFlowLegViews(model, exchange);

    expect(sequenceFlow.map(({ relationship, direction }) => ({
      relationshipId: relationship.id,
      direction,
    }))).toEqual([
      { relationshipId: "entry-to-runtime", direction: "forward" },
    ]);
    expect(exchangeFlow.map(({ relationship, direction }) => ({
      relationshipId: relationship.id,
      direction,
    }))).toEqual([
      { relationshipId: "runtime-to-context", direction: "forward" },
      { relationshipId: "runtime-to-context", direction: "return" },
    ]);
    expect(getActiveGroupIds(model, sequence)).toEqual(["entry", "runtime"]);
  });

  it("schedules causal request-return, closed-cycle, and concurrent fan-out motion", () => {
    const exchange = buildAgentFlowLegViews(
      model,
      getAgentLessonStep(model, "call-model"),
    );
    const cycle = buildAgentFlowLegViews(
      model,
      getAgentLessonStep(model, "close-revision-loop"),
    );
    const fanOut = buildAgentFlowLegViews(
      model,
      getAgentLessonStep(model, "publish-outcome"),
    );

    expect(exchange.map(({ direction, label, tone, phaseIndex, phaseCount }) => ({
      direction,
      label,
      tone,
      phaseIndex,
      phaseCount,
    }))).toEqual([
      {
        direction: "forward",
        label: "prompt + context",
        tone: "request",
        phaseIndex: 0,
        phaseCount: 2,
      },
      {
        direction: "return",
        label: "response or tool intent",
        tone: "response",
        phaseIndex: 1,
        phaseCount: 2,
      },
    ]);
    expect(cycle.map(({ sourceGroupId, targetGroupId, phaseIndex }) => ({
      sourceGroupId,
      targetGroupId,
      phaseIndex,
    }))).toEqual([
      { sourceGroupId: "agents", targetGroupId: "governance", phaseIndex: 0 },
      { sourceGroupId: "governance", targetGroupId: "runtime", phaseIndex: 1 },
      { sourceGroupId: "runtime", targetGroupId: "agents", phaseIndex: 2 },
    ]);
    expect(fanOut.map(({ phaseIndex, phaseCount }) => ({ phaseIndex, phaseCount })))
      .toEqual([
        { phaseIndex: 0, phaseCount: 1 },
        { phaseIndex: 0, phaseCount: 1 },
      ]);
  });

  it("builds a separate thirteen-phase illustrative System loop", () => {
    const systemStep = getAgentLessonStep(model, "show-harness");
    const systemFlow = buildAgentFlowLegViews(model, systemStep);

    expect(systemStep.contractLegs).toEqual([]);
    expect(systemFlow).toHaveLength(14);
    expect(new Set(systemFlow.map(({ schedule }) => schedule)))
      .toEqual(new Set(["system-overview"]));
    expect(new Set(systemFlow.map(({ phaseCount }) => phaseCount)))
      .toEqual(new Set([13]));
    expect(systemFlow.filter(({ direction }) => direction === "return")
      .every(({ tone }) => tone === "response")).toBe(true);
    expect(systemFlow.find(({ relationship }) => relationship.id === "tools-to-outcome")?.tone)
      .toBe("response");
    expect(systemFlow.map(({ relationship, direction, phaseIndex }) => ({
      relationshipId: relationship.id,
      direction,
      phaseIndex,
    }))).toEqual([
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
      { relationshipId: "governance-to-outcome", direction: "forward", phaseIndex: 10 },
      { relationshipId: "tools-to-outcome", direction: "forward", phaseIndex: 11 },
      { relationshipId: "outcome-to-context", direction: "forward", phaseIndex: 12 },
      { relationshipId: "outcome-to-entry", direction: "forward", phaseIndex: 12 },
    ]);
  });

  it("carries failure, retry, and recovery on the exact contract leg", () => {
    const eventKinds = [
      "record-tool-failure",
      "retry-tool-call",
      "accept-tool-result",
    ] as const;
    const flows = eventKinds.map((eventKind) =>
      buildAgentFlowLegViews(model, getAgentLessonStep(model, eventKind)),
    );

    expect(flows.map((flow) => flow[0]?.state)).toEqual(["failed", "retry", "recovered"]);
    expect(flows.map((flow) => flow.map(({ direction }) => direction))).toEqual([
      ["forward"],
      ["forward"],
      ["return"],
    ]);
    expect(flows[0]).toMatchObject([
      { direction: "forward", tone: "request", state: "failed" },
    ]);
  });

  it("declares a visibly closed governance cycle", () => {
    const cycle = model.cycles[0];
    expect(isClosedControlCycle(model, cycle)).toBe(true);
    expect(cycle?.legs.map((leg) => getLegEndpoints(model, leg))).toEqual([
      ["agents", "governance"],
      ["governance", "runtime"],
      ["runtime", "agents"],
    ]);
  });

  it("provides topology-specific reading guidance", () => {
    expect(getTopologyDescription("sequence")).toMatch(/one way/i);
    expect(getTopologyDescription("pair-loop")).toMatch(/returns/i);
    expect(getTopologyDescription("star")).toMatch(/hub/i);
    expect(getTopologyDescription("cycle")).toMatch(/closes the loop/i);
    expect(getTopologyDescription("retry")).toMatch(/new attempt/i);
    expect(getTopologyDescription("fan-out")).toMatch(/distributed/i);
  });

  it("builds stable component, group, and concept inspector records", () => {
    const scheduler = getAgentDetailContent(model, {
      kind: "component",
      componentId: "task-scheduler",
    });
    const tools = getAgentDetailContent(model, { kind: "group", groupId: "tools" });
    const harness = getAgentDetailContent(model, {
      kind: "concept",
      conceptId: "harness",
    });

    expect(scheduler).toMatchObject({ eyebrow: "Component", label: "Task scheduler" });
    expect(scheduler.kind).toBe("platform");
    if (scheduler.kind !== "platform") throw new Error("Expected scheduler blueprint.");
    expect(scheduler.blueprint.kind).toBe("state-machine");
    expect(JSON.stringify(scheduler.blueprint)).toMatch(/DAG/);
    expect(scheduler.openSourceRecommendation.preferred.solutionId).toBe("temporal");
    expect(tools).toMatchObject({ eyebrow: "Group", label: "Tools & knowledge" });
    expect(tools.kind).toBe("platform");
    if (tools.kind !== "platform") throw new Error("Expected tools blueprint.");
    expect(tools.blueprint.kind).toBe("source-map");
    expect(JSON.stringify(tools.blueprint)).toMatch(/MCP/);
    expect(tools.openSourceRecommendation.preferred.solutionId).toBe("mcp");
    expect(harness).toMatchObject({ eyebrow: "Concept", label: "Agent harness" });
    expect(harness.kind).toBe("concept");
    if (harness.kind !== "concept") throw new Error("Expected concept detail.");
    expect(harness.takeaways.engineeringPrinciple).toMatch(/production system/);
    expect(getAgentDetailTargetKey(null)).toBe("current-lesson");
    expect(getAgentDetailTargetKey({ kind: "group", groupId: "tools" })).toBe("group:tools");
  });

  it("activates only the published fan-out contracts at the final lesson", () => {
    const step = getAgentLessonStep(model, "publish-outcome");
    const activeIds = buildAgentFlowLegViews(model, step)
      .map(({ relationship }) => relationship.id);

    expect(step.topology).toBe("fan-out");
    expect(activeIds).toEqual(["outcome-to-context", "outcome-to-entry"]);
    expect(step.activeComponentIds).toEqual(expect.arrayContaining([
      "response-publisher",
      "memory-writer",
      "trace-telemetry",
    ]));
  });
});
