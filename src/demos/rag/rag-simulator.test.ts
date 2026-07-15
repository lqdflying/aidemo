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
    expect(firstResult.data.embedding.modelName).toBe(
      "text-embedding-3-small",
    );
    expect(firstResult.data.embedding.outputDimensions).toBe(1536);
    expect(firstResult.data.embedding.dimensions).toBe(4);
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

  it("persists vector records with the documented stored shape", () => {
    const { data } = simulateRag(
      "How does RAG make an answer more trustworthy?",
    );

    expect(data.vectorRecords).toHaveLength(data.allChunks.length);

    for (const record of data.vectorRecords) {
      expect(record.id).toMatch(/^record-chunk-\d+$/);
      expect(record.vector).toHaveLength(4);
      expect(record.documentId).toBeTruthy();
      expect(record.documentTitle).toBeTruthy();
      expect(record.chunkLabel).toBeTruthy();
      expect(record.text).toBeTruthy();
    }

    const sample = data.vectorRecords[0]!;
    const sourceChunk = data.allChunks.find(
      (chunk) => chunk.id === sample.id.replace("record-", ""),
    );
    const sourceDocument = data.documents.find(
      (document) => document.id === sample.documentId,
    );

    expect(sourceChunk).toBeDefined();
    expect(sourceDocument).toBeDefined();
    expect(sample.vector).toEqual(sourceChunk!.vector);
    expect(sample.text).toBe(sourceChunk!.text);
    expect(sample.documentTitle).toBe(sourceDocument!.title);
  });

  it("shares one query vector between the retrieve display and vector detail search", () => {
    const { data } = simulateRag(
      "How does RAG make an answer more trustworthy?",
    );

    expect(data.queryVector).toHaveLength(data.embedding.dimensions);
    expect(data.queryVector.every((value) => Number.isFinite(value))).toBe(true);

    const rankedNeighborIds = data.searchResults
      .filter((result) => !result.selected)
      .slice(0, 3)
      .map((result) => `record-${result.chunk.id}`);

    const storedIds = data.vectorRecords.map((record) => record.id);
    for (const neighborId of rankedNeighborIds) {
      expect(storedIds).toContain(neighborId);
    }
  });

  it("keeps ranked-neighbor ordering consistent with search results", () => {
    const { data } = simulateRag(
      "How does RAG make an answer more trustworthy?",
    );

    const sortedScores = data.searchResults.map((result) => result.score);
    const descending = [...sortedScores].sort((left, right) => right - left);

    expect(sortedScores).toEqual(descending);
    expect(data.searchResults[0]?.rank).toBe(1);
  });
});
