import type { DemoStory } from "../../framework/types";
import type { RagEventKind } from "./rag-types";

export const ragStory: DemoStory<RagEventKind> = {
  id: "rag-explainer",
  title: "Retrieval-Augmented Generation",
  scenes: [
    {
      id: "index",
      act: 1,
      title: "Index: build searchable memory",
      shortTitle: "Index",
      summary: "Documents become small, searchable pieces of knowledge.",
      events: [
        {
          id: "index-show-documents",
          kind: "show-documents",
          title: "Start with source documents",
          explanation:
            "Before it can answer, the system prepares a small library of source material.",
          durationMs: 3000,
          easing: "ease-out",
          accent: "neutral",
        },
        {
          id: "index-split-chunks",
          kind: "split-chunks",
          title: "Split documents into chunks",
          explanation:
            "Smaller passages make it possible to retrieve only the pieces that matter.",
          durationMs: 3600,
          easing: "spring",
          accent: "retrieval",
          dependencies: ["index-show-documents"],
        },
        {
          id: "index-embed-chunks",
          kind: "embed-chunks",
          title: "Turn chunks into vectors",
          explanation:
            "An embedding turns each passage into a numeric fingerprint that captures meaning.",
          durationMs: 4200,
          easing: "ease-in-out",
          accent: "retrieval",
          dependencies: ["index-split-chunks"],
        },
        {
          id: "index-store-vectors",
          kind: "store-vectors",
          title: "Store searchable memory",
          explanation:
            "The vector database keeps those fingerprints ready for a future question.",
          durationMs: 3500,
          easing: "ease-out",
          accent: "evidence",
          dependencies: ["index-embed-chunks"],
        },
      ],
    },
    {
      id: "retrieve",
      act: 2,
      title: "Retrieve: find the strongest evidence",
      shortTitle: "Retrieve",
      summary: "The question becomes a search and the best passages rise.",
      events: [
        {
          id: "retrieve-ask-question",
          kind: "ask-question",
          title: "Ask a question",
          explanation:
            "Now the user asks something that the source documents can help explain.",
          durationMs: 2800,
          easing: "ease-out",
          accent: "input",
          dependencies: ["index-store-vectors"],
        },
        {
          id: "retrieve-embed-query",
          kind: "embed-query",
          title: "Embed the question",
          explanation:
            "The question is converted into the same vector language as the stored passages.",
          durationMs: 3400,
          easing: "ease-in-out",
          accent: "retrieval",
          dependencies: ["retrieve-ask-question"],
        },
        {
          id: "retrieve-search-index",
          kind: "search-index",
          title: "Search by meaning",
          explanation:
            "The database compares the query fingerprint with every stored fingerprint.",
          durationMs: 4200,
          easing: "ease-in-out",
          accent: "retrieval",
          dependencies: ["retrieve-embed-query"],
        },
        {
          id: "retrieve-select-evidence",
          kind: "select-evidence",
          title: "Keep the top three",
          explanation:
            "Only the highest-scoring passages continue, keeping the model's context focused.",
          durationMs: 3400,
          easing: "spring",
          accent: "evidence",
          dependencies: ["retrieve-search-index"],
        },
      ],
    },
    {
      id: "generate",
      act: 3,
      title: "Generate: write a grounded answer",
      shortTitle: "Generate",
      summary: "Evidence joins the question, then the model writes with citations.",
      events: [
        {
          id: "generate-assemble-context",
          kind: "assemble-context",
          title: "Assemble the context window",
          explanation:
            "The prompt combines the original question with the selected source passages.",
          durationMs: 3500,
          easing: "ease-out",
          accent: "evidence",
          dependencies: ["retrieve-select-evidence"],
        },
        {
          id: "generate-answer",
          kind: "generate-answer",
          title: "Generate from evidence",
          explanation:
            "The language model writes an answer using the question and retrieved context together.",
          durationMs: 4500,
          easing: "spring",
          accent: "generation",
          dependencies: ["generate-assemble-context"],
        },
        {
          id: "generate-cite-answer",
          kind: "cite-answer",
          title: "Show where claims came from",
          explanation:
            "Citations connect the answer back to the exact chunks that supported it.",
          durationMs: 3900,
          easing: "ease-out",
          accent: "evidence",
          dependencies: ["generate-answer"],
        },
      ],
    },
  ],
};
