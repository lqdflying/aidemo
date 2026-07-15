export interface EmbeddingModelInventoryItem {
  readonly provider: string;
  readonly modelId: string;
  readonly modality: string;
  readonly outputDimensions: string;
  readonly typicalFit: string;
  readonly docsUrl: string;
}

export const embeddingModelInventory: readonly EmbeddingModelInventoryItem[] = [
  {
    provider: "OpenAI",
    modelId: "text-embedding-3-small",
    modality: "Text",
    outputDimensions: "1,536 default; reducible",
    typicalFit: "General-purpose text retrieval when cost and quality both matter.",
    docsUrl: "https://platform.openai.com/docs/guides/embeddings",
  },
  {
    provider: "Cohere",
    modelId: "embed-v4.0",
    modality: "Text, images, and mixed content",
    outputDimensions: "256, 512, 1,024, or 1,536 default",
    typicalFit: "Multimodal retrieval across documents, images, and mixed-content files.",
    docsUrl: "https://docs.cohere.com/docs/cohere-embed",
  },
  {
    provider: "Google",
    modelId: "gemini-embedding-001",
    modality: "Text",
    outputDimensions: "128-3,072; 768, 1,536, or 3,072 recommended",
    typicalFit: "Flexible-dimension text retrieval in Gemini-based applications.",
    docsUrl: "https://ai.google.dev/gemini-api/docs/embeddings",
  },
  {
    provider: "Voyage AI",
    modelId: "voyage-4",
    modality: "Text",
    outputDimensions: "256, 512, 1,024 default, or 2,048",
    typicalFit: "General-purpose and multilingual text retrieval.",
    docsUrl: "https://docs.voyageai.com/docs/embeddings",
  },
  {
    provider: "BAAI",
    modelId: "BAAI/bge-large-en-v1.5",
    modality: "Text (English)",
    outputDimensions: "1,024",
    typicalFit: "Open-weight English semantic search and retrieval.",
    docsUrl: "https://huggingface.co/BAAI/bge-large-en-v1.5",
  },
] as const;
