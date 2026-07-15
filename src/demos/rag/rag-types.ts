import type {
  DemoRuntimeAdapter,
  DemoRuntimeResult,
  EvidenceReference,
} from "../../framework/types";

export type RagEventKind =
  | "show-documents"
  | "split-chunks"
  | "embed-chunks"
  | "store-vectors"
  | "ask-question"
  | "embed-query"
  | "search-index"
  | "select-evidence"
  | "assemble-context"
  | "generate-answer"
  | "cite-answer";

export type RagVectorDbEventKind =
  | "show-record"
  | "embed-record"
  | "serialize-record"
  | "store-record"
  | "search-record";

export interface RagDocument {
  readonly id: string;
  readonly title: string;
  readonly type: "guide" | "report" | "reference";
  readonly color: "blue" | "amber" | "violet";
  readonly excerpt: string;
  readonly chunks: readonly RagChunk[];
}

export interface RagChunk {
  readonly id: string;
  readonly documentId: string;
  readonly label: string;
  readonly text: string;
  readonly vector: readonly number[];
}

export interface RagEmbeddingMetadata {
  readonly modelName: string;
  readonly dimensions: number;
  readonly outputDimensions: number;
  readonly dimensionsNote: string;
}

export interface RagVectorRecord {
  readonly id: string;
  readonly vector: readonly number[];
  readonly documentId: string;
  readonly documentTitle: string;
  readonly chunkLabel: string;
  readonly text: string;
}

export interface RagSearchResult {
  readonly chunk: RagChunk;
  readonly document: RagDocument;
  readonly score: number;
  readonly rank: number;
  readonly selected: boolean;
}

export interface RagAnswerClaim {
  readonly text: string;
  readonly evidenceIds: readonly string[];
}

export interface RagSimulation {
  readonly question: string;
  readonly documents: readonly RagDocument[];
  readonly allChunks: readonly RagChunk[];
  readonly embedding: RagEmbeddingMetadata;
  readonly vectorRecords: readonly RagVectorRecord[];
  readonly queryVector: readonly number[];
  readonly searchResults: readonly RagSearchResult[];
  readonly selectedEvidence: readonly RagSearchResult[];
  readonly contextWindow: readonly EvidenceReference[];
  readonly answer: readonly RagAnswerClaim[];
  readonly indexedChunkCount: number;
  readonly retrievedChunkCount: number;
  readonly confidenceScore: number;
  readonly seed: number;
}

export type RagRuntimeResult = DemoRuntimeResult<RagSimulation>;
export type RagRuntimeAdapter = DemoRuntimeAdapter<string, RagRuntimeResult>;
