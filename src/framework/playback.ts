import type { DemoStory } from "./types";
import {
  getNextCursor,
  getPreviousCursor,
  getStoryPosition,
  type StoryCursor,
} from "./story";

export type PlaybackStatus = "idle" | "playing" | "paused" | "completed";
export type PlaybackSpeed = 0.75 | 1 | 1.5;

export interface PlaybackState extends StoryCursor {
  readonly status: PlaybackStatus;
  readonly speed: PlaybackSpeed;
  readonly reducedMotion: boolean;
}

export type PlaybackAction =
  | { readonly type: "play" }
  | { readonly type: "pause" }
  | { readonly type: "next" }
  | { readonly type: "previous" }
  | { readonly type: "restart"; readonly autoplay?: boolean }
  | { readonly type: "complete" }
  | { readonly type: "skip"; readonly autoplay?: boolean }
  | { readonly type: "set-speed"; readonly speed: PlaybackSpeed }
  | { readonly type: "set-reduced-motion"; readonly reducedMotion: boolean }
  | {
      readonly type: "go-to-scene";
      readonly sceneIndex: number;
      readonly autoplay?: boolean;
    };

export function createInitialPlaybackState(
  reducedMotion = false,
): PlaybackState {
  return {
    sceneIndex: 0,
    eventIndex: 0,
    status: "idle",
    speed: 1,
    reducedMotion,
  };
}

export function createPlaybackReducer<EventKind extends string>(
  story: DemoStory<EventKind>,
): (state: PlaybackState, action: PlaybackAction) => PlaybackState {
  return (state, action) => {
    switch (action.type) {
      case "play":
        if (state.status === "completed") {
          return {
            ...state,
            sceneIndex: 0,
            eventIndex: 0,
            status: "playing",
          };
        }
        return { ...state, status: "playing" };

      case "pause":
        return state.status === "playing"
          ? { ...state, status: "paused" }
          : state;

      case "next": {
        const nextCursor = getNextCursor(story, state);
        if (!nextCursor) {
          return { ...state, status: "completed" };
        }
        return {
          ...state,
          ...nextCursor,
          status: state.status === "idle" ? "paused" : state.status,
        };
      }

      case "previous": {
        const previousCursor = getPreviousCursor(story, state);
        if (!previousCursor) {
          return {
            ...state,
            sceneIndex: 0,
            eventIndex: 0,
            status: "paused",
          };
        }
        return {
          ...state,
          ...previousCursor,
          status: "paused",
        };
      }

      case "restart":
        return {
          ...state,
          sceneIndex: 0,
          eventIndex: 0,
          status: action.autoplay ? "playing" : "idle",
        };

      case "complete":
      case "skip": {
        const finalSceneIndex = story.scenes.length - 1;
        const finalScene = story.scenes[finalSceneIndex];
        if (!finalScene) {
          return state;
        }
        return {
          ...state,
          sceneIndex: finalSceneIndex,
          eventIndex: finalScene.events.length - 1,
          status:
            action.type === "skip" && action.autoplay
              ? "playing"
              : "completed",
        };
      }

      case "set-speed":
        return { ...state, speed: action.speed };

      case "set-reduced-motion":
        return { ...state, reducedMotion: action.reducedMotion };

      case "go-to-scene": {
        const targetScene = story.scenes[action.sceneIndex];
        if (!targetScene) {
          return state;
        }
        return {
          ...state,
          sceneIndex: action.sceneIndex,
          eventIndex: 0,
          status: action.autoplay ? "playing" : "paused",
        };
      }
    }
  };
}

export function getPlaybackDelayMs<EventKind extends string>(
  story: DemoStory<EventKind>,
  state: PlaybackState,
): number {
  const { event } = getStoryPosition(story, state);
  return Math.round(event.durationMs / state.speed);
}
