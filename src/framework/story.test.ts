import { describe, expect, it } from "vitest";

import {
  getNextCursor,
  getPreviousCursor,
  getStoryPosition,
  validateStory,
} from "./story";
import type { DemoStory } from "./types";

const story: DemoStory<"prepare" | "answer"> = {
  id: "test-story",
  title: "Test story",
  scenes: [
    {
      id: "first",
      act: 1,
      title: "First act",
      shortTitle: "First",
      summary: "Prepare the input.",
      events: [
        {
          id: "prepare-input",
          kind: "prepare",
          title: "Prepare input",
          explanation: "The system receives a question.",
          durationMs: 300,
          easing: "ease-out",
          accent: "input",
        },
      ],
    },
    {
      id: "second",
      act: 2,
      title: "Second act",
      shortTitle: "Second",
      summary: "Answer the input.",
      events: [
        {
          id: "generate-answer",
          kind: "answer",
          title: "Generate answer",
          explanation: "The system produces a response.",
          durationMs: 500,
          easing: "ease-out",
          accent: "generation",
          dependencies: ["prepare-input"],
        },
      ],
    },
  ],
};

describe("story navigation", () => {
  it("validates ordered dependencies and exposes global event position", () => {
    expect(() => validateStory(story)).not.toThrow();
    expect(getStoryPosition(story, { sceneIndex: 1, eventIndex: 0 })).toMatchObject({
      eventNumber: 2,
      totalEvents: 2,
      scene: story.scenes[1],
      event: story.scenes[1]?.events[0],
    });
  });

  it("moves across events and scenes in both directions", () => {
    expect(getNextCursor(story, { sceneIndex: 0, eventIndex: 0 })).toEqual({
      sceneIndex: 1,
      eventIndex: 0,
    });
    expect(getNextCursor(story, { sceneIndex: 1, eventIndex: 0 })).toBeUndefined();
    expect(getPreviousCursor(story, { sceneIndex: 1, eventIndex: 0 })).toEqual({
      sceneIndex: 0,
      eventIndex: 0,
    });
    expect(getPreviousCursor(story, { sceneIndex: 0, eventIndex: 0 })).toBeUndefined();
  });

  it("rejects a dependency that points to a future event", () => {
    const invalidStory: DemoStory<"prepare" | "answer"> = {
      ...story,
      scenes: [
        {
          ...story.scenes[0]!,
          events: [
            {
              ...story.scenes[0]!.events[0]!,
              dependencies: ["generate-answer"],
            },
          ],
        },
        story.scenes[1]!,
      ],
    };

    expect(() => validateStory(invalidStory)).toThrow(
      'depends on unknown or future event "generate-answer"',
    );
  });
});
