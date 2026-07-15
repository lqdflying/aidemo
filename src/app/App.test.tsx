import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

    fireEvent.click(screen.getByRole("link", { name: "Start walkthrough" }));

    expect(window.location.pathname).toBe("/demos/rag");
    expect(screen.getByRole("heading", { name: /See how RAG/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Back to lab" }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: "Complex AI, made visible." })).toBeInTheDocument();
  });

  it("returns to the catalog through the RAG All demos link and brand", () => {
    setLocation("/demos/rag/index");
    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "All demos" }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: "Complex AI, made visible." })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "AI Demo Lab home" }));

    expect(window.location.pathname).toBe("/");
  });

  it("keeps modified-click behavior available for opening a new browser context", () => {
    render(<App />);
    const startLink = screen.getByRole("link", { name: "Start walkthrough" });

    fireEvent.click(startLink, { ctrlKey: true });

    expect(window.location.pathname).toBe("/");
  });
});
