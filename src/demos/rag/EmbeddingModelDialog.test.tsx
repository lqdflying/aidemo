import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { EmbeddingModelDialog } from "./EmbeddingModelDialog";
import { simulateRag } from "./rag-simulator";

const embedding = simulateRag(
  "How does RAG make an answer more trustworthy?",
).data.embedding;

const expectedModelIds = [
  "text-embedding-3-small",
  "embed-v4.0",
  "gemini-embedding-001",
  "voyage-4",
  "BAAI/bge-large-en-v1.5",
] as const;

function getApplicationRoot(): HTMLElement {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("The application root is missing from the test document.");
  }

  return rootElement;
}

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof EmbeddingModelDialog>> = {},
): ReturnType<typeof render> {
  return render(
    <EmbeddingModelDialog
      embedding={embedding}
      isOpen
      onClose={vi.fn()}
      {...overrides}
    />,
    { container: getApplicationRoot() },
  );
}

beforeEach(() => {
  const rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.append(rootElement);
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.getElementById("root")?.remove();
});

describe("EmbeddingModelDialog", () => {
  it("portals the modal and isolates the application root while open", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", {
      name: "Commonly used embedding models",
    });
    const overlay = dialog.closest("[data-embedding-dialog-overlay]");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(overlay?.parentElement).toBe(document.body);
    expect(getApplicationRoot()).toHaveAttribute("inert");
    expect(getApplicationRoot()).toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("shows all verified models and derives the current example from metadata", () => {
    renderDialog();

    for (const modelId of expectedModelIds) {
      expect(
        screen.getByRole("heading", { name: modelId }),
      ).toBeInTheDocument();
    }

    const currentModelCard = screen
      .getByRole("heading", { name: embedding.modelName })
      .closest<HTMLElement>("[data-current-model='true']");

    expect(currentModelCard).toBeInTheDocument();
    expect(
      within(currentModelCard!).getByText("Current example"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Provider docs/ }),
    ).toHaveLength(expectedModelIds.length);
  });

  it("closes from the close button and restores focus and prior root state", () => {
    const onClose = vi.fn();
    const rootElement = getApplicationRoot();
    rootElement.setAttribute("aria-hidden", "false");

    function Harness(): React.JSX.Element {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button onClick={() => setIsOpen(true)} type="button">
            Open inventory
          </button>
          <EmbeddingModelDialog
            embedding={embedding}
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              onClose();
            }}
          />
        </>
      );
    }

    render(<Harness />, { container: rootElement });
    const trigger = screen.getByRole("button", { name: "Open inventory" });
    trigger.focus();
    fireEvent.click(trigger);

    const closeButton = screen.getByRole("button", {
      name: "Close embedding model inventory",
    });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(rootElement).not.toHaveAttribute("inert");
    expect(rootElement).toHaveAttribute("aria-hidden", "false");
  });

  it("closes on Escape and only on the overlay backdrop", () => {
    const onClose = vi.fn();
    const { rerender } = renderDialog({ onClose });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <EmbeddingModelDialog
        embedding={embedding}
        isOpen
        onClose={onClose}
      />,
    );
    const dialog = screen.getByRole("dialog", {
      name: "Commonly used embedding models",
    });
    const overlay = dialog.closest("[data-embedding-dialog-overlay]");

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("wraps keyboard focus in both directions", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", {
      name: "Commonly used embedding models",
    });
    const firstFocusableElement = screen.getByRole("button", {
      name: "Close embedding model inventory",
    });
    const documentationLinks = within(dialog).getAllByRole("link", {
      name: /Provider docs/,
    });
    const lastFocusableElement = documentationLinks.at(-1);

    expect(lastFocusableElement).toBeDefined();
    lastFocusableElement!.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstFocusableElement);

    firstFocusableElement.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastFocusableElement);
  });
});
