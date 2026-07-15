import { fireEvent, render, screen, within } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RagDemo } from "./RagDemo";

function setLocation(path: string): void {
  window.history.replaceState({}, "", path);
}

function currentPathname(): string {
  return window.location.pathname;
}

function currentSearch(): string {
  return window.location.search;
}

describe("RagDemo routing and history", () => {
  beforeEach(() => {
    setLocation("/demos/rag/index");
  });

  afterEach(() => {
    cleanup();
  });

  it("deep-links to each phase from the URL", () => {
    setLocation("/demos/rag/index");
    const { unmount } = render(<RagDemo />);
    expect(
      screen.getByRole("region", { name: "Indexing pipeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Vector DB record details" }),
    ).toBeInTheDocument();
    unmount();

    setLocation("/demos/rag/retrieve?question=Why%20are%20embeddings%20useful");
    render(<RagDemo />);
    expect(
      screen.getByRole("region", { name: "Retrieval pipeline" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Indexing pipeline" }),
    ).not.toBeInTheDocument();
  });

  it("marks the active phase with aria-current in the timeline", () => {
    render(<RagDemo />);
    const nav = screen.getByRole("navigation", {
      name: "RAG walkthrough pages",
    });

    const indexStep = within(nav).getByRole("button", { name: /Index/ });
    expect(indexStep).toHaveAttribute("aria-current", "page");

    const retrieveStep = within(nav).getByRole("button", { name: /Retrieve/ });
    expect(retrieveStep).not.toHaveAttribute("aria-current");
  });

  it("changes the URL and active phase when the timeline is used", () => {
    render(<RagDemo />);
    const nav = screen.getByRole("navigation", {
      name: "RAG walkthrough pages",
    });

    fireEvent.click(within(nav).getByRole("button", { name: /Generate/ }));

    expect(currentPathname()).toBe("/demos/rag/generate");
    expect(
      screen.getByRole("region", { name: "Generation pipeline" }),
    ).toBeInTheDocument();
  });

  it("shows the question prompt bar only on the retrieve phase", () => {
    setLocation("/demos/rag/index");
    const { unmount } = render(<RagDemo />);
    expect(
      screen.queryByRole("heading", { name: "Change the question" }),
    ).not.toBeInTheDocument();
    unmount();

    setLocation("/demos/rag/retrieve?question=test");
    render(<RagDemo />);
    expect(
      screen.getByRole("heading", { name: "Change the question" }),
    ).toBeInTheDocument();
  });

  it("carries the question in the URL when advancing from retrieve to generate", () => {
    setLocation(
      "/demos/rag/retrieve?question=Why+are+embeddings+useful+for+retrieval%3F",
    );
    render(<RagDemo />);

    fireEvent.click(screen.getByRole("button", { name: /^Next:/ }));

    expect(currentPathname()).toBe("/demos/rag/generate");
    expect(currentSearch()).toContain("question=");
    expect(
      screen.getByRole("region", { name: "Generation pipeline" }),
    ).toBeInTheDocument();
  });

  it("loops within a single phase instead of advancing automatically", () => {
    setLocation("/demos/rag/generate");
    render(<RagDemo />);

    expect(
      screen.getByRole("region", { name: "Generation pipeline" }),
    ).toBeInTheDocument();

    // The final phase exposes "Restart walkthrough" rather than a next phase.
    expect(
      screen.getByRole("button", { name: /Restart walkthrough/ }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Restart walkthrough/ }),
    );
    expect(currentPathname()).toBe("/demos/rag/index");
  });
});
