import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentDemo } from "./AgentDemo";

function setLocation(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("AgentDemo routing and orchestration", () => {
  beforeEach(() => {
    setLocation("/demos/agent-orchestration/overview");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("deep-links to focused phases and marks the current act", () => {
    setLocation("/demos/agent-orchestration/recover");
    render(<AgentDemo />);

    expect(
      screen.getByText("Recover: re-plan one failed branch"),
    ).toBeInTheDocument();
    const timeline = screen.getByRole("navigation", {
      name: "Agent orchestration walkthrough pages",
    });
    expect(within(timeline).getByRole("button", { name: /Recover/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("maps legacy deep links to the closest new act", () => {
    setLocation("/demos/agent-orchestration/adapt");
    render(<AgentDemo />);

    expect(screen.getByText("Recover: re-plan one failed branch")).toBeInTheDocument();
  });

  it("updates the URL and canvas from the shared timeline", () => {
    render(<AgentDemo />);
    const timeline = screen.getByRole("navigation", {
      name: "Agent orchestration walkthrough pages",
    });

    fireEvent.click(within(timeline).getByRole("button", { name: /Execute/ }));

    expect(window.location.pathname).toBe("/demos/agent-orchestration/execute");
    expect(screen.getByText("Execute: agents use models, MCP, and RAG")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Agent architecture map" })).toBeInTheDocument();
  });

  it("opens exact component learning, pauses playback, and restores trigger focus", () => {
    render(<AgentDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    const trigger = screen.getByRole("button", { name: "Learn about Coordinator loop" });

    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Coordinator loop" });
    expect(within(dialog).getByRole("heading", { name: "What it does" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "State & authority" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Why this design" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "What can go wrong" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "In this incident" })).toBeInTheDocument();
    expect(within(dialog).getByText(/Router selects the bounded workflow/)).toBeInTheDocument();
    expect(within(dialog).getByText(/DAG exposes parallel investigations/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play animation" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play animation" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens a layer, drills into a component, and navigates back", () => {
    render(<AgentDemo />);
    const trigger = screen.getAllByRole("button", { name: "Learn about Agent runtime" })[0]!;
    fireEvent.click(trigger);

    const layerDialog = screen.getByRole("dialog", { name: "Agent runtime" });
    fireEvent.click(within(layerDialog).getByRole("button", { name: "Learn about Coordinator loop" }));

    const componentDialog = screen.getByRole("dialog", { name: "Coordinator loop" });
    expect(within(componentDialog).getByRole("button", { name: "Back to previous architecture detail" })).toBeInTheDocument();
    fireEvent.click(within(componentDialog).getByRole("button", { name: "Back to previous architecture detail" }));

    expect(screen.getByRole("dialog", { name: "Agent runtime" })).toBeInTheDocument();
  });

  it("teaches Harness Engineering and Loop Engineering from the live architecture", () => {
    render(<AgentDemo />);

    expect(
      screen.getByRole("region", { name: /Loop Engineering, System framing, decide/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Intent & skills")).toBeInTheDocument();
    expect(screen.getByText("Context & memory")).toBeInTheDocument();
    expect(screen.getByText("Tools & isolation")).toBeInTheDocument();
    expect(screen.getByText("Policy & authority")).toBeInTheDocument();
    expect(screen.getByText("Trace & evaluation")).toBeInTheDocument();

    const harnessTrigger = screen.getByRole("button", { name: "Learn about Harness Engineering" });
    harnessTrigger.focus();
    fireEvent.click(harnessTrigger);
    let dialog = screen.getByRole("dialog", { name: "Harness Engineering" });
    expect(within(dialog).getByRole("heading", { name: "What the harness makes explicit" })).toBeInTheDocument();
    expect(within(dialog).getByText("Model responsibility")).toBeInTheDocument();
    expect(within(dialog).getByText("Harness responsibility")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(harnessTrigger).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Learn about Loop Engineering" }));
    dialog = screen.getByRole("dialog", { name: "Loop Engineering" });
    expect(within(dialog).getByRole("heading", { name: "How this run advances" })).toBeInTheDocument();
    expect(within(dialog).getByText("Retry budget")).toBeInTheDocument();
    expect(within(dialog).getByText(/One separate narrowed Logs MCP attempt/)).toBeInTheDocument();
    expect(within(dialog).getByText("Stop / escalate")).toBeInTheDocument();
  });

  it("removes ambiguous trace and pattern controls", () => {
    render(<AgentDemo />);

    expect(screen.queryByRole("button", { name: /Full trace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Patterns/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Handoff \/ Swarm/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hierarchical/i)).not.toBeInTheDocument();
  });

  it("runs, fails, retries, and recovers as separate attempts", () => {
    setLocation("/demos/agent-orchestration/recover");
    render(<AgentDemo />);

    const map = screen.getByRole("region", { name: "Agent architecture map" });
    const attempts = screen.getByRole("region", { name: "Recovery attempt history" });
    expect(map).toHaveAttribute("data-trace-state", "progress");
    expect(screen.getByText("Attempt 1 is still running. No result exists yet.")).toBeInTheDocument();
    expect(within(attempts).getByText("Running broad query")).toBeInTheDocument();
    expect(within(attempts).getByText("Waiting for re-plan")).toBeInTheDocument();
    expect(map.querySelector('[data-edge-id="logs-agent-to-mcp"]')).toHaveAttribute(
      "data-state",
      "active",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(map).toHaveAttribute("data-trace-state", "failed");
    expect(
      screen.getByText("Failed observation. Nothing continues as a result."),
    ).toBeInTheDocument();
    expect(map.querySelector('[data-edge-id="logs-agent-to-mcp"]')).toHaveAttribute(
      "data-state",
      "failed",
    );
    expect(map.querySelector('[data-node-id="logs-mcp"]')).toHaveAttribute(
      "data-state",
      "failed",
    );
    expect(screen.getByText("Attempt 1 ended · no result advanced")).toBeInTheDocument();
    expect(within(attempts).getByText("Failed · timeout")).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Learn about Logs MCP" })[0]!,
    );
    let dialog = screen.getByRole("dialog", { name: "Logs MCP" });
    expect(within(dialog).getByText("Attempt 1 · failed")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Attempt 2/)).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(map).toHaveAttribute("data-trace-state", "retry");
    expect(
      screen.getByText("New attempt. The failed call remains separate."),
    ).toBeInTheDocument();
    expect(map.querySelector('[data-edge-id="logs-agent-to-mcp"]')).toHaveAttribute(
      "data-state",
      "retry",
    );
    expect(screen.getByText("Attempt 2 · separate bounded call running")).toBeInTheDocument();
    expect(within(attempts).getByText("Running narrow query")).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Learn about Logs MCP" })[0]!,
    );
    dialog = screen.getByRole("dialog", { name: "Logs MCP" });
    expect(within(dialog).getByText("Attempt 1 · failed")).toBeInTheDocument();
    expect(within(dialog).queryByText("Attempt 2 · recovered")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(map).toHaveAttribute("data-trace-state", "recovered");
    expect(screen.getByText("Attempt 2 succeeded. Evidence can now advance.")).toBeInTheDocument();
    expect(map.querySelector('[data-edge-id="logs-agent-to-mcp"]')).toHaveAttribute(
      "data-state",
      "recovered",
    );
    expect(screen.getByText("Attempt 2 succeeded · evidence returned")).toBeInTheDocument();
    expect(within(attempts).getByText("Succeeded · evidence returned")).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Learn about Logs MCP" })[0]!,
    );
    dialog = screen.getByRole("dialog", { name: "Logs MCP" });
    expect(within(dialog).getByText("Attempt 1 · failed")).toBeInTheDocument();
    expect(within(dialog).getByText("Attempt 2 · recovered")).toBeInTheDocument();
  });

  it("stops Recover after the successful evidence is reconciled", () => {
    vi.useFakeTimers();
    setLocation("/demos/agent-orchestration/recover");
    render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));

    for (const durationMs of [12_000, 6_000, 8_000, 14_000, 10_000, 12_000, 13_000]) {
      act(() => vi.advanceTimersByTime(durationMs));
    }

    const attempts = screen.getByRole("region", { name: "Recovery attempt history" });
    const map = screen.getByRole("region", { name: "Agent architecture map" });
    const playButton = screen.getByRole("button", { name: "Play animation" });
    expect(playButton).toHaveTextContent("Replay");
    expect(map).toHaveTextContent("Run output quality gate");
    expect(within(attempts).getByText("Failed · timeout")).toBeInTheDocument();
    expect(within(attempts).getByText("Succeeded · evidence returned")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(30_000));

    expect(playButton).toHaveTextContent("Replay");
    expect(map).toHaveTextContent("Run output quality gate");
  });

  it("pauses at the primary approval gate and blocks playback shortcuts", () => {
    vi.useFakeTimers();
    setLocation("/demos/agent-orchestration/govern");
    render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    act(() => vi.advanceTimersByTime(14_000));

    expect(screen.getByRole("button", { name: "Approve remediation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play animation" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next animation step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Skip page/ })).toBeDisabled();
  });

  it("executes Cloud Control actions only after primary approval", () => {
    vi.useFakeTimers();
    setLocation("/demos/agent-orchestration/govern");
    render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    act(() => vi.advanceTimersByTime(14_000));
    fireEvent.click(screen.getByRole("button", { name: "Approve remediation" }));

    expect(screen.getByRole("heading", { name: "Cloud Control actions complete" })).toBeInTheDocument();
    expect(screen.getByText(/Scale checkout workers from 6 to 10/)).toBeInTheDocument();
  });

  it("builds a safer plan, asks again, and can stop without action", () => {
    vi.useFakeTimers();
    setLocation("/demos/agent-orchestration/govern");
    render(<AgentDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    act(() => vi.advanceTimersByTime(14_000));
    fireEvent.click(screen.getByRole("button", { name: "Request safer canary" }));

    expect(screen.getByRole("heading", { name: "Use a rolling canary" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(16_000));
    expect(screen.getByRole("button", { name: "Approve safer plan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop without acting" }));
    expect(screen.getByRole("heading", { name: "No external action" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Use a rolling canary" })).toBeInTheDocument();
  });
});
