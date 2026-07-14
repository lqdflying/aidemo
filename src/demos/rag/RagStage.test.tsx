import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
): void {
  render(
    <RagStage
      isComplete={playbackStatus === "completed"}
      playbackStatus={playbackStatus}
      position={getStoryPosition(ragStory, { sceneIndex, eventIndex })}
      simulation={simulation}
    />,
  );
}

describe("RagStage", () => {
  it("keeps every pipeline lane mounted while embeddings preserve chunk text", () => {
    renderStage(0, 2, "playing");

    expect(screen.getByRole("region", { name: "Indexing pipeline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Retrieval pipeline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Generation pipeline" })).toBeInTheDocument();

    expect(
      within(screen.getByRole("region", { name: "Indexing pipeline" })).getByText(
        "RAG retrieves relevant evidence before the model writes an answer.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Embedding")).toHaveLength(
      simulation.allChunks.length,
    );
    expect(
      document.querySelector('[data-event="embed-chunks"]'),
    ).toHaveAttribute("data-playback", "playing");
  });

  it("shows ranked selection without unmounting earlier indexing work", () => {
    renderStage(1, 3);

    expect(screen.getByRole("region", { name: "Indexing pipeline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Retrieval pipeline" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Generation pipeline" })).toBeInTheDocument();
    expect(screen.getByText("Source documents")).toBeInTheDocument();
    expect(screen.getAllByText("selected")).toHaveLength(
      simulation.retrievedChunkCount,
    );
    expect(
      document.querySelector('[data-event="select-evidence"]'),
    ).toHaveAttribute("data-playback", "paused");
  });

  it("maps final citation badges to the real context window", () => {
    renderStage(2, 2, "completed");

    const answer = screen.getByRole("region", { name: "Generated answer" });
    const citationBadges = within(answer)
      .getAllByTitle(/RAG in one page|Retrieval quality report|Vector search reference/);

    expect(citationBadges.length).toBeGreaterThanOrEqual(
      simulation.contextWindow.length,
    );
    expect(
      screen.getByText(`${simulation.retrievedChunkCount} sources`),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(1);
  });
});
