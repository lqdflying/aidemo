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
