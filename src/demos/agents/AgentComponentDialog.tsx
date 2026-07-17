import { Lightbulb, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { AgentConceptDiagram } from "./AgentConceptDiagram";
import { AgentPlatformBlueprint } from "./AgentPlatformBlueprint";
import { getAgentDetailContent } from "./agent-diagram-model";
import type {
  AgentArchitectureModel,
  AgentConceptTakeaways,
  AgentDetailTarget,
} from "./agent-types";

interface AgentComponentDialogProps {
  readonly model: AgentArchitectureModel;
  readonly onClose: () => void;
  readonly returnFocusElement: HTMLButtonElement | null;
  readonly target: AgentDetailTarget | null;
}

const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function ConceptTakeaways({
  takeaways,
}: {
  readonly takeaways: AgentConceptTakeaways;
}): React.JSX.Element {
  return (
    <div className="agent-detail-dialog__takeaways">
      <article>
        <Lightbulb aria-hidden="true" />
        <div>
          <span>Engineering principle</span>
          <p>{takeaways.engineeringPrinciple}</p>
        </div>
      </article>
      <article data-tone="risk">
        <TriangleAlert aria-hidden="true" />
        <div>
          <span>Failure mode</span>
          <p>{takeaways.failureMode}</p>
        </div>
      </article>
    </div>
  );
}

export function AgentComponentDialog({
  model,
  onClose,
  returnFocusElement,
  target,
}: AgentComponentDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!target) return undefined;

    const dialogElement = dialogRef.current;
    if (!dialogElement) return undefined;

    const rootElement = document.getElementById("root");
    const previousBodyOverflow = document.body.style.overflow;
    const rootWasInert = rootElement?.hasAttribute("inert") ?? false;
    const previousRootAriaHidden = rootElement?.getAttribute("aria-hidden") ?? null;
    const activeElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    triggerRef.current = returnFocusElement ?? activeElement;
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

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
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

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeydown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeydown);
      document.body.style.overflow = previousBodyOverflow;

      if (!rootWasInert) rootElement?.removeAttribute("inert");
      if (previousRootAriaHidden === null) {
        rootElement?.removeAttribute("aria-hidden");
      } else {
        rootElement?.setAttribute("aria-hidden", previousRootAriaHidden);
      }

      triggerRef.current?.focus();
    };
  }, [returnFocusElement, target]);

  if (!target) return null;

  const detail = getAgentDetailContent(model, target);
  return createPortal(
    <div
      className="agent-detail-dialog__overlay"
      data-agent-detail-overlay
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="agent-detail-dialog"
        data-accent={detail.accent}
        data-concept-id={target.kind === "concept" ? target.conceptId : undefined}
        data-detail-kind={target.kind}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <span aria-hidden="true" className="agent-detail-dialog__handle" />
        <header className="agent-detail-dialog__header">
          <div>
            <span className="agent-detail-dialog__eyebrow">{detail.eyebrow}</span>
            <h2 id={titleId}>{detail.label}</h2>
            <p id={descriptionId}>{detail.summary}</p>
          </div>
          <button
            aria-label="Close component details"
            className="agent-detail-dialog__close"
            onClick={() => onCloseRef.current()}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        {target.kind === "concept" && detail.kind === "concept" ? (
          <div className="agent-detail-dialog__concept-body">
            <AgentConceptDiagram conceptId={target.conceptId} />
            <ConceptTakeaways takeaways={detail.takeaways} />
          </div>
        ) : detail.kind === "platform" ? (
          <AgentPlatformBlueprint
            recommendation={detail.openSourceRecommendation}
            spec={detail.blueprint}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
