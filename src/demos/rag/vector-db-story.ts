import type { DemoStory } from "../../framework/types";
import type { RagVectorDbEventKind } from "./rag-types";

export const vectorDbStory: DemoStory<RagVectorDbEventKind> = {
  id: "rag-vector-db-detail",
  title: "Vector DB record detail",
  scenes: [
    {
      id: "vector-record",
      act: 1,
      title: "Vector DB: from passage to searchable record",
      shortTitle: "Record detail",
      summary: "Watch one chunk become a stored vector record and find its neighbors.",
      events: [
        {
          id: "vector-record-show-source",
          kind: "show-record",
          title: "Keep the source passage",
          explanation:
            "The database record starts with the chunk text and the document location it came from.",
          durationMs: 2600,
          easing: "ease-out",
          accent: "neutral",
        },
        {
          id: "vector-record-embed",
          kind: "embed-record",
          title: "Run the embedding model",
          explanation:
            "The named embedding model converts the passage into a compact numeric fingerprint.",
          durationMs: 3200,
          easing: "ease-in-out",
          accent: "retrieval",
          dependencies: ["vector-record-show-source"],
        },
        {
          id: "vector-record-serialize",
          kind: "serialize-record",
          title: "Serialize the stored fields",
          explanation:
            "The vector and source metadata travel together as one record that can be persisted.",
          durationMs: 3000,
          easing: "spring",
          accent: "evidence",
          dependencies: ["vector-record-embed"],
        },
        {
          id: "vector-record-store",
          kind: "store-record",
          title: "Insert into the vector index",
          explanation:
            "The database stores the record so future queries can compare against its vector.",
          durationMs: 3000,
          easing: "ease-out",
          accent: "evidence",
          dependencies: ["vector-record-serialize"],
        },
        {
          id: "vector-record-search",
          kind: "search-record",
          title: "Compare a query vector",
          explanation:
            "A query vector is compared with stored vectors and the nearest records receive the highest scores.",
          durationMs: 3800,
          easing: "ease-in-out",
          accent: "retrieval",
          dependencies: ["vector-record-store"],
        },
      ],
    },
  ],
};
