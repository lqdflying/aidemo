import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
} from "react";

import {
  createInitialPlaybackState,
  createPlaybackReducer,
  getPlaybackDelayMs,
  type PlaybackAction,
  type PlaybackSpeed,
  type PlaybackState,
} from "./playback";
import { getNextCursor, getStoryPosition, validateStory } from "./story";
import type { DemoStory } from "./types";

export interface ScenePlayerControls {
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  readonly next: () => void;
  readonly previous: () => void;
  readonly restart: (autoplay?: boolean) => void;
  readonly skip: () => void;
  readonly setSpeed: (speed: PlaybackSpeed) => void;
  readonly goToScene: (sceneIndex: number, autoplay?: boolean) => void;
}

export interface ScenePlayer<EventKind extends string> {
  readonly state: PlaybackState;
  readonly position: ReturnType<typeof getStoryPosition<EventKind>>;
  readonly progressPercent: number;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly controls: ScenePlayerControls;
}

export type ScenePlayerEndBehavior = "complete" | "loop" | "hold-final";

export interface ScenePlayerOptions {
  readonly endBehavior?: ScenePlayerEndBehavior;
}

function usePrefersReducedMotion(): boolean {
  const getInitialPreference = (): boolean =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const [reducedMotion, updateReducedMotion] = useReducer(
    (_previousPreference: boolean, nextPreference: boolean) => nextPreference,
    undefined,
    getInitialPreference,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );

    if (!mediaQuery) {
      return undefined;
    }

    const handlePreferenceChange = (event: MediaQueryListEvent): void => {
      updateReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handlePreferenceChange);
    return () => mediaQuery.removeEventListener("change", handlePreferenceChange);
  }, []);

  return reducedMotion;
}

function createControls(
  state: PlaybackState,
  dispatch: Dispatch<PlaybackAction>,
  endBehavior: ScenePlayerEndBehavior,
): ScenePlayerControls {
  return {
    play: () => dispatch({ type: "play" }),
    pause: () => dispatch({ type: "pause" }),
    toggle: () =>
      dispatch({ type: state.status === "playing" ? "pause" : "play" }),
    next: () => dispatch({ type: "next" }),
    previous: () => dispatch({ type: "previous" }),
    restart: (autoplay = false) =>
      dispatch({ type: "restart", autoplay }),
    skip: () =>
      dispatch({ type: "skip", autoplay: endBehavior === "hold-final" }),
    setSpeed: (speed) => dispatch({ type: "set-speed", speed }),
    goToScene: (sceneIndex, autoplay = false) =>
      dispatch({ type: "go-to-scene", sceneIndex, autoplay }),
  };
}

export function useScenePlayer<EventKind extends string>(
  story: DemoStory<EventKind>,
  options: ScenePlayerOptions = {},
): ScenePlayer<EventKind> {
  const endBehavior = options.endBehavior ?? "complete";
  const reducedMotion = usePrefersReducedMotion();
  const reducer = useMemo(() => {
    validateStory(story);
    return createPlaybackReducer(story);
  }, [story]);
  const [state, dispatch] = useReducer(
    reducer,
    reducedMotion,
    createInitialPlaybackState,
  );

  useEffect(() => {
    dispatch({ type: "set-reduced-motion", reducedMotion });
  }, [reducedMotion]);

  useEffect(() => {
    if (state.status !== "playing") {
      return undefined;
    }

    const nextCursor = getNextCursor(story, state);
    if (!nextCursor && endBehavior === "hold-final") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (nextCursor) {
        dispatch({ type: "next" });
        return;
      }

      dispatch(
        endBehavior === "loop"
          ? { type: "restart", autoplay: true }
          : { type: "complete" },
      );
    }, getPlaybackDelayMs(story, state));

    return () => window.clearTimeout(timeoutId);
  }, [
    state.eventIndex,
    state.reducedMotion,
    state.sceneIndex,
    state.speed,
    state.status,
    endBehavior,
    story,
  ]);

  const controls = useMemo(
    () => createControls(state, dispatch, endBehavior),
    [endBehavior, state],
  );
  const position = getStoryPosition(story, state);
  const progressPercent =
    position.totalEvents === 1
      ? 100
      : ((position.eventNumber - 1) / (position.totalEvents - 1)) * 100;
  const canGoPrevious = state.sceneIndex > 0 || state.eventIndex > 0;
  const canGoNext = Boolean(getNextCursor(story, state));

  const stableToggle = useCallback(controls.toggle, [controls.toggle]);

  return {
    state,
    position,
    progressPercent,
    canGoPrevious,
    canGoNext,
    controls: {
      ...controls,
      toggle: stableToggle,
    },
  };
}
