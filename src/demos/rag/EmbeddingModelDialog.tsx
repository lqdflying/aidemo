import { ArrowUpRight, Check, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { embeddingModelInventory } from "./embedding-model-inventory";
import type { RagEmbeddingMetadata } from "./rag-types";

interface EmbeddingModelDialogProps {
  readonly embedding: RagEmbeddingMetadata;
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

export function EmbeddingModelDialog({
  embedding,
  isOpen,
  onClose,
}: EmbeddingModelDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

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
        (event.shiftKey
          ? lastFocusableElement
          : firstFocusableElement
        ).focus();
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

      triggerRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="embedding-inventory-dialog__overlay"
      data-embedding-dialog-overlay
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
    >
      <div
        aria-describedby="embedding-inventory-dialog-description"
        aria-labelledby="embedding-inventory-dialog-title"
        aria-modal="true"
        className="embedding-inventory-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="embedding-inventory-dialog__header">
          <div>
            <p className="eyebrow">Embedding model inventory</p>
            <h2 id="embedding-inventory-dialog-title">
              Commonly used embedding models
            </h2>
            <p id="embedding-inventory-dialog-description">
              These representative choices cover text and multimodal retrieval.
              Verify model availability, regional support, and current limits
              before deployment.
            </p>
          </div>
          <button
            aria-label="Close embedding model inventory"
            className="icon-button"
            onClick={() => onCloseRef.current()}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="embedding-inventory-dialog__body">
          <div className="embedding-inventory-dialog__summary">
            <span className="embedding-inventory-dialog__summary-icon">
              <Sparkles aria-hidden="true" />
            </span>
            <div>
              <small>Current example</small>
              <strong>{embedding.modelName}</strong>
              <p>{embedding.dimensionsNote}</p>
            </div>
          </div>

          <div
            aria-label="Embedding model choices"
            className="embedding-inventory"
            role="list"
          >
            {embeddingModelInventory.map((model) => {
              const isCurrentModel = model.modelId === embedding.modelName;

              return (
                <article
                  className={`embedding-inventory-card${
                    isCurrentModel ? " is-current" : ""
                  }`}
                  data-current-model={isCurrentModel ? "true" : undefined}
                  key={model.modelId}
                  role="listitem"
                >
                  <div className="embedding-inventory-card__topline">
                    <span>{model.provider}</span>
                    {isCurrentModel && (
                      <span className="embedding-inventory-card__status">
                        <Check aria-hidden="true" />
                        Current example
                      </span>
                    )}
                  </div>
                  <h3>{model.modelId}</h3>
                  <dl>
                    <div>
                      <dt>Modality</dt>
                      <dd>{model.modality}</dd>
                    </div>
                    <div>
                      <dt>Output dimensions</dt>
                      <dd>{model.outputDimensions}</dd>
                    </div>
                    <div>
                      <dt>Typical fit</dt>
                      <dd>{model.typicalFit}</dd>
                    </div>
                  </dl>
                  <a
                    href={model.docsUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Provider docs
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
