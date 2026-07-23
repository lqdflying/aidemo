import { describe, expect, it } from "vitest";

import {
  AGENT_OPEN_SOURCE_REVIEW_DATE,
  agentComponentOpenSourceRecommendations,
  agentGroupOpenSourceRecommendations,
  agentOpenSourceCatalog,
  type AgentOpenSourceRecommendation,
  type AgentOpenSourceSolutionId,
  type AgentSolutionTrack,
} from "./agent-open-source";
import { simulateAgentArchitecture } from "./agent-simulator";

const prohibitedRecommendations = [
  "AutoGen",
  "Chainlit",
  "CloudEvents Python SDK",
  "LlamaAgents",
  "LlamaIndex QueryPipeline",
  "NATS Streaming",
  "OpenCensus",
  "OpenTracing",
  "Phoenix",
  "Semantic Kernel",
  "STAN",
];

function getTrackSolutionIds(
  track: AgentSolutionTrack,
): readonly AgentOpenSourceSolutionId[] {
  return [
    track.preferred.solutionId,
    ...track.companions.map(({ solutionId }) => solutionId),
    ...track.alternatives.map(({ solutionId }) => solutionId),
  ];
}

function getRecommendationSolutionIds(
  recommendation: AgentOpenSourceRecommendation,
): readonly AgentOpenSourceSolutionId[] {
  return [
    ...getTrackSolutionIds(recommendation),
    ...getTrackSolutionIds(recommendation.pythonEcosystem),
  ];
}

function expectValidTrack(
  track: AgentSolutionTrack,
  limits: { readonly alternatives: number; readonly companions: number },
): void {
  expect(track.preferred.useFor).not.toBe("");
  expect(track.companions.length).toBeLessThanOrEqual(limits.companions);
  expect(track.alternatives.length).toBeLessThanOrEqual(limits.alternatives);
  expect(track.decisionRule).not.toBe("");

  const solutionIds = getTrackSolutionIds(track);
  expect(new Set(solutionIds).size).toBe(solutionIds.length);
  for (const solutionId of solutionIds) {
    expect(agentOpenSourceCatalog[solutionId]).toBeDefined();
  }
}

function expectAuditedRecommendation(
  recommendation: AgentOpenSourceRecommendation,
): void {
  expect(recommendation.reviewedOn).toBe(AGENT_OPEN_SOURCE_REVIEW_DATE);
  expectValidTrack(recommendation, { alternatives: 2, companions: 3 });
  expectValidTrack(recommendation.pythonEcosystem, {
    alternatives: 3,
    companions: 3,
  });

  const pythonSolutionIds = getTrackSolutionIds(recommendation.pythonEcosystem);
  expect(agentOpenSourceCatalog[recommendation.pythonEcosystem.preferred.solutionId].releaseChannel)
    .toBe("stable");
  for (const solutionId of pythonSolutionIds) {
    expect(agentOpenSourceCatalog[solutionId].languages).toContain("Python");
  }
}

describe("agent open-source implementation catalog", () => {
  it("covers every group and component with audited architecture and Python tracks", () => {
    const model = simulateAgentArchitecture().data;

    expect(Object.keys(agentGroupOpenSourceRecommendations)).toEqual(
      model.groups.map(({ id }) => id),
    );
    expect(Object.keys(agentComponentOpenSourceRecommendations)).toEqual(
      model.components.map(({ id }) => id),
    );
    expect(Object.keys(agentGroupOpenSourceRecommendations)).toHaveLength(8);
    expect(Object.keys(agentComponentOpenSourceRecommendations)).toHaveLength(24);

    for (const recommendation of Object.values(agentGroupOpenSourceRecommendations)) {
      expectAuditedRecommendation(recommendation);
    }
    for (const recommendation of Object.values(agentComponentOpenSourceRecommendations)) {
      expectAuditedRecommendation(recommendation);
    }
  });

  it("uses only audited, stable, HTTPS, explicitly scoped catalog entries", () => {
    for (const solution of Object.values(agentOpenSourceCatalog)) {
      expect(solution.name).not.toBe("");
      expect(solution.description).not.toBe("");
      expect(solution.languages.length).toBeGreaterThan(0);
      expect(solution.license).not.toBe("");
      expect(solution.releaseChannel).toBe("stable");
      expect(solution.reviewedOn).toBe(AGENT_OPEN_SOURCE_REVIEW_DATE);
      expect(solution.officialUrl).toMatch(/^https:\/\//);
      expect(["full-project", "oss-core", "specification"]).toContain(
        solution.scope,
      );
    }
  });

  it("keeps every catalog entry useful and excludes superseded or unsuitable choices", () => {
    const allRecommendations = [
      ...Object.values(agentGroupOpenSourceRecommendations),
      ...Object.values(agentComponentOpenSourceRecommendations),
    ];
    const referencedSolutionIds = new Set(
      allRecommendations.flatMap(getRecommendationSolutionIds),
    );

    expect(referencedSolutionIds).toEqual(new Set(Object.keys(agentOpenSourceCatalog)));
    const serializedCatalog = JSON.stringify({
      agentOpenSourceCatalog,
      agentGroupOpenSourceRecommendations,
      agentComponentOpenSourceRecommendations,
    });
    for (const prohibitedName of prohibitedRecommendations) {
      expect(serializedCatalog).not.toContain(prohibitedName);
    }
  });

  it("pins time-sensitive guidance to stable channels without freezing versions", () => {
    expect(agentOpenSourceCatalog.mcp.name).toMatch(/stable official SDK/);
    expect(agentOpenSourceCatalog.mcp.name).not.toMatch(/v\d/);
    expect(agentGroupOpenSourceRecommendations.tools.decisionRule)
      .toMatch(/current stable release/i);
    expect(agentOpenSourceCatalog.vllm.officialUrl).toContain("/en/stable/");
    expect(agentOpenSourceCatalog.langfuse.scope).toBe("oss-core");
    expect(agentOpenSourceCatalog.litellm.scope).toBe("oss-core");
    expect(agentOpenSourceCatalog.mlflow.license).toBe("Apache-2.0");
  });

  it("records the current MCP, LlamaIndex, Ragas, and OpenTelemetry audit corrections", () => {
    expect(agentOpenSourceCatalog.mcp.license).toBe("Apache-2.0 / MIT transition");
    expect(agentOpenSourceCatalog).not.toHaveProperty("llama-agents");
    expect(agentOpenSourceCatalog["llama-index"]).toMatchObject({
      name: "LlamaIndex Workflows",
      license: "MIT",
      officialUrl: "https://docs.llamaindex.ai/en/stable/",
    });
    expect(agentOpenSourceCatalog.ragas.name).toContain("Vibrant Labs");
    expect(agentOpenSourceCatalog["opentelemetry-python"].description)
      .toMatch(/traces and metrics.*logs signal remains in development/i);
  });

  it("models the Python MCP ecosystem as distinct protocol, implementation, runtime, and gateway layers", () => {
    expect(agentOpenSourceCatalog.fastmcp).toMatchObject({
      kind: "Framework",
      languages: ["Python"],
      license: "Apache-2.0",
      officialUrl: "https://gofastmcp.com/getting-started/welcome",
    });
    expect(agentOpenSourceCatalog["langchain-mcp-adapters"]).toMatchObject({
      kind: "Library",
      languages: ["Python"],
      license: "MIT",
      officialUrl: "https://docs.langchain.com/oss/python/langchain/mcp",
    });
    expect(agentOpenSourceCatalog.contextforge).toMatchObject({
      kind: "Gateway",
      license: "Apache-2.0",
      officialUrl: "https://ibm.github.io/mcp-context-forge/latest/",
    });
    expect(agentOpenSourceCatalog["pydantic-ai"]).toMatchObject({
      name: "Pydantic AI",
      kind: "Framework",
      license: "MIT",
      officialUrl: "https://pydantic.dev/docs/ai/",
    });
    expect(agentOpenSourceCatalog["pydantic-ai"]).not.toBe(
      agentOpenSourceCatalog.pydantic,
    );

    expect(getTrackSolutionIds(agentGroupOpenSourceRecommendations.tools))
      .toEqual(expect.arrayContaining([
        "mcp",
        "fastmcp",
        "langchain-mcp-adapters",
        "contextforge",
        "pydantic-ai",
      ]));
    expect(getTrackSolutionIds(agentGroupOpenSourceRecommendations.tools.pythonEcosystem))
      .toEqual(expect.arrayContaining([
        "fastmcp",
        "langchain-mcp-adapters",
        "contextforge",
        "pydantic",
        "pydantic-ai",
      ]));
    expect(agentComponentOpenSourceRecommendations["function-tool"].preferred.solutionId)
      .toBe("fastmcp");
    expect(agentGroupOpenSourceRecommendations.tools.decisionRule)
      .toMatch(/Pydantic AI owns the runtime/i);
  });

  it("requires an explicit exception reason when architecture preferred is not Python-native", () => {
    const allRecommendations = [
      ...Object.entries(agentGroupOpenSourceRecommendations),
      ...Object.entries(agentComponentOpenSourceRecommendations),
    ];

    for (const [key, recommendation] of allRecommendations) {
      const preferredSolution = agentOpenSourceCatalog[recommendation.preferred.solutionId];
      const isPythonNative = (preferredSolution.languages as readonly string[]).includes("Python");
      if (!isPythonNative) {
        expect(recommendation.architectureExceptionReason, `${key}: non-Python preferred "${preferredSolution.name}" must have architectureExceptionReason`).toBeTruthy();
        expect(recommendation.architectureExceptionReason!.length).toBeGreaterThan(20);
      }
    }
  });

  it("keeps Python durability choices visible without presenting Temporal as Python-native", () => {
    const allRecommendations = [
      ...Object.values(agentGroupOpenSourceRecommendations),
      ...Object.values(agentComponentOpenSourceRecommendations),
    ];
    const pythonSolutionIds = allRecommendations.flatMap(({ pythonEcosystem }) =>
      getTrackSolutionIds(pythonEcosystem)
    );

    expect(pythonSolutionIds).not.toContain("temporal");
    expect(agentComponentOpenSourceRecommendations["task-scheduler"].pythonEcosystem.preferred.solutionId)
      .toBe("dbos");
    expect(agentComponentOpenSourceRecommendations["action-tool"].pythonEcosystem.preferred.solutionId)
      .toBe("dbos");
    expect(agentComponentOpenSourceRecommendations["retrieval-tool"].pythonEcosystem.alternatives)
      .toContainEqual(expect.objectContaining({
        solutionId: "airflow",
        useFor: expect.stringMatching(/offline.*never the online/i),
      }));
  });
});
