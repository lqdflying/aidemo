import { RagDemo } from "../demos/rag/RagDemo";
import { DemoRegistry } from "./demo-registry";

export const demoRegistry = new DemoRegistry();

demoRegistry.register({
  id: "rag",
  path: "/demos/rag",
  aliases: ["/demos/rag/index", "/demos/rag/retrieve", "/demos/rag/generate"],
  title: "Retrieval-Augmented Generation",
  shortTitle: "How RAG works",
  eyebrow: "Search + generate",
  description:
    "Follow a question as it retrieves evidence, builds context, and produces a cited answer.",
  estimatedMinutes: 3,
  availability: "available",
  accent: "retrieval",
  component: RagDemo,
});
