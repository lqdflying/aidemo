import {
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Database,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useScenePlayer } from "../../framework/useScenePlayer";
import { vectorDbStory } from "./vector-db-story";
import type {
  RagRuntimeResult,
  RagVectorDbEventKind,
  RagVectorRecord,
} from "./rag-types";

interface VectorDbDialogProps {
  readonly simulation: RagRuntimeResult["data"];
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function formatVector(values: readonly number[]): string {
  return `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
}

function getNearestRecords(
  simulation: RagRuntimeResult["data"],
  selectedRecord: RagVectorRecord,
): readonly { readonly record: RagVectorRecord; readonly score: number }[] {
  return simulation.searchResults
    .map((result) => ({
      record: simulation.vectorRecords.find(
        (vectorRecord) => vectorRecord.id === `record-${result.chunk.id}`,
      ),
      score: result.score,
    }))
    .filter(
      (result): result is { readonly record: RagVectorRecord; readonly score: number } =>
        Boolean(result.record),
    )
    .filter((result) => result.record.id !== selectedRecord.id)
    .slice(0, 3);
}

function DetailPayload({
  eventKind,
  record,
  simulation,
}: {
  readonly eventKind: RagVectorDbEventKind;
  readonly record: RagVectorRecord;
  readonly simulation: RagRuntimeResult["data"];
}): React.JSX.Element {
  const showVector = [
    "embed-record",
    "serialize-record",
    "store-record",
    "search-record",
  ].includes(eventKind);
  const showStoredRecord = ["serialize-record", "store-record", "search-record"].includes(
    eventKind,
  );
  const showSearch = eventKind === "search-record";
  const nearestRecords = getNearestRecords(simulation, record);

  return (
    <div className="vector-detail__payload">
      <div className="vector-detail__payload-heading">
        <div>
          <small>Live payload</small>
          <strong>{showStoredRecord ? "Stored record" : "Transforming record"}</strong>
        </div>
        <span>{showSearch ? "calculated output" : "persisted fields"}</span>
      </div>
      <pre aria-label="Vector database record payload">
        <code>{`{
  "id": ${showStoredRecord ? `"${record.id}"` : "pending"},
  "vector": ${showVector ? formatVector(record.vector) : "pending"},
  "documentId": ${showStoredRecord ? `"${record.documentId}"` : "pending"},
  "documentTitle": ${showStoredRecord ? `"${record.documentTitle}"` : "pending"},
  "chunkLabel": ${showStoredRecord ? `"${record.chunkLabel}"` : "pending"},
  "text": ${showStoredRecord ? `"${record.text}"` : "pending"}
}`}</code>
      </pre>
      {showSearch && (
        <div className="vector-detail__neighbors">
          <div className="vector-detail__payload-heading">
            <div>
              <small>Calculated output</small>
              <strong>Nearest records</strong>
            </div>
            <Search aria-hidden="true" size={15} />
          </div>
          <p>Query vector {formatVector(simulation.queryVector)}</p>
          {nearestRecords.map(({ record: nearestRecord, score }, index) => (
            <div className="vector-detail__neighbor" key={nearestRecord.id}>
              <span>#{index + 1}</span>
              <strong>{nearestRecord.chunkLabel}</strong>
              <b>{Math.round(score * 100)}%</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VectorDbDialog({
  simulation,
  isOpen,
  onClose,
}: VectorDbDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    simulation.vectorRecords[0]?.id ?? "",
  );
  const selectedRecord =
    simulation.vectorRecords.find((record) => record.id === selectedRecordId) ??
    simulation.vectorRecords[0];
  const player = useScenePlayer(vectorDbStory, { loop: true });
  const playerControlsRef = useRef(player.controls);

  onCloseRef.current = onClose;
  playerControlsRef.current = player.controls;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialogElement = dialogRef.current;
    if (!dialogElement) {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const rootElement = document.getElementById("root");
    const previousBodyOverflow = document.body.style.overflow;
    const rootWasInert = rootElement?.hasAttribute("inert") ?? false;
    const previousRootAriaHidden =
      rootElement?.getAttribute("aria-hidden") ?? null;

    triggerRef.current = previouslyFocusedElement;
    document.body.style.overflow = "hidden";
    rootElement?.setAttribute("inert", "");
    rootElement?.setAttribute("aria-hidden", "true");
    closeButtonRef.current?.focus();

    const handleDocumentKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENT_SELECTOR,
        ),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1);

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      if (!dialogElement.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastFocusableElement : firstFocusableElement).focus();
        return;
      }

      if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeydown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeydown);
      document.body.style.overflow = previousBodyOverflow;

      if (!rootWasInert) {
        rootElement?.removeAttribute("inert");
      }
      if (previousRootAriaHidden === null) {
        rootElement?.removeAttribute("aria-hidden");
      } else {
        rootElement?.setAttribute("aria-hidden", previousRootAriaHidden);
      }

      playerControlsRef.current.restart(false);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    playerControlsRef.current.restart(false);
  }, [selectedRecordId]);

  if (!isOpen || !selectedRecord) {
    return null;
  }

  const currentEvent = player.position.event;
  const isPlaying = player.state.status === "playing";

  return createPortal(
    <div
      className="vector-detail-dialog__overlay"
      data-vector-dialog-overlay
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
    >
      <div
        aria-describedby="vector-db-dialog-description"
        aria-labelledby="vector-db-dialog-title"
        aria-modal="true"
        className="vector-detail-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="vector-detail-dialog__shell">
        <header className="vector-detail-dialog__header">
          <div>
            <p className="eyebrow">Vector DB detail</p>
            <h2 id="vector-db-dialog-title">How one record becomes searchable</h2>
            <p id="vector-db-dialog-description">
              Select a stored record, then play the transformation from source passage to
              similarity result.
            </p>
          </div>
          <button
            aria-label="Close Vector DB details"
            className="icon-button"
            data-dialog-close
            onClick={() => onCloseRef.current()}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="vector-detail-dialog__body">
          <aside className="vector-detail__records" aria-label="Stored vector records">
            <div className="vector-detail__section-label">
              <Database aria-hidden="true" size={15} />
              <span>Stored records</span>
            </div>
            {simulation.vectorRecords.map((record) => (
              <button
                aria-pressed={record.id === selectedRecord.id}
                className={record.id === selectedRecord.id ? "is-selected" : ""}
                key={record.id}
                onClick={() => setSelectedRecordId(record.id)}
                type="button"
              >
                <span>{record.id}</span>
                <strong>{record.chunkLabel}</strong>
                <small>{record.documentTitle}</small>
              </button>
            ))}
          </aside>

          <section className="vector-detail__animation" aria-label="Vector record animation">
            <div className="vector-detail__stage-heading">
              <div>
                <span>Step {player.position.eventNumber} / {player.position.totalEvents}</span>
                <h3>{currentEvent.title}</h3>
              </div>
              <span className="vector-detail__status" aria-live="polite">
                {isPlaying ? "Playing" : "Paused"}
              </span>
            </div>
            <div className="vector-detail__canvas" data-event={currentEvent.kind}>
              <div className={`vector-detail__source${currentEvent.kind === "show-record" ? " is-active" : ""}`}>
                <FileText aria-hidden="true" />
                <small>Source chunk</small>
                <strong>{selectedRecord.chunkLabel}</strong>
                <p>{selectedRecord.text}</p>
              </div>
              <div className="vector-detail__flow" aria-hidden="true">
                <span />
                <ChevronRight />
                <small>{currentEvent.kind === "embed-record" ? simulation.embedding.modelName : "transform"}</small>
              </div>
              <div className={`vector-detail__vector${showVectorForEvent(currentEvent.kind) ? " is-active" : ""}`}>
                <CircleDot aria-hidden="true" />
                <small>Embedding</small>
                <strong>{simulation.embedding.modelName}</strong>
                <div className="vector-detail__bars" aria-label={`Embedding vector ${formatVector(selectedRecord.vector)}`}>
                  {selectedRecord.vector.map((value, index) => (
                    <span key={`${value}-${index}`} style={{ "--vector-height": `${Math.max(value * 100, 18)}%` } as React.CSSProperties} />
                  ))}
                </div>
                <code>{formatVector(selectedRecord.vector)}</code>
              </div>
              <div className={`vector-detail__record${currentEvent.kind === "serialize-record" || currentEvent.kind === "store-record" || currentEvent.kind === "search-record" ? " is-active" : ""}`}>
                <Database aria-hidden="true" />
                <small>Vector DB record</small>
                <strong>{selectedRecord.id}</strong>
                <span>{selectedRecord.documentTitle}</span>
              </div>
              <div className={`vector-detail__search${currentEvent.kind === "search-record" ? " is-active" : ""}`}>
                <Search aria-hidden="true" />
                <small>Similarity search</small>
                <strong>{currentEvent.kind === "search-record" ? `${simulation.retrievedChunkCount} nearest neighbors` : "waiting for query"}</strong>
              </div>
            </div>
            <p className="vector-detail__explanation" aria-live="polite">{currentEvent.explanation}</p>
            <div className="vector-detail__controls" aria-label="Vector detail animation controls">
              <button aria-label="Previous detail step" className="icon-button" disabled={!player.canGoPrevious} onClick={player.controls.previous} type="button"><ChevronLeft aria-hidden="true" /></button>
              <button aria-label={isPlaying ? "Pause detail animation" : "Play detail animation"} className="play-button" onClick={player.controls.toggle} type="button">
                {isPlaying ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
                {isPlaying ? "Pause" : "Play detail"}
              </button>
              <button aria-label="Next detail step" className="icon-button" disabled={!player.canGoNext} onClick={player.controls.next} type="button"><ChevronRight aria-hidden="true" /></button>
              <button className="text-button" onClick={() => player.controls.restart(false)} type="button"><RotateCcw aria-hidden="true" />Restart</button>
            </div>
          </section>

          <aside className="vector-detail__inspector" aria-label="Vector record inspector">
            <div className="vector-detail__section-label"><FileText aria-hidden="true" size={15} /><span>Record inspector</span></div>
            <DetailPayload eventKind={currentEvent.kind} record={selectedRecord} simulation={simulation} />
            <div className="vector-detail__schema">
              <small>Persisted shape</small>
              <p>id · vector · documentId · documentTitle · chunkLabel · text</p>
              <span>Similarity and rank are calculated during search, not stored in this record.</span>
            </div>
          </aside>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function showVectorForEvent(eventKind: RagVectorDbEventKind): boolean {
  return eventKind !== "show-record";
}
