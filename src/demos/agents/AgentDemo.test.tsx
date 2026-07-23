import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentDemo } from "./AgentDemo";

function setLocation(path: string): void {
  window.history.replaceState({}, "", path);
}

const originalMatchMedia = window.matchMedia;

function getApplicationRoot(): HTMLElement {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("The application root is missing from the test document.");
  return rootElement;
}

function renderAgentDemo(): ReturnType<typeof render> {
  return render(<AgentDemo />, { container: getApplicationRoot() });
}

function mockMobileViewport(): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string): MediaQueryList => ({
      matches: query === "(max-width: 720px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
  });
}

describe("AgentDemo architecture explorer", () => {
  beforeEach(() => {
    setLocation("/demos/agent-orchestration/overview");
    const rootElement = document.createElement("div");
    rootElement.id = "root";
    document.body.append(rootElement);
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
    document.getElementById("root")?.remove();
    vi.useRealTimers();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
      writable: true,
    });
  });

  it("renders a generic teaching experience with one stable system canvas", () => {
    const { container } = renderAgentDemo();

    expect(screen.getByRole("heading", { name: "How AI agents work" }))
      .toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive AI agent system map" }))
      .toBeInTheDocument();
    expect(container.querySelectorAll(".agent-system-canvas")).toHaveLength(1);
    const harnessFrame = container.querySelector(".agent-harness-boundary__frame");
    const harnessLabel = container.querySelector(".agent-harness-boundary__label");
    expect(harnessFrame).toBeInTheDocument();
    expect(harnessLabel).toHaveTextContent("Agent harness boundary");
    expect(harnessFrame?.contains(harnessLabel)).toBe(false);
    expect(container.querySelector(".agent-architecture-atlas")).not.toBeInTheDocument();
    expect(container.querySelector(".agent-topology-focus")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/CloudOps|checkout|remediation|Cloud Control/i);
  });

  it("keeps the System lesson moving through a group tour and a live end-to-end flow", () => {
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    expect(map).toHaveAttribute("data-system-motion", "group-tour");
    expect(container.querySelectorAll(".agent-group-card[data-group-order]")).toHaveLength(8);

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(map).toHaveAttribute("data-system-motion", "harness-loop");
    expect(map).toHaveAttribute("data-flow-schedule", "system-overview");
    expect(container.querySelectorAll(
      '[data-flow-schedule="system-overview"][data-flow-id]',
    )).toHaveLength(13);
    expect(container.querySelectorAll(
      '[data-flow-schedule="system-overview"][data-flow-phase="11"][data-flow-id]',
    )).toHaveLength(2);
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "paused");
  });

  it("plays the System tour once and holds the full dataflow live", () => {
    vi.useFakeTimers();
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    expect(screen.getByText("System overview — pauses at end")).toHaveAttribute(
      "title",
      "The system tour runs once, then pauses so you can inspect or advance",
    );
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    act(() => vi.advanceTimersByTime(9_000));

    expect(map).toHaveAttribute("data-system-motion", "harness-loop");
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "playing");
    expect(screen.getByRole("button", { name: "Pause animation" }))
      .toBeInTheDocument();

    act(() => vi.advanceTimersByTime(48_000));

    expect(map).toHaveAttribute("data-system-motion", "harness-loop");
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "playing");
    expect(screen.getByRole("button", { name: "Pause animation" }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "playing");

    fireEvent.click(screen.getByRole("button", { name: "Restart page" }));
    expect(map).toHaveAttribute("data-system-motion", "group-tour");
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "idle");
  });

  it("keeps manual System steps paused but skips to the live final flow", () => {
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-system-motion", "harness-loop");
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "paused");

    fireEvent.click(screen.getByRole("button", { name: "Restart page" }));
    expect(map).toHaveAttribute("data-system-motion", "group-tour");

    fireEvent.click(screen.getByRole("button", { name: "Skip page" }));
    expect(map).toHaveAttribute("data-system-motion", "harness-loop");
    expect(container.querySelector(".agent-stage"))
      .toHaveAttribute("data-playback", "playing");
    expect(screen.getByRole("button", { name: "Pause animation" }))
      .toBeInTheDocument();
  });

  it("routes horizontal request and return labels through dedicated lanes", () => {
    setLocation("/demos/agent-orchestration/execute");
    const { container } = renderAgentDemo();
    const requestPath = container.querySelector(
      '[data-relationship-id="agents-to-tools"] path[data-flow-lane="forward"]',
    );
    const responsePath = container.querySelector(
      '[data-relationship-id="agents-to-tools"] path[data-flow-lane="return"]',
    );

    expect(container.querySelector(".agent-connectors"))
      .toHaveAttribute("viewBox", "0 0 1000 620");
    expect(container.querySelector("#agent-arrow-request"))
      .toHaveAttribute("markerUnits", "userSpaceOnUse");
    expect(container.querySelector("#agent-arrow-request"))
      .toHaveAttribute("viewBox", "0 0 7 6");
    expect(container.querySelector("#agent-arrow-request"))
      .toHaveAttribute("markerWidth", "7");
    expect(container.querySelector("#agent-arrow-request"))
      .toHaveAttribute("markerHeight", "6");
    expect(requestPath).toHaveAttribute("data-flow-tone", "request");
    expect(requestPath).toHaveAttribute("marker-end", "url(#agent-arrow-request)");
    expect(requestPath?.getAttribute("d")).toContain("556");
    expect(responsePath).toHaveAttribute("data-flow-tone", "response");
    expect(responsePath).toHaveAttribute("marker-end", "url(#agent-arrow-response)");
    expect(responsePath?.getAttribute("d")).toContain("592");
    expect(container.querySelector(
      '[data-relationship-id="runtime-to-context"] path[data-direction="forward"]',
    )).toHaveAttribute("d", "M 276 317 L 276 262");
    expect(container.querySelector(
      '[data-relationship-id="runtime-to-context"] path[data-direction="return"]',
    )).toHaveAttribute("d", "M 324 262 L 324 317");
    expect(container.querySelector(
      '[data-relationship-id="outcome-to-entry"] path[data-direction="forward"]',
    )?.getAttribute("d")).toContain("616");
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] text[data-flow-lane="forward"]',
    )).toHaveTextContent("validated tool call");
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] text[data-flow-lane="return"]',
    )).toHaveTextContent("result or explicit error");
  });

  it("deep-links to all lessons and preserves legacy route aliases", () => {
    setLocation("/demos/agent-orchestration/recover");
    const { unmount } = renderAgentDemo();

    expect(screen.getByText("Evaluate + retry: keep attempts separate")).toBeInTheDocument();
    const timeline = screen.getByRole("navigation", { name: "AI agent system lessons" });
    expect(within(timeline).getByRole("button", { name: /Evaluate \+ retry/ }))
      .toHaveAttribute("aria-current", "page");

    unmount();
    getApplicationRoot().remove();
    const replacementRoot = document.createElement("div");
    replacementRoot.id = "root";
    document.body.append(replacementRoot);
    setLocation("/demos/agent-orchestration/adapt");
    renderAgentDemo();
    expect(screen.getByText("Evaluate + retry: keep attempts separate")).toBeInTheDocument();
  });

  it("updates the URL and lesson from the shared timeline", () => {
    renderAgentDemo();
    const timeline = screen.getByRole("navigation", { name: "AI agent system lessons" });

    fireEvent.click(within(timeline).getByRole("button", { name: /Tools/ }));

    expect(window.location.pathname).toBe("/demos/agent-orchestration/execute");
    expect(screen.getByText("Tools: use typed functions and knowledge")).toBeInTheDocument();
    expect(screen.getByText("Tool request / return")).toBeInTheDocument();
  });

  it("shows eight grouped controls and every atomic component exactly once", () => {
    renderAgentDemo();

    for (const label of [
      "Input & channels",
      "Orchestrator",
      "Context & memory",
      "Models",
      "Agents & workers",
      "Tools & knowledge",
      "Governance",
      "Outcome & return",
    ]) {
      expect(screen.getByRole("region", { name: `${label} components` }))
        .toBeInTheDocument();
    }

    expect(screen.getAllByRole("button", { name: /^Inspect / })).toHaveLength(24);
  });

  it("pauses playback, opens exact component details, and restores focus", () => {
    setLocation("/demos/agent-orchestration/route");
    const { container } = renderAgentDemo();
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
    const trigger = screen.getByRole("button", { name: "Inspect Coordinator" });

    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Coordinator" });
    const overlay = dialog.closest("[data-agent-detail-overlay]");
    expect(overlay?.parentElement).toBe(document.body);
    expect(getApplicationRoot()).toHaveAttribute("inert");
    expect(getApplicationRoot()).toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("hidden");
    const implSummary = within(dialog).getByText("Implementation details")
      .closest("summary");
    const implDetails = implSummary?.closest("details");
    if (!(implSummary instanceof HTMLElement) || !(implDetails instanceof HTMLDetailsElement)) {
      throw new Error("The implementation details disclosure is missing.");
    }
    expect(implDetails).not.toHaveAttribute("open");

    fireEvent.click(implSummary);

    expect(implDetails).toHaveAttribute("open");
    expect(within(dialog).getByRole("figure", {
      name: "Coordinator platform blueprint",
    })).toBeInTheDocument();
    for (const field of [
      "Observe",
      "Decide",
      "Dispatch",
      "Evaluate",
      "Run record",
      "Exit or escalate",
    ]) {
      expect(within(dialog).getByText(field)).toBeInTheDocument();
    }
    expect(within(dialog).queryByText("Owns / does not own")).not.toBeInTheDocument();
    const openSourceRegion = within(dialog).getByRole("region", {
      name: "Build with open source",
    });
    const referenceStack = openSourceRegion.querySelector(".agent-open-source__stack");
    if (!(referenceStack instanceof HTMLElement)) {
      throw new Error("The open-source reference stack is missing.");
    }
    expect(within(referenceStack).getByText("LangGraph"))
      .toBeInTheDocument();
    expect(within(openSourceRegion).getByText("Reviewed 17 Jul 2026"))
      .toBeInTheDocument();
    const archSummary = within(openSourceRegion).getByText("Architecture track")
      .closest("summary");
    const archDetails = archSummary?.closest("details");
    if (!(archSummary instanceof HTMLElement) || !(archDetails instanceof HTMLDetailsElement)) {
      throw new Error("The collapsed architecture track section is missing.");
    }
    expect(archDetails).not.toHaveAttribute("open");

    fireEvent.click(archSummary);

    expect(archDetails).toHaveAttribute("open");
    expect(within(archDetails).getByRole("link", {
      name: "Open official LangGraph documentation",
    })).toHaveAttribute("href", "https://docs.langchain.com/oss/python/langgraph/overview");
    expect(trigger).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".agent-stage")).toHaveAttribute("data-playback", "paused");
    expect(within(dialog).getByRole("button", { name: "Close component details" }))
      .toHaveFocus();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close component details" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getApplicationRoot()).not.toHaveAttribute("inert");
    expect(getApplicationRoot()).not.toHaveAttribute("aria-hidden");
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });

  it("opens a full tools-and-knowledge platform blueprint and visual concepts", () => {
    renderAgentDemo();

    fireEvent.click(screen.getByRole("button", { name: /Tools & knowledge/ }));
    const groupDialog = screen.getByRole("dialog", { name: "Tools & knowledge" });
    expect(groupDialog).toHaveAttribute("data-detail-kind", "group");
    expect(within(groupDialog).getByRole("figure", {
      name: "Tools & knowledge platform blueprint",
    })).toBeInTheDocument();
    for (const label of [
      "Built-in functions & APIs",
      "MCP servers",
      "Global & enterprise search",
      "RAG corpus & index",
      "Retrieval pipeline",
      "Evidence bundle",
      "Offline RAG knowledge lifecycle",
    ]) {
      expect(within(groupDialog).getByText(label)).toBeInTheDocument();
    }
    expect(within(groupDialog).getByRole("button", { name: "Replay flow" }))
      .toBeInTheDocument();
    const toolsOpenSource = within(groupDialog).getByRole("region", {
      name: "Build with open source",
    });
    for (const solution of [
      "MCP protocol + stable official SDK",
      "FastMCP",
      "LangChain MCP Adapters",
      "ContextForge",
      "Pydantic AI",
    ]) {
      expect(within(toolsOpenSource).getAllByText(solution).length).toBeGreaterThan(0);
    }
    expect(within(toolsOpenSource).getByText(/keep every dependency on its current stable release/i))
      .toBeInTheDocument();
    fireEvent.click(within(groupDialog).getByRole("button", { name: "Close component details" }));

    fireEvent.click(screen.getByRole("button", { name: "Agent run loop" }));
    const conceptDialog = screen.getByRole("dialog", { name: "Agent run loop" });
    expect(conceptDialog).toHaveAttribute("data-detail-kind", "concept");
    expect(conceptDialog).toHaveAttribute("data-concept-id", "run-loop");
    expect(within(conceptDialog).getByRole("figure", {
      name: "run loop concept diagram",
    })).toBeInTheDocument();
    expect(within(conceptDialog).getByText(/explicit completion criteria/))
      .toBeInTheDocument();
    expect(within(conceptDialog).queryByRole("region", {
      name: "Build with open source",
    })).not.toBeInTheDocument();
  });

  it("shows the agent harness as a controlled responsibility-boundary diagram", () => {
    renderAgentDemo();
    fireEvent.click(screen.getByRole("button", { name: "Agent harness" }));

    const dialog = screen.getByRole("dialog", { name: "Agent harness" });
    expect(within(dialog).getByRole("region", {
      name: "Agent harness responsibility boundary",
    })).toBeInTheDocument();
    for (const label of [
      "State & context",
      "Orchestration",
      "Tools",
      "Policy",
      "Evaluation & tracing",
      "Delivery",
      "Replaceable model",
      "Request<T>",
      "Verified Result<T>",
      "Verified response",
    ]) {
      expect(within(dialog).getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("animates one run-loop adaptation before a separate verified exit", () => {
    renderAgentDemo();
    fireEvent.click(screen.getByRole("button", { name: "Agent run loop" }));

    const dialog = screen.getByRole("dialog", { name: "Agent run loop" });
    const stageList = within(dialog).getByRole("list", { name: "Agent run stages" });
    for (const label of ["Observe", "Decide", "Act", "Evaluate"]) {
      expect(within(stageList).getByText(label)).toBeInTheDocument();
    }
    expect(within(dialog).getByRole("region", {
      name: "Adapt loop back to Observe",
    })).toHaveTextContent("Adapt and observe again");
    expect(within(dialog).getByRole("region", {
      name: "Verified exit branch",
    })).toHaveTextContent("Verified exit");

    const diagramStage = dialog.querySelector('[data-concept-stage="run-loop"]');
    expect(diagramStage).toHaveAttribute("data-replay", "0");
    fireEvent.click(within(dialog).getByRole("button", { name: "Replay diagram" }));
    expect(dialog.querySelector('[data-concept-stage="run-loop"]'))
      .toHaveAttribute("data-replay", "1");
  });

  it("distinguishes typed requests, returns, errors, and explicit absence", () => {
    renderAgentDemo();
    fireEvent.click(screen.getByRole("button", { name: "Typed contracts" }));

    const dialog = screen.getByRole("dialog", { name: "Typed contracts" });
    expect(within(dialog).getByRole("region", { name: "Typed request contract" }))
      .toHaveTextContent("Request<T>");
    expect(within(dialog).getByRole("region", { name: "Typed return contract" }))
      .toHaveTextContent("Result<T> | TypedError | NoResult");
    for (const label of [
      "Schema",
      "Identity",
      "Scope",
      "Deadline",
      "Ownership",
      "Result<T>",
      "TypedError",
      "NoResult",
    ]) {
      expect(within(dialog).getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(dialog.querySelector('[data-tone="response"]')).toBeInTheDocument();
    expect(dialog.querySelector('[data-tone="error"]')).toBeInTheDocument();
    expect(dialog.querySelector('[data-tone="absence"]')).toBeInTheDocument();
  });

  it("traps focus and closes only from the modal backdrop", () => {
    renderAgentDemo();
    const trigger = screen.getByRole("button", { name: "Inspect Coordinator" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Coordinator" });
    const closeButton = within(dialog).getByRole("button", {
      name: "Close component details",
    });
    const overlay = dialog.closest<HTMLElement>("[data-agent-detail-overlay]");
    if (!overlay) throw new Error("The component dialog overlay is missing.");

    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();
    fireEvent.click(dialog);
    expect(dialog).toBeInTheDocument();

    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("draws a one-way sequence and a real request-return loop", () => {
    setLocation("/demos/agent-orchestration/prepare");
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    expect(map).toHaveAttribute("data-topology", "sequence");
    const inputPath = container.querySelector(
      '[data-relationship-id="entry-to-runtime"] [data-direction="forward"]',
    );
    expect(inputPath).toHaveAttribute("data-active", "true");
    expect(container.querySelector(
      '[data-relationship-id="entry-to-runtime"] [data-direction="return"]',
    )).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(map).toHaveAttribute("data-topology", "pair-loop");
    expect(container.querySelector(
      '[data-relationship-id="runtime-to-context"] [data-direction="forward"]',
    )).toHaveAttribute("data-flow-tone", "request");
    expect(container.querySelector(
      '[data-relationship-id="runtime-to-context"] [data-direction="return"]',
    )).toHaveAttribute("data-flow-tone", "response");
    expect(container.querySelector(
      '[data-flow-id="runtime-to-context:forward"]',
    )).toHaveAttribute("data-flow-phase", "0");
    expect(container.querySelector(
      '[data-flow-id="runtime-to-context:return"]',
    )).toHaveAttribute("data-flow-phase", "1");
    expect(screen.getByText("State feedback loop")).toBeInTheDocument();
  });

  it("fans star work outward before converging all worker returns", () => {
    setLocation("/demos/agent-orchestration/route");
    const { container } = renderAgentDemo();

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));

    expect(screen.getByRole("region", { name: "Interactive AI agent system map" }))
      .toHaveAttribute("data-topology", "star");
    const star = container.querySelector(".agent-star-overlay");
    expect(star).toBeInTheDocument();
    expect(star?.querySelectorAll('[data-flow-id="runtime-to-agents:forward"]'))
      .toHaveLength(3);
    expect(star?.querySelectorAll('[data-flow-id="runtime-to-agents:return"]'))
      .toHaveLength(3);
    expect(star?.querySelector('[data-flow-id="runtime-to-agents:forward"]'))
      .toHaveAttribute("data-flow-phase", "0");
    expect(star?.querySelector('[data-flow-id="runtime-to-agents:return"]'))
      .toHaveAttribute("data-flow-phase", "1");
    expect(star?.querySelectorAll(
      '.agent-star-overlay__path[data-direction="forward"][data-flow-tone="request"]',
    )).toHaveLength(3);
    expect(star?.querySelectorAll(
      '.agent-star-overlay__path[data-direction="return"][data-flow-tone="response"]',
    )).toHaveLength(3);
    expect(star?.querySelector("#agent-star-arrow-request"))
      .toHaveAttribute("markerUnits", "userSpaceOnUse");
    expect(star?.querySelector("#agent-star-arrow-request"))
      .toHaveAttribute("viewBox", "0 0 7 6");
    expect(star?.querySelectorAll(
      '.agent-star-overlay__path[data-direction="forward"][marker-end="url(#agent-star-arrow-request)"]',
    )).toHaveLength(3);
    expect(star?.querySelectorAll(
      '.agent-star-overlay__path[data-direction="return"][marker-end]',
    )).toHaveLength(0);
    expect(star?.querySelector('[data-star-trunk="request"]'))
      .toHaveAttribute("d", "M 386 412 L 402 412");
    expect(star?.querySelector('[data-star-trunk="request"]'))
      .not.toHaveAttribute("marker-end");
    expect(star?.querySelector('[data-star-trunk="return"]'))
      .toHaveAttribute("d", "M 402 436 L 386 436");
    expect(star?.querySelector('[data-star-trunk="return"]'))
      .toHaveAttribute("marker-end", "url(#agent-star-arrow-response)");
    expect(star?.querySelectorAll(
      '[marker-end="url(#agent-star-arrow-response)"]',
    )).toHaveLength(1);
    expect(star?.querySelectorAll("[data-star-junction]"))
      .toHaveLength(2);
    expect(star?.querySelector(
      '[data-flow-id="runtime-to-agents:forward"] .agent-flow-packet--head',
    )?.getAttribute("d")).toMatch(/^M 386 412 L 402 412/);
    expect(star?.querySelector(
      '[data-flow-id="runtime-to-agents:return"] .agent-flow-packet--head',
    )?.getAttribute("d")).toMatch(/L 386 436$/);
  });

  it("shows each failed call and retry as a separate attempt", () => {
    setLocation("/demos/agent-orchestration/recover");
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    expect(map).toHaveAttribute("data-topology", "retry");
    expect(map).toHaveAttribute("data-lesson-state", "active");
    expect(screen.getByText("Attempt 1 · request")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] [data-direction="forward"]',
    )).toHaveAttribute("data-state", "active");

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-lesson-state", "failed");
    expect(screen.getByText("Attempt 1 · timed out")).toBeInTheDocument();
    expect(screen.getByText("Timed out")).toBeInTheDocument();
    expect(screen.getAllByText(/deadline expired with no result/i).length)
      .toBeGreaterThan(0);
    expect(container.querySelector('[data-timeout-endpoint="tools"]'))
      .toBeInTheDocument();
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] [data-direction="forward"]',
    )).toHaveAttribute("data-state", "failed");
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] path[data-direction="forward"]',
    )).toHaveAttribute("marker-end", "url(#agent-arrow-failed)");
    expect(container.querySelector('[data-flow-id="agents-to-tools:return"]'))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-lesson-state", "retry");
    expect(screen.getByText("Attempt 2 · request")).toBeInTheDocument();
    expect(screen.getByText("Timed out")).toBeInTheDocument();
    expect(container.querySelector('[data-timeout-endpoint="tools"]'))
      .not.toBeInTheDocument();
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] [data-direction="forward"]',
    )).toHaveAttribute("data-state", "retry");

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-lesson-state", "recovered");
    expect(screen.getByText("Attempt 2 · returned")).toBeInTheDocument();
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] [data-direction="return"]',
    )).toHaveAttribute("data-state", "recovered");
    expect(container.querySelector(
      '[data-relationship-id="agents-to-tools"] path[data-direction="return"]',
    )).toHaveAttribute("marker-end", "url(#agent-arrow-recovered)");
  });

  it("closes the governance loop before a bounded action and outcome fan-out", () => {
    setLocation("/demos/agent-orchestration/govern");
    const { container } = renderAgentDemo();
    const map = screen.getByRole("region", { name: "Interactive AI agent system map" });

    expect(map).toHaveAttribute("data-topology", "sequence");
    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-topology", "cycle");
    for (const relationshipId of [
      "agents-to-governance",
      "governance-to-runtime",
      "runtime-to-agents",
    ]) {
      expect(container.querySelector(
        `[data-relationship-id="${relationshipId}"] [data-active="true"]`,
      )).toBeInTheDocument();
    }
    expect(container.querySelector('[data-flow-id="agents-to-governance:forward"]'))
      .toHaveAttribute("data-flow-phase", "0");
    expect(container.querySelector('[data-flow-id="governance-to-runtime:forward"]'))
      .toHaveAttribute("data-flow-phase", "1");
    expect(container.querySelector('[data-flow-id="runtime-to-agents:forward"]'))
      .toHaveAttribute("data-flow-phase", "2");
    expect(within(map).getByText(/closes the loop/i)).toBeInTheDocument();
    expect(screen.queryByText(/Approve remediation/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-topology", "sequence");
    fireEvent.click(screen.getByRole("button", { name: "Next animation step" }));
    expect(map).toHaveAttribute("data-topology", "fan-out");
    expect(within(map).getByText("Outcome fan-out")).toBeInTheDocument();
    expect(container.querySelector('[data-flow-id="outcome-to-context:forward"]'))
      .toHaveAttribute("data-flow-phase", "0");
    expect(container.querySelector('[data-flow-id="outcome-to-entry:forward"]'))
      .toHaveAttribute("data-flow-phase", "0");
    expect(screen.getByRole("button", { name: "Inspect Trace & telemetry" }))
      .toHaveAttribute("data-active", "true");
  });

  it("opens component details as an accessible mobile bottom sheet", () => {
    mockMobileViewport();
    renderAgentDemo();
    const trigger = screen.getByRole("button", { name: "Inspect Input gateway" });

    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Input gateway" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("button", { name: "Close component details" }))
      .toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("stops the recovery lesson after its accepted result", () => {
    vi.useFakeTimers();
    setLocation("/demos/agent-orchestration/recover");
    renderAgentDemo();
    fireEvent.click(screen.getByRole("button", { name: "Play animation" }));

    for (const durationMs of [8_000, 8_000, 8_000, 8_000]) {
      act(() => vi.advanceTimersByTime(durationMs));
    }

    const playButton = screen.getByRole("button", { name: "Play animation" });
    expect(playButton).toHaveTextContent("Replay");
    expect(screen.getByText("Attempt 2 · returned")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30_000));
    expect(playButton).toHaveTextContent("Replay");
  });
});
