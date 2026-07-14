import type { EvidenceReference } from "../../framework/types";
import type {
  RagAnswerClaim,
  RagChunk,
  RagDocument,
  RagRuntimeAdapter,
  RagRuntimeResult,
  RagSearchResult,
  RagSimulation,
} from "./rag-types";

const SIMULATION_SEED = 1701;

const documentSeeds: readonly Omit<RagDocument, "chunks">[] = [
  {
    id: "rag-guide",
    title: "RAG in one page",
    type: "guide",
    color: "blue",
    excerpt: "A practical guide to grounding language models with retrieved context.",
  },
  {
    id: "retrieval-report",
    title: "Retrieval quality report",
    type: "report",
    color: "amber",
    excerpt: "How chunking and ranking shape the evidence an answer receives.",
  },
  {
    id: "vector-reference",
    title: "Vector search reference",
    type: "reference",
    color: "violet",
    excerpt: "A compact reference for embeddings, similarity, and top-k search.",
  },
];

interface ChunkSeed {
  readonly documentId: string;
  readonly label: string;
  readonly text: string;
  readonly vector: readonly number[];
  readonly keywords: readonly string[];
}

const chunkSeeds: readonly ChunkSeed[] = [
  {
    documentId: "rag-guide",
    label: "01 / grounding",
    text: "RAG retrieves relevant evidence before the model writes an answer.",
    vector: [0.92, 0.18, 0.8, 0.42],
    keywords: ["rag", "retrieve", "evidence", "answer", "ground"],
  },
  {
    documentId: "rag-guide",
    label: "02 / context",
    text: "The selected passages are placed beside the question as model context.",
    vector: [0.76, 0.24, 0.77, 0.61],
    keywords: ["context", "question", "passages", "model", "prompt"],
  },
  {
    documentId: "rag-guide",
    label: "03 / citations",
    text: "A grounded answer can point back to the evidence that supports each claim.",
    vector: [0.79, 0.42, 0.68, 0.86],
    keywords: ["grounded", "answer", "evidence", "claim", "citations"],
  },
  {
    documentId: "retrieval-report",
    label: "01 / chunks",
    text: "Chunk size controls how much meaning travels with each retrieved result.",
    vector: [0.36, 0.82, 0.7, 0.28],
    keywords: ["chunk", "size", "retrieved", "result", "meaning"],
  },
  {
    documentId: "retrieval-report",
    label: "02 / ranking",
    text: "A ranking model scores candidates so the strongest evidence rises to the top.",
    vector: [0.3, 0.91, 0.48, 0.38],
    keywords: ["ranking", "scores", "candidates", "evidence", "top"],
  },
  {
    documentId: "retrieval-report",
    label: "03 / top-k",
    text: "Top-k retrieval keeps the context focused instead of sending every chunk.",
    vector: [0.44, 0.88, 0.4, 0.51],
    keywords: ["top-k", "context", "chunks", "focused", "retrieval"],
  },
  {
    documentId: "vector-reference",
    label: "01 / embeddings",
    text: "An embedding turns text into a numeric fingerprint for semantic comparison.",
    vector: [0.82, 0.22, 0.95, 0.2],
    keywords: ["embedding", "text", "numeric", "fingerprint", "semantic"],
  },
  {
    documentId: "vector-reference",
    label: "02 / similarity",
    text: "Similarity search compares the query vector with stored vectors.",
    vector: [0.62, 0.25, 0.93, 0.34],
    keywords: ["similarity", "search", "query", "vector", "stored"],
  },
  {
    documentId: "vector-reference",
    label: "03 / database",
    text: "A vector database stores embeddings and returns nearby chunks quickly.",
    vector: [0.55, 0.34, 0.89, 0.48],
    keywords: ["vector", "database", "stores", "embeddings", "chunks"],
  },
];

const suggestedQuestion =
  "How does RAG make an answer more trustworthy?";

function createDocuments(): readonly RagDocument[] {
  const chunksByDocument = new Map<string, RagChunk[]>();

  chunkSeeds.forEach((chunkSeed, index) => {
    const chunk = {
      id: `chunk-${index + 1}`,
      documentId: chunkSeed.documentId,
      label: chunkSeed.label,
      text: chunkSeed.text,
      vector: chunkSeed.vector,
    };
    const existingChunks = chunksByDocument.get(chunk.documentId) ?? [];
    existingChunks.push(chunk);
    chunksByDocument.set(chunk.documentId, existingChunks);
  });

  return documentSeeds.map((documentSeed) => ({
    ...documentSeed,
    chunks: chunksByDocument.get(documentSeed.id) ?? [],
  }));
}

function normalizeQuestion(question: string): string {
  const trimmedQuestion = question.trim();
  return trimmedQuestion.length > 0 ? trimmedQuestion : suggestedQuestion;
}

function scoreChunk(question: string, chunkSeed: ChunkSeed, index: number): number {
  const normalizedQuestion = question.toLowerCase();
  const keywordMatches = chunkSeed.keywords.filter((keyword) =>
    normalizedQuestion.includes(keyword),
  ).length;
  const semanticSignal = chunkSeed.vector[(index + SIMULATION_SEED) % 4] ?? 0.4;
  const deterministicOffset = ((SIMULATION_SEED + index * 17) % 11) / 100;

  return Math.min(
    0.98,
    0.52 + keywordMatches * 0.075 + semanticSignal * 0.08 + deterministicOffset,
  );
}

function createContextWindow(
  selectedEvidence: readonly RagSearchResult[],
): readonly EvidenceReference[] {
  return selectedEvidence.map(({ chunk, document }) => ({
    id: chunk.id,
    sourceId: document.id,
    sourceTitle: document.title,
    excerpt: chunk.text,
    locator: chunk.label,
  }));
}

function createAnswerClaims(
  selectedEvidence: readonly RagSearchResult[],
): readonly RagAnswerClaim[] {
  const groundingEvidence = selectedEvidence
    .filter(({ chunk }) => chunk.id === "chunk-1" || chunk.id === "chunk-3")
    .map(({ chunk }) => chunk.id);
  const rankingEvidence = selectedEvidence
    .filter(({ chunk }) => chunk.id === "chunk-5" || chunk.id === "chunk-7")
    .map(({ chunk }) => chunk.id);
  const finalEvidence = selectedEvidence.slice(0, 2).map(({ chunk }) => chunk.id);

  return [
    {
      text: "RAG first retrieves relevant passages, then gives those passages to the language model as context.",
      evidenceIds: groundingEvidence.length > 0 ? groundingEvidence : finalEvidence,
    },
    {
      text: "Because the answer is tied to selected evidence, the response is easier to inspect and trust.",
      evidenceIds: rankingEvidence.length > 0 ? rankingEvidence : finalEvidence,
    },
  ];
}

export function simulateRag(question: string): RagRuntimeResult {
  const normalizedQuestion = normalizeQuestion(question);
  const documents = createDocuments();
  const allChunks = documents.flatMap((document) => document.chunks);
  const searchResults = allChunks
    .map((chunk, index) => {
      const chunkSeed = chunkSeeds[index];
      const document = documents.find(
        (candidateDocument) => candidateDocument.id === chunk.documentId,
      );

      if (!chunkSeed || !document) {
        throw new Error(`RAG simulation data is missing for chunk "${chunk.id}".`);
      }

      return {
        chunk,
        document,
        score: scoreChunk(normalizedQuestion, chunkSeed, index),
        rank: 0,
        selected: false,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
      selected: index < 3,
    }));
  const selectedEvidence = searchResults.filter((result) => result.selected);
  const contextWindow = createContextWindow(selectedEvidence);
  const answer = createAnswerClaims(selectedEvidence);
  const confidenceScore = Math.round(
    (selectedEvidence.reduce((total, result) => total + result.score, 0) /
      selectedEvidence.length) *
      100,
  );

  const simulation: RagSimulation = {
    question: normalizedQuestion,
    documents,
    allChunks,
    searchResults,
    selectedEvidence,
    contextWindow,
    answer,
    indexedChunkCount: allChunks.length,
    retrievedChunkCount: selectedEvidence.length,
    confidenceScore,
    seed: SIMULATION_SEED,
  };

  return {
    data: simulation,
    generatedAt: "2026-07-14T00:00:00.000Z",
    adapterMode: "simulation",
  };
}

export const ragSimulationAdapter: RagRuntimeAdapter = {
  mode: "simulation",
  run: async (question) => simulateRag(question),
};
