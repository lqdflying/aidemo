import { describe, expect, it } from "vitest";

import {
  createInitialPlaybackState,
  createPlaybackReducer,
  getPlaybackDelayMs,
} from "./playback";
import type { DemoStory } from "./types";

const story: DemoStory<"one" | "two"> = {
  id: "playback-story",
  title: "Playback story",
  scenes: [
    {
      id: "one",
      act: 1,
      title: "One",
      shortTitle: "One",
      summary: "First step.",
      events: [
        {
          id: "one-event",
          kind: "one",
          title: "One event",
          explanation: "First event.",
          durationMs: 600,
          easing: "ease-out",
          accent: "input",
        },
      ],
    },
    {
      id: "two",
      act: 2,
      title: "Two",
      shortTitle: "Two",
      summary: "Second step.",
      events: [
        {
          id: "two-event",
          kind: "two",
          title: "Two event",
          explanation: "Second event.",
          durationMs: 800,
          easing: "ease-out",
          accent: "generation",
        },
      ],
    },
  ],
};

describe("playback reducer", () => {
  const reducer = createPlaybackReducer(story);

  it("plays, pauses, and completes the story", () => {
    const initialState = createInitialPlaybackState();
    const playingState = reducer(initialState, { type: "play" });
    expect(playingState.status).toBe("playing");

    const advancedState = reducer(playingState, { type: "next" });
    expect(advancedState).toMatchObject({
      sceneIndex: 1,
      eventIndex: 0,
      status: "playing",
    });

    const completedState = reducer(advancedState, { type: "next" });
    expect(completedState.status).toBe("completed");
  });

  it("restarts from the beginning and supports speed and reduced motion", () => {
    const state = reducer(
      reducer(createInitialPlaybackState(), { type: "play" }),
      { type: "next" },
    );
    const slowState = reducer(state, { type: "set-speed", speed: 0.75 });
    expect(getPlaybackDelayMs(story, slowState)).toBe(1067);

    const reducedState = reducer(slowState, {
      type: "set-reduced-motion",
      reducedMotion: true,
    });
    expect(getPlaybackDelayMs(story, reducedState)).toBe(1067);
    expect(
      reducer(reducedState, { type: "restart", autoplay: true }),
    ).toMatchObject({
      sceneIndex: 0,
      eventIndex: 0,
      status: "playing",
    });
  });

  it("skips to the final event", () => {
    expect(
      reducer(createInitialPlaybackState(), { type: "skip" }),
    ).toMatchObject({
      sceneIndex: 1,
      eventIndex: 0,
      status: "completed",
    });

    expect(
      reducer(createInitialPlaybackState(), {
        type: "skip",
        autoplay: true,
      }),
    ).toMatchObject({
      sceneIndex: 1,
      eventIndex: 0,
      status: "playing",
    });
  });
});
