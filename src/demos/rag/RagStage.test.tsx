import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getStoryPosition } from "../../framework/story";
import { simulateRag } from "./rag-simulator";
import { RagStage } from "./RagStage";
import { ragStory } from "./rag-story";

const simulation = simulateRag(
  "How does RAG make an answer more trustworthy?",
).data;

function renderStage(
  sceneIndex: number,
  eventIndex: number,
  playbackStatus: "idle" | "playing" | "paused" | "completed" = "paused",
  overrides: Partial<React.ComponentProps<typeof RagStage>> = {},
): ReturnType<typeof render> {
  return render(
    <RagStage
      isComplete={playbackStatus === "completed"}
      playbackStatus={playbackStatus}
      position={getStoryPosition(ragStory, { sceneIndex, eventIndex })}
      simulation={simulation}
      {...overrides}
    />,
  );
}

function getDatabaseConnector(container: HTMLElement): HTMLElement {
  const connector = container.querySelector<HTMLElement>(
    ".stage-connector--database",
  );

  expect(connector).toBeInTheDocument();
  return connector!;
}

describe("RagStage focused pages", () => {
  it("renders only the indexing pipeline on the index phase", () => {
    renderStage(0, 2, "playing");

    expect(
      screen.getByRole("region", { name: "Indexing pipeline" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Retrieval pipeline" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Generation pipeline" }),
    ).not.toBeInTheDocument();
  });

  it("shows the real embedding model and distinct production and teaching dimensions", () => {
    renderStage(0, 2, "playing");

    const indexLane = screen.getByRole("region", { name: "Indexing pipeline" });
    const embeddingTrigger = within(indexLane).getByRole("button", {
      name: "Open embedding model inventory",
    });

    expect(embeddingTrigger).toHaveTextContent("text-embedding-3-small");
    expect(embeddingTrigger).toHaveTextContent("1,536D");
    expect(embeddingTrigger).toHaveTextContent("production vector");
    expect(embeddingTrigger).toHaveTextContent("4-value teaching projection");

    expect(screen.getAllByText("Embedding")).toHaveLength(
      simulation.allChunks.length,
    );
    expect(
      within(indexLane).getByRole("button", {
        name: "Open Vector DB record details",
      }),
    ).toBeInTheDocument();
  });

  it("enables the embedding inventory only once embedding is reached", () => {
    const { rerender } = renderStage(0, 1, "paused");
    const pendingTrigger = screen.getByRole("button", {
      name: "Open embedding model inventory",
    });

    expect(pendingTrigger).toBeDisabled();

    rerender(
      <RagStage
        isComplete={false}
        playbackStatus="paused"
        position={getStoryPosition(ragStory, { sceneIndex: 0, eventIndex: 2 })}
        simulation={simulation}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Open embedding model inventory",
      }),
    ).toBeEnabled();
  });

  it("opens the embedding inventory and reports the optional callback", () => {
    const onEmbeddingModelOpen = vi.fn();
    renderStage(0, 2, "playing", { onEmbeddingModelOpen });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open embedding model inventory",
      }),
    );

    expect(onEmbeddingModelOpen).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("dialog", {
        name: "Commonly used embedding models",
      }),
    ).toBeInTheDocument();
  });

  it("keeps the embedding-to-database transfer pending before vectors are stored", () => {
    const { container } = renderStage(0, 2, "paused");
    const stage = container.querySelector(".rag-stage");
    const connector = getDatabaseConnector(container);
    const trigger = screen.getByRole("button", {
      name: "Open Vector DB record details",
    });

    expect(stage).toHaveAttribute("data-event", "embed-chunks");
    expect(stage).toHaveAttribute("data-playback", "paused");
    expect(connector).toHaveAttribute("data-state", "pending");
    expect(connector).not.toHaveClass("is-active");
    expect(
      connector.querySelectorAll(".vector-transfer-packet i"),
    ).toHaveLength(4);
    expect(trigger).toBeDisabled();
  });

  it("activates the embedding-to-database transfer while vectors are stored", () => {
    const { container } = renderStage(0, 3, "playing");
    const stage = container.querySelector(".rag-stage");
    const connector = getDatabaseConnector(container);
    const trigger = screen.getByRole("button", {
      name: "Open Vector DB record details",
    });

    expect(stage).toHaveAttribute("data-event", "store-vectors");
    expect(stage).toHaveAttribute("data-playback", "playing");
    expect(connector).toHaveAttribute("data-state", "active");
    expect(connector).toHaveClass("is-active");
    expect(trigger).toBeEnabled();
  });

  it("keeps the completed transfer visible without a playing state", () => {
    const { container } = renderStage(0, 3, "completed");
    const stage = container.querySelector(".rag-stage");
    const connector = getDatabaseConnector(container);

    expect(stage).toHaveAttribute("data-playback", "completed");
    expect(connector).toHaveAttribute("data-state", "complete");
    expect(connector).toHaveClass("is-active");
  });

  it("opens the Vector DB detail dialog when the Vector DB trigger is pressed", () => {
    const onVectorDbOpen = vi.fn();
    renderStage(0, 3, "playing", { onVectorDbOpen });

    const trigger = screen.getByRole("button", {
      name: "Open Vector DB record details",
    });
    fireEvent.click(trigger);

    expect(onVectorDbOpen).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "How one record becomes searchable" }),
    ).toBeInTheDocument();
  });

  it("renders only the retrieval pipeline with ranked evidence on the retrieve phase", () => {
    renderStage(1, 3, "playing");

    expect(
      screen.getByRole("region", { name: "Retrieval pipeline" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Indexing pipeline" }),
    ).not.toBeInTheDocument();

    const retrieveLane = screen.getByRole("region", {
      name: "Retrieval pipeline",
    });
    expect(
      within(retrieveLane).getByText(new RegExp(simulation.question.slice(0, 30))),
    ).toBeInTheDocument();
    expect(
      within(retrieveLane).getAllByText("selected"),
    ).toHaveLength(simulation.retrievedChunkCount);
  });

  it("renders only the generation pipeline with grounded citations on the generate phase", () => {
    renderStage(2, 2, "completed");

    expect(
      screen.getByRole("region", { name: "Generation pipeline" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Retrieval pipeline" }),
    ).not.toBeInTheDocument();

    const answer = screen.getByRole("region", { name: "Generated answer" });
    expect(
      within(answer).getByText(`${simulation.retrievedChunkCount} sources`),
    ).toBeInTheDocument();
  });
});
