import type { ComponentType } from "react";

export type DemoAvailability = "available" | "coming-soon";

export interface DemoDefinition {
  readonly id: string;
  readonly path: `/demos/${string}`;
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly estimatedMinutes: number;
  readonly availability: DemoAvailability;
  readonly accent: "retrieval" | "generation" | "evidence" | "input";
  readonly component: ComponentType;
}

export class DemoRegistry {
  readonly #demoById = new Map<string, DemoDefinition>();
  readonly #demoByPath = new Map<string, DemoDefinition>();

  register(demoDefinition: DemoDefinition): void {
    if (this.#demoById.has(demoDefinition.id)) {
      throw new Error(`A demo with ID "${demoDefinition.id}" is already registered.`);
    }

    if (this.#demoByPath.has(demoDefinition.path)) {
      throw new Error(
        `A demo with path "${demoDefinition.path}" is already registered.`,
      );
    }

    this.#demoById.set(demoDefinition.id, demoDefinition);
    this.#demoByPath.set(demoDefinition.path, demoDefinition);
  }

  getByPath(path: string): DemoDefinition | undefined {
    return this.#demoByPath.get(path);
  }

  list(): readonly DemoDefinition[] {
    return Array.from(this.#demoById.values());
  }
}
