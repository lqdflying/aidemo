import { describe, expect, it } from "vitest";

import { ragSimulationAdapter, simulateRag } from "./rag-simulator";

describe("RAG simulation adapter", () => {
  it("returns deterministic indexed, retrieved, and grounded output", async () => {
    const firstResult = await ragSimulationAdapter.run(
      "How does RAG make an answer more trustworthy?",
    );
    const repeatedResult = await ragSimulationAdapter.run(
      "How does RAG make an answer more trustworthy?",
    );

    expect(repeatedResult).toEqual(firstResult);
    expect(firstResult.adapterMode).toBe("simulation");
    expect(firstResult.data.indexedChunkCount).toBe(9);
    expect(firstResult.data.retrievedChunkCount).toBe(3);
    expect(firstResult.data.selectedEvidence).toHaveLength(3);
    expect(firstResult.data.contextWindow).toHaveLength(3);
    expect(
      firstResult.data.answer.every((claim) => claim.evidenceIds.length > 0),
    ).toBe(true);
  });

  it("reranks evidence for a custom embedding question", () => {
    const result = simulateRag(
      "Why are embeddings useful for semantic comparison?",
    );

    expect(result.data.question).toBe(
      "Why are embeddings useful for semantic comparison?",
    );
    expect(result.data.searchResults[0]?.chunk.id).toBe("chunk-7");
    expect(result.data.searchResults.slice(0, 3).every(({ selected }) => selected)).toBe(
      true,
    );
    expect(result.data.searchResults.slice(3).some(({ selected }) => selected)).toBe(
      false,
    );
  });

  it("uses the suggested question when input is empty", () => {
    expect(simulateRag("   ").data.question).toBe(
      "How does RAG make an answer more trustworthy?",
    );
  });
});
