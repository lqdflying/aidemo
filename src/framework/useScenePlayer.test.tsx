import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useScenePlayer } from "./useScenePlayer";
import type { DemoStory } from "./types";

const story: DemoStory<"start" | "finish"> = {
  id: "hook-story",
  title: "Hook story",
  scenes: [
    {
      id: "start",
      act: 1,
      title: "Start",
      shortTitle: "Start",
      summary: "Start the story.",
      events: [
        {
          id: "start-event",
          kind: "start",
          title: "Start",
          explanation: "The story starts.",
          durationMs: 20,
          easing: "ease-out",
          accent: "input",
        },
      ],
    },
    {
      id: "finish",
      act: 2,
      title: "Finish",
      shortTitle: "Finish",
      summary: "Finish the story.",
      events: [
        {
          id: "finish-event",
          kind: "finish",
          title: "Finish",
          explanation: "The story finishes.",
          durationMs: 20,
          easing: "ease-out",
          accent: "evidence",
        },
      ],
    },
  ],
};

describe("useScenePlayer", () => {
  it("advances automatically and exposes progress", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScenePlayer(story));

    expect(result.current.position.eventNumber).toBe(1);
    expect(result.current.progressPercent).toBe(0);

    act(() => result.current.controls.play());
    act(() => vi.advanceTimersByTime(20));

    expect(result.current.position.eventNumber).toBe(2);
    expect(result.current.progressPercent).toBe(100);

    act(() => vi.advanceTimersByTime(20));
    expect(result.current.state.status).toBe("completed");
    vi.useRealTimers();
  });

  it("stops advancing after pause", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScenePlayer(story));

    act(() => result.current.controls.play());
    act(() => result.current.controls.pause());
    act(() => vi.advanceTimersByTime(100));

    expect(result.current.position.eventNumber).toBe(1);
    expect(result.current.state.status).toBe("paused");
    vi.useRealTimers();
  });

  it("wraps to the first event while loop playback remains active", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useScenePlayer(story, { loop: true }),
    );

    act(() => result.current.controls.play());
    act(() => vi.advanceTimersByTime(20));
    expect(result.current.position.eventNumber).toBe(2);

    act(() => vi.advanceTimersByTime(20));
    expect(result.current.position.eventNumber).toBe(1);
    expect(result.current.state.status).toBe("playing");
    vi.useRealTimers();
  });
});
