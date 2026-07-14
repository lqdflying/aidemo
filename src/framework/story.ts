import type { DemoScene, DemoStory, SceneEvent } from "./types";

export interface StoryCursor {
  readonly sceneIndex: number;
  readonly eventIndex: number;
}

export interface StoryPosition<EventKind extends string = string> {
  readonly scene: DemoScene<EventKind>;
  readonly event: SceneEvent<EventKind>;
  readonly sceneIndex: number;
  readonly eventIndex: number;
  readonly eventNumber: number;
  readonly totalEvents: number;
}

export function validateStory<EventKind extends string>(
  story: DemoStory<EventKind>,
): void {
  if (story.scenes.length === 0) {
    throw new Error(`Story "${story.id}" must contain at least one scene.`);
  }

  const sceneIds = new Set<string>();
  const eventIds = new Set<string>();

  story.scenes.forEach((scene) => {
    if (scene.events.length === 0) {
      throw new Error(`Scene "${scene.id}" must contain at least one event.`);
    }

    if (sceneIds.has(scene.id)) {
      throw new Error(`Scene ID "${scene.id}" is duplicated.`);
    }
    sceneIds.add(scene.id);

    scene.events.forEach((event) => {
      if (event.durationMs <= 0) {
        throw new Error(`Event "${event.id}" must have a positive duration.`);
      }

      if (eventIds.has(event.id)) {
        throw new Error(`Event ID "${event.id}" is duplicated.`);
      }

      for (const dependencyId of event.dependencies ?? []) {
        if (!eventIds.has(dependencyId)) {
          throw new Error(
            `Event "${event.id}" depends on unknown or future event "${dependencyId}".`,
          );
        }
      }

      eventIds.add(event.id);
    });
  });
}

export function getStoryEventCount<EventKind extends string>(
  story: DemoStory<EventKind>,
): number {
  return story.scenes.reduce(
    (eventCount, scene) => eventCount + scene.events.length,
    0,
  );
}

export function getStoryPosition<EventKind extends string>(
  story: DemoStory<EventKind>,
  cursor: StoryCursor,
): StoryPosition<EventKind> {
  const scene = story.scenes[cursor.sceneIndex];
  const event = scene?.events[cursor.eventIndex];

  if (!scene || !event) {
    throw new Error(
      `Invalid story cursor at scene ${cursor.sceneIndex}, event ${cursor.eventIndex}.`,
    );
  }

  const priorEventCount = story.scenes
    .slice(0, cursor.sceneIndex)
    .reduce(
      (eventCount, priorScene) => eventCount + priorScene.events.length,
      0,
    );

  return {
    scene,
    event,
    sceneIndex: cursor.sceneIndex,
    eventIndex: cursor.eventIndex,
    eventNumber: priorEventCount + cursor.eventIndex + 1,
    totalEvents: getStoryEventCount(story),
  };
}

export function getNextCursor<EventKind extends string>(
  story: DemoStory<EventKind>,
  cursor: StoryCursor,
): StoryCursor | undefined {
  const currentScene = story.scenes[cursor.sceneIndex];

  if (!currentScene) {
    return undefined;
  }

  if (cursor.eventIndex < currentScene.events.length - 1) {
    return {
      sceneIndex: cursor.sceneIndex,
      eventIndex: cursor.eventIndex + 1,
    };
  }

  if (cursor.sceneIndex < story.scenes.length - 1) {
    return {
      sceneIndex: cursor.sceneIndex + 1,
      eventIndex: 0,
    };
  }

  return undefined;
}

export function getPreviousCursor<EventKind extends string>(
  story: DemoStory<EventKind>,
  cursor: StoryCursor,
): StoryCursor | undefined {
  if (cursor.eventIndex > 0) {
    return {
      sceneIndex: cursor.sceneIndex,
      eventIndex: cursor.eventIndex - 1,
    };
  }

  if (cursor.sceneIndex === 0) {
    return undefined;
  }

  const previousSceneIndex = cursor.sceneIndex - 1;
  const previousScene = story.scenes[previousSceneIndex];

  if (!previousScene) {
    return undefined;
  }

  return {
    sceneIndex: previousSceneIndex,
    eventIndex: previousScene.events.length - 1,
  };
}
