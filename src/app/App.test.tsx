import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import versionMetadata from "../../version.json";
import { App } from "./App";

function setLocation(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("App navigation", () => {
  beforeEach(() => {
    setLocation("/");
  });

  afterEach(() => {
    cleanup();
  });

  it("opens a demo without a document reload and returns through Back to lab", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("link", { name: "Start How RAG works walkthrough" }),
    );

    expect(window.location.pathname).toBe("/demos/rag");
    expect(screen.getByRole("heading", { name: /See how RAG/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Back to lab" }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: "Complex AI, made visible." })).toBeInTheDocument();
  });

  it("returns to the catalog through the RAG All demos link and brand", () => {
    setLocation("/demos/rag/index");
    render(<App />);

    expect(
      screen.getByRole("link", { name: "CloudOps AI Demo Lab home" }),
    ).toBeInTheDocument();
    expect(screen.getByText(`v${versionMetadata.version}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "All demos" }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: "Complex AI, made visible." })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("link", { name: "CloudOps AI Demo Lab home" }),
    );

    expect(window.location.pathname).toBe("/");
  });

  it("shows only the version and links Source to the aidemo repository", () => {
    render(<App />);

    expect(screen.getByText("CloudOps AI Demo Lab")).toBeInTheDocument();
    expect(screen.getByText(`v${versionMetadata.version}`)).toBeInTheDocument();
    expect(screen.queryByText(/Image v/)).not.toBeInTheDocument();

    const sourceLink = screen.getByRole("link", { name: "Source on GitHub" });
    expect(sourceLink).toHaveAttribute("href", "https://github.com/lqdflying/aidemo");
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps modified-click behavior available for opening a new browser context", () => {
    render(<App />);
    const startLink = screen.getByRole("link", {
      name: "Start How RAG works walkthrough",
    });

    fireEvent.click(startLink, { ctrlKey: true });

    expect(window.location.pathname).toBe("/");
  });

  it("opens the agent orchestration walkthrough from the catalog", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("link", {
        name: "Start How AI agents work walkthrough",
      }),
    );

    expect(window.location.pathname).toBe("/demos/agent-orchestration");
    expect(
      screen.getByRole("heading", {
        name: "See the complete AI agent system at work.",
      }),
    ).toBeInTheDocument();
  });
});
