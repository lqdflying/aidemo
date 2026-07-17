import { describe, expect, it } from "vitest";

import {
  agentComponentBlueprints,
  agentGroupBlueprints,
  type AgentPlatformDetailSpec,
} from "./agent-platform-details";
import { simulateAgentArchitecture } from "./agent-simulator";

const legacyFactLabels = new Set([
  "Role",
  "Receives",
  "Returns",
  "Owns / does not own",
  "Engineer note",
  "Common risk",
]);

function expectCompleteBlueprint(spec: AgentPlatformDetailSpec): void {
  expect(spec.title).not.toBe("");
  expect(spec.summary).not.toBe("");
  expect(spec.caption).not.toBe("");
  expect(spec.artifacts.length).toBeGreaterThanOrEqual(2);
  expect(spec.artifacts.length).toBeLessThanOrEqual(3);
  for (const item of spec.artifacts) {
    expect(item.title).not.toBe("");
    expect(item.description).not.toBe("");
    expect(legacyFactLabels.has(item.eyebrow)).toBe(false);
  }
}

describe("agent platform engineering blueprints", () => {
  it("covers every group and component exactly once", () => {
    const model = simulateAgentArchitecture().data;

    expect(Object.keys(agentGroupBlueprints)).toEqual(model.groups.map(({ id }) => id));
    expect(Object.keys(agentComponentBlueprints)).toEqual(
      model.components.map(({ id }) => id),
    );
    expect(Object.keys(agentGroupBlueprints)).toHaveLength(8);
    expect(Object.keys(agentComponentBlueprints)).toHaveLength(24);

    for (const spec of Object.values(agentGroupBlueprints)) expectCompleteBlueprint(spec);
    for (const spec of Object.values(agentComponentBlueprints)) expectCompleteBlueprint(spec);
  });

  it("uses every approved visual archetype", () => {
    const kinds = new Set([
      ...Object.values(agentGroupBlueprints),
      ...Object.values(agentComponentBlueprints),
    ].map(({ kind }) => kind));

    expect(kinds).toEqual(new Set([
      "source-map",
      "pipeline",
      "sequence",
      "state-machine",
      "control-loop",
      "routing-matrix",
      "fan-out",
      "lifecycle",
      "decision-gate",
      "trace-tree",
      "contract-boundary",
    ]));
  });

  it("models tools, MCP, search, RAG, data, actions, and typed returns separately", () => {
    const toolsBlueprint = JSON.stringify(agentGroupBlueprints.tools);

    for (const term of [
      "Built-in functions & APIs",
      "MCP servers",
      "MCP prompts",
      "Global & enterprise search",
      "RAG corpus & index",
      "Offline RAG knowledge lifecycle",
      "Governed data query",
      "Action executor",
      "Result<T> | TypedError",
      "Evidence bundle",
      "Action receipt",
    ]) {
      expect(toolsBlueprint).toContain(term);
    }
  });

  it("turns generic workers into bounded research, analysis, and execution patterns", () => {
    expect(agentComponentBlueprints["worker-a"].title).toMatch(/research pattern/);
    expect(agentComponentBlueprints["worker-b"].title).toMatch(/analysis pattern/);
    expect(agentComponentBlueprints["worker-c"].title).toMatch(/execution pattern/);
  });
});
