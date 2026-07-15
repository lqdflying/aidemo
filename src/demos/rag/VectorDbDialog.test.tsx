import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { simulateRag } from "./rag-simulator";
import { VectorDbDialog } from "./VectorDbDialog";

const simulation = simulateRag(
  "How does RAG make an answer more trustworthy?",
).data;

const detailStepTitles = [
  "Keep the source passage",
  "Run the embedding model",
  "Serialize the stored fields",
  "Insert into the vector index",
  "Compare a query vector",
];

function getApplicationRoot(): HTMLElement {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("The application root is missing from the test document.");
  }

  return rootElement;
}

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof VectorDbDialog>> = {},
): ReturnType<typeof render> {
  return render(
    <VectorDbDialog
      isOpen
      onClose={vi.fn()}
      simulation={simulation}
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

describe("VectorDbDialog", () => {
  it("portals a modal overlay outside the application root", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", {
      name: "How one record becomes searchable",
    });
    const overlay = dialog.closest("[data-vector-dialog-overlay]");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(overlay).toBeInTheDocument();
    expect(overlay?.parentElement).toBe(document.body);
    expect(document.getElementById("root")).toHaveAttribute("inert");
    expect(document.getElementById("root")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("starts paused and exposes all five detail steps via manual stepping", () => {
    renderDialog();

    const animation = screen.getByRole("region", {
      name: "Vector record animation",
    });

    expect(within(animation).getByText("Paused")).toBeInTheDocument();
    expect(
      within(animation).getByRole("heading", { name: detailStepTitles[0] }),
    ).toBeInTheDocument();

    for (let step = 1; step < detailStepTitles.length; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next detail step" }));
      expect(
        within(animation).getByRole("heading", {
          name: detailStepTitles[step],
        }),
      ).toBeInTheDocument();
    }

    expect(
      screen.getByRole("button", { name: "Next detail step" }),
    ).toBeDisabled();
  });

  it("plays and restarts the detail animation", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Next detail step" }));
    expect(
      screen.getByRole("heading", { name: detailStepTitles[1] }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /^Restart/ },
      ),
    );
    expect(
      screen.getByRole("heading", { name: detailStepTitles[0] }),
    ).toBeInTheDocument();
  });

  it("renders the real selected record payload and distinguishes stored vs calculated fields", () => {
    renderDialog();

    const firstRecord = simulation.vectorRecords[0]!;
    const inspector = screen.getByLabelText("Vector record inspector");

    // Advance to the serialize step so stored fields are populated.
    fireEvent.click(screen.getByRole("button", { name: "Next detail step" }));
    fireEvent.click(screen.getByRole("button", { name: "Next detail step" }));

    expect(
      within(inspector).getByText(new RegExp(firstRecord.documentTitle)),
    ).toBeInTheDocument();
    expect(within(inspector).getByText("Stored record")).toBeInTheDocument();

    const schema = within(inspector).getByText(
      "Similarity and rank are calculated during search, not stored in this record.",
    );
    expect(schema).toBeInTheDocument();
  });

  it("resets to the first step and swaps payload when a record is selected", () => {
    renderDialog();

    const secondRecord = simulation.vectorRecords[1]!;
    const records = screen.getByLabelText("Stored vector records");

    fireEvent.click(
      within(records).getByRole("button", { name: new RegExp(secondRecord.chunkLabel) }),
    );

    expect(
      screen.getByRole("heading", { name: detailStepTitles[0] }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(secondRecord.text),
    ).toBeInTheDocument();
  });

  it("shows nearest neighbors with similarity scores during the search step", () => {
    renderDialog();

    for (let step = 0; step < detailStepTitles.length - 1; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next detail step" }));
    }

    const inspector = screen.getByLabelText("Vector record inspector");
    expect(within(inspector).getByText("Nearest records")).toBeInTheDocument();
    expect(within(inspector).getAllByText(/%/)).toHaveLength(3);
  });

  it("closes via the close button and restores focus to the trigger", () => {
    const onClose = vi.fn();

    function Harness(): React.JSX.Element {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button
            data-trigger
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Open dialog
          </button>
          <VectorDbDialog
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              onClose();
            }}
            simulation={simulation}
          />
        </>
      );
    }

    render(<Harness />, { container: getApplicationRoot() });
    const trigger = screen.getByText("Open dialog");
    trigger.focus();
    fireEvent.click(trigger);

    expect(
      screen.getByRole("heading", { name: "How one record becomes searchable" }),
    ).toBeInTheDocument();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close Vector DB details" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Close Vector DB details" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(document.getElementById("root")).not.toHaveAttribute("inert");
    expect(document.getElementById("root")).not.toHaveAttribute("aria-hidden");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes only when the overlay backdrop is clicked", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    const dialog = screen.getByRole("dialog", {
      name: "How one record becomes searchable",
    });
    const overlay = dialog.closest("[data-vector-dialog-overlay]")!;

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps keyboard focus inside the modal", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", {
      name: "How one record becomes searchable",
    });
    const firstFocusableElement = screen.getByRole("button", {
      name: "Close Vector DB details",
    });
    const lastFocusableElement = within(dialog).getByRole("button", {
      name: /^Restart/,
    });

    lastFocusableElement.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstFocusableElement);

    firstFocusableElement.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastFocusableElement);
  });
});
