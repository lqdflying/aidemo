import {
  BookOpenText,
  Braces,
  Check,
  CircleDot,
  Database,
  FileText,
  MessageSquareText,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { StoryPosition } from "../../framework/story";
import type { PlaybackStatus } from "../../framework/playback";
import { EmbeddingModelDialog } from "./EmbeddingModelDialog";
import type {
  RagEventKind,
  RagSearchResult,
  RagSimulation,
} from "./rag-types";
import type { RagPhase } from "./rag-routing";
import { VectorDbDialog } from "./VectorDbDialog";

interface RagStageProps {
  readonly simulation: RagSimulation;
  readonly position: StoryPosition<RagEventKind>;
  readonly isComplete: boolean;
  readonly playbackStatus: PlaybackStatus;
  readonly phase?: RagPhase;
  readonly onEmbeddingModelOpen?: () => void;
  readonly onVectorDbOpen?: () => void;
}

type PipelineNodeState = "pending" | "active" | "complete";

const ragEventOrder: readonly RagEventKind[] = [
  "show-documents",
  "split-chunks",
  "embed-chunks",
  "store-vectors",
  "ask-question",
  "embed-query",
  "search-index",
  "select-evidence",
  "assemble-context",
  "generate-answer",
  "cite-answer",
];

function hasReached(
  currentKind: RagEventKind,
  expectedKind: RagEventKind,
): boolean {
  return ragEventOrder.indexOf(currentKind) >= ragEventOrder.indexOf(expectedKind);
}

function getNodeState(
  currentKind: RagEventKind,
  expectedKind: RagEventKind,
  isComplete: boolean,
): PipelineNodeState {
  if (isComplete) {
    return "complete";
  }

  const currentEventIndex = ragEventOrder.indexOf(currentKind);
  const expectedEventIndex = ragEventOrder.indexOf(expectedKind);

  if (currentEventIndex === expectedEventIndex) {
    return "active";
  }

  return currentEventIndex > expectedEventIndex ? "complete" : "pending";
}

function VectorFingerprint({
  values,
  compact = false,
}: {
  readonly values: readonly number[];
  readonly compact?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={`vector-fingerprint${compact ? " vector-fingerprint--compact" : ""}`}
      aria-label={`Vector values ${values.map((value) => value.toFixed(2)).join(", ")}`}
    >
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          style={{ "--vector-height": `${Math.max(24, value * 100)}%` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function IndexStage({
  simulation,
  eventKind,
  isComplete,
  onOpenEmbeddingModel,
  onOpenVectorDb,
}: {
  readonly simulation: RagSimulation;
  readonly eventKind: RagEventKind;
  readonly isComplete: boolean;
  readonly onOpenEmbeddingModel: () => void;
  readonly onOpenVectorDb: () => void;
}): React.JSX.Element {
  const showChunks = hasReached(eventKind, "split-chunks");
  const showVectors = hasReached(eventKind, "embed-chunks");
  const showDatabase = hasReached(eventKind, "store-vectors");
  const databaseState = getNodeState(eventKind, "store-vectors", isComplete);
  const transferVector = simulation.allChunks.at(0)?.vector ?? [];

  return (
    <section
      aria-label="Indexing pipeline"
      className="pipeline-lane pipeline-lane--index"
      data-lane-state={getNodeState(eventKind, "show-documents", isComplete)}
    >
      <div className="pipeline-lane__heading">
        <span>Act 1</span>
        <strong>Indexing pipeline</strong>
        <small>Prepare searchable knowledge</small>
      </div>
      <div className="stage-layout stage-layout--index">
      <section
        className="stage-zone stage-zone--sources pipeline-node"
        aria-label="Source documents"
        data-state={getNodeState(eventKind, "show-documents", isComplete)}
      >
        <div className="stage-zone__heading">
          <span className="zone-icon zone-icon--neutral">
            <BookOpenText aria-hidden="true" />
          </span>
          <div>
            <small>Knowledge base</small>
            <strong>Source documents</strong>
          </div>
        </div>
        <div className="document-stack">
          {simulation.documents.map((document, documentIndex) => (
            <article
              className={`source-document source-document--${document.color}`}
              key={document.id}
              style={{ "--document-index": documentIndex } as React.CSSProperties}
            >
              <div className="source-document__topline">
                <FileText aria-hidden="true" />
                <span>{document.type}</span>
              </div>
              <h3>{document.title}</h3>
              <p>{document.excerpt}</p>
              <div className="source-document__lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div
        className={`stage-connector stage-connector--chunks${showChunks ? " is-active" : ""}`}
        aria-hidden="true"
      >
        <span />
      </div>

      <section
        className={`stage-zone stage-zone--chunks pipeline-node${showChunks ? " is-visible" : ""}`}
        aria-label="Document chunks"
        data-state={getNodeState(eventKind, "split-chunks", isComplete)}
      >
        <div className="stage-zone__heading">
          <span className="zone-icon zone-icon--retrieval">
            <Braces aria-hidden="true" />
          </span>
          <div>
            <small>Step 01</small>
            <strong>Smaller passages</strong>
          </div>
        </div>
        <div className="chunk-cloud">
          {simulation.allChunks.map((chunk, chunkIndex) => (
            <div
              className="chunk-chip"
              key={chunk.id}
              style={{ "--chunk-index": chunkIndex } as React.CSSProperties}
            >
              <span>{chunk.label.split(" / ")[0]}</span>
              <p>{chunk.text}</p>
              <div
                className={`chunk-embedding${showVectors ? " is-visible" : ""}`}
                data-state={getNodeState(eventKind, "embed-chunks", isComplete)}
              >
                <small>Embedding</small>
                <VectorFingerprint compact values={chunk.vector} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div
        className={`stage-connector stage-connector--embedding${showVectors ? " is-active" : ""}`}
        aria-hidden="true"
      >
        <span />
      </div>

      <button
        className={`embedding-model pipeline-node${showVectors ? " is-visible" : ""}`}
        aria-label="Open embedding model inventory"
        data-state={getNodeState(eventKind, "embed-chunks", isComplete)}
        disabled={!showVectors}
        onClick={onOpenEmbeddingModel}
        type="button"
      >
        <span className="embedding-model__icon"><Sparkles aria-hidden="true" /></span>
        <small>Embedding model</small>
        <strong>{simulation.embedding.modelName}</strong>
        <span className="embedding-model__metric">
          <span>{simulation.embedding.outputDimensions.toLocaleString()}D</span>
          <small>production vector</small>
        </span>
        <span className="embedding-model__note">
          {simulation.embedding.dimensions}-value teaching projection
        </span>
      </button>

      <div
        className={`stage-connector stage-connector--database${showDatabase ? " is-active" : ""}`}
        aria-hidden="true"
        data-state={databaseState}
      >
        <div className="vector-transfer-packet">
          {transferVector.map((value, vectorIndex) => (
            <i
              key={`${value}-${vectorIndex}`}
              style={{
                "--vector-height": `${Math.max(24, value * 100)}%`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <button
        className={`vector-store pipeline-node${showDatabase ? " is-visible" : ""}`}
        aria-label="Open Vector DB record details"
        data-state={databaseState}
        disabled={!showDatabase}
        onClick={onOpenVectorDb}
        type="button"
      >
        <span className="vector-store__top">
          <Database aria-hidden="true" />
          <span>
            <small>Searchable memory</small>
            <strong>Vector DB</strong>
          </span>
        </span>
        <span className="database-visual" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="vector-store__metric">
          <strong>{showDatabase ? simulation.indexedChunkCount : 0}</strong>
          <span>{showDatabase ? "chunks indexed · open details" : "waiting for vectors"}</span>
        </span>
      </button>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  resultIndex,
  showScore,
  showSelection,
}: {
  readonly result: RagSearchResult;
  readonly resultIndex: number;
  readonly showScore: boolean;
  readonly showSelection: boolean;
}): React.JSX.Element {
  return (
    <article
      className={`result-card${showSelection && result.selected ? " is-selected" : ""}${showSelection && !result.selected ? " is-muted" : ""}`}
      data-selected={showSelection ? result.selected : undefined}
      style={{ "--result-index": resultIndex } as React.CSSProperties}
    >
      <div className="result-card__rank">#{result.rank}</div>
      <div className="result-card__copy">
        <div>
          <span>{result.document.title}</span>
          {showSelection && result.selected && (
            <small>
              <Check aria-hidden="true" />
              selected
            </small>
          )}
        </div>
        <p>{result.chunk.text}</p>
      </div>
      <div className={`result-card__score${showScore ? " is-visible" : ""}`}>
        <strong>{Math.round(result.score * 100)}%</strong>
        <span>match</span>
        <i aria-hidden="true" style={{ "--match-score": result.score } as React.CSSProperties} />
      </div>
    </article>
  );
}

function RetrieveStage({
  simulation,
  eventKind,
  isComplete,
}: {
  readonly simulation: RagSimulation;
  readonly eventKind: RagEventKind;
  readonly isComplete: boolean;
}): React.JSX.Element {
  const showQuestion = hasReached(eventKind, "ask-question");
  const showQueryVector = hasReached(eventKind, "embed-query");
  const showSearchResults = hasReached(eventKind, "search-index");
  const showSelection = hasReached(eventKind, "select-evidence");
  const queryVector = simulation.queryVector;

  return (
    <section
      aria-label="Retrieval pipeline"
      className="pipeline-lane pipeline-lane--retrieve"
      data-lane-state={getNodeState(eventKind, "ask-question", isComplete)}
    >
      <div className="pipeline-lane__heading">
        <span>Act 2</span>
        <strong>Query pipeline</strong>
        <small>Compare meaning and rank evidence</small>
      </div>
      <div className="stage-layout stage-layout--retrieve">
      <section
        className={`query-card pipeline-node${showQuestion ? " is-visible" : ""}`}
        aria-label="User question"
        data-state={getNodeState(eventKind, "ask-question", isComplete)}
      >
        <div className="query-card__label">
          <MessageSquareText aria-hidden="true" />
          <span>User question</span>
        </div>
        <p>“{simulation.question}”</p>
        <div
          className={`query-vector${showQueryVector ? " is-visible" : ""}`}
          data-state={getNodeState(eventKind, "embed-query", isComplete)}
        >
          <span>Query embedding</span>
          <VectorFingerprint values={queryVector} />
          <code>[0.86, 0.33, 0.78, 0.57]</code>
        </div>
      </section>

      <div
        className={`search-bridge${showQueryVector ? " is-active" : ""}`}
        data-state={getNodeState(eventKind, "search-index", isComplete)}
        aria-hidden="true"
      >
        <div className="search-bridge__line" />
        <div className="similarity-pulses">
          {simulation.searchResults.slice(0, 5).map((result, resultIndex) => (
            <i
              key={result.chunk.id}
              style={{ "--result-index": resultIndex } as React.CSSProperties}
            />
          ))}
        </div>
        <span>
          <Search />
        </span>
        <small>compare with Vector DB</small>
      </div>

      <section
        className={`ranking-panel pipeline-node${showSearchResults ? " is-visible" : ""}`}
        data-state={getNodeState(eventKind, "search-index", isComplete)}
      >
        <div className="ranking-panel__heading">
          <div>
            <Network aria-hidden="true" />
            <span>
              <small>Vector database</small>
              <strong>Ranked evidence</strong>
            </span>
          </div>
          <span className="ranking-panel__count">
            top {simulation.retrievedChunkCount}
          </span>
        </div>
        <div className="result-list">
          {simulation.searchResults.slice(0, 5).map((result, resultIndex) => (
            <ResultCard
              key={result.chunk.id}
              result={result}
              resultIndex={resultIndex}
              showScore={showSearchResults}
              showSelection={showSelection}
            />
          ))}
        </div>
      </section>
      </div>
    </section>
  );
}

function CitationBadge({
  evidenceId,
  simulation,
}: {
  readonly evidenceId: string;
  readonly simulation: RagSimulation;
}): React.JSX.Element | null {
  const evidenceIndex = simulation.contextWindow.findIndex(
    (evidence) => evidence.id === evidenceId,
  );

  if (evidenceIndex < 0) {
    return null;
  }

  return (
    <span
      className="citation-badge"
      title={simulation.contextWindow[evidenceIndex]?.sourceTitle}
    >
      {evidenceIndex + 1}
    </span>
  );
}

function GenerateStage({
  simulation,
  eventKind,
  isComplete,
}: {
  readonly simulation: RagSimulation;
  readonly eventKind: RagEventKind;
  readonly isComplete: boolean;
}): React.JSX.Element {
  const showContext = hasReached(eventKind, "assemble-context");
  const showAnswer = hasReached(eventKind, "generate-answer") || isComplete;
  const showCitations = hasReached(eventKind, "cite-answer") || isComplete;

  return (
    <section
      aria-label="Generation pipeline"
      className="pipeline-lane pipeline-lane--generate"
      data-lane-state={getNodeState(eventKind, "assemble-context", isComplete)}
    >
      <div className="pipeline-lane__heading">
        <span>Act 3</span>
        <strong>Generation pipeline</strong>
        <small>Write only from selected evidence</small>
      </div>
      <div className="stage-layout stage-layout--generate">
      <section
        className={`context-panel pipeline-node${showContext ? " is-visible" : ""}`}
        aria-label="Context window"
        data-state={getNodeState(eventKind, "assemble-context", isComplete)}
      >
        <div className="context-panel__heading">
          <Braces aria-hidden="true" />
          <div>
            <small>Prompt assembly</small>
            <strong>Question + evidence</strong>
          </div>
        </div>
        <div className="context-question">
          <span>Question</span>
          <p>{simulation.question}</p>
        </div>
        <div className="context-evidence">
          <span>Retrieved context</span>
          {simulation.contextWindow.map((evidence, evidenceIndex) => (
            <article
              key={evidence.id}
              style={
                {
                  "--evidence-index": evidenceIndex,
                } as React.CSSProperties
              }
            >
              <span className="citation-index">{evidenceIndex + 1}</span>
              <div>
                <strong>{evidence.sourceTitle}</strong>
                <p>{evidence.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div
        className={`generation-bridge${showAnswer ? " is-active" : ""}`}
        data-state={getNodeState(eventKind, "generate-answer", isComplete)}
        aria-hidden="true"
      >
        <span>
          <Sparkles />
        </span>
        <small>LLM</small>
      </div>

      <section
        className={`answer-panel pipeline-node${showAnswer ? " is-visible" : ""}`}
        aria-label="Generated answer"
        data-state={getNodeState(eventKind, "generate-answer", isComplete)}
      >
        <div className="answer-panel__heading">
          <div>
            <CircleDot aria-hidden="true" />
            <span>
              <small>Grounded response</small>
              <strong>Answer</strong>
            </span>
          </div>
          {showCitations && (
            <span className="grounding-status">
              <Check aria-hidden="true" />
              {simulation.retrievedChunkCount} sources
            </span>
          )}
        </div>
        <div className="answer-copy">
          {simulation.answer.map((claim, claimIndex) => (
            <p
              className={showAnswer ? "is-visible" : ""}
              key={claim.text}
              style={{ "--claim-index": claimIndex } as React.CSSProperties}
            >
              {claim.text}{" "}
              {showCitations &&
                claim.evidenceIds.map((evidenceId) => (
                  <CitationBadge
                    evidenceId={evidenceId}
                    key={evidenceId}
                    simulation={simulation}
                  />
                ))}
            </p>
          ))}
        </div>
        <div className="answer-panel__footer">
          <span>
            <Check aria-hidden="true" />
            Grounded in retrieved evidence
          </span>
          <span>{simulation.confidenceScore}% evidence match</span>
        </div>
      </section>
      </div>
    </section>
  );
}

export function RagStage({
  simulation,
  position,
  isComplete,
  playbackStatus,
  phase = position.scene.id as RagPhase,
  onEmbeddingModelOpen,
  onVectorDbOpen,
}: RagStageProps): React.JSX.Element {
  const [isEmbeddingModelDialogOpen, setIsEmbeddingModelDialogOpen] =
    useState(false);
  const [isVectorDbOpen, setIsVectorDbOpen] = useState(false);
  const openEmbeddingModelDialog = (): void => {
    setIsEmbeddingModelDialogOpen(true);
    onEmbeddingModelOpen?.();
  };
  const openVectorDb = (): void => {
    setIsVectorDbOpen(true);
    onVectorDbOpen?.();
  };
  const activeStage =
    phase === "index" ? (
      <IndexStage
        eventKind={position.event.kind}
        isComplete={isComplete}
        onOpenEmbeddingModel={openEmbeddingModelDialog}
        onOpenVectorDb={openVectorDb}
        simulation={simulation}
      />
    ) : phase === "retrieve" ? (
      <RetrieveStage
        eventKind={position.event.kind}
        isComplete={isComplete}
        simulation={simulation}
      />
    ) : (
      <GenerateStage
        eventKind={position.event.kind}
        isComplete={isComplete}
        simulation={simulation}
      />
    );

  return (
    <div
      className={`rag-stage rag-stage--${phase}`}
      data-event={position.event.kind}
      data-playback={playbackStatus}
    >
      <div className="rag-stage__topline">
        <div>
          <span>Act {position.scene.act}</span>
          <strong>{position.scene.title}</strong>
        </div>
        <span>
          Step {position.eventNumber} / {position.totalEvents}
        </span>
      </div>

      <div className="rag-stage__canvas rag-pipeline">{activeStage}</div>
      {phase === "index" && (
        <EmbeddingModelDialog
          embedding={simulation.embedding}
          isOpen={isEmbeddingModelDialogOpen}
          onClose={() => setIsEmbeddingModelDialogOpen(false)}
        />
      )}
      <VectorDbDialog
        isOpen={phase === "index" && isVectorDbOpen}
        onClose={() => setIsVectorDbOpen(false)}
        simulation={simulation}
      />
    </div>
  );
}
