import { AgentDemo } from "../demos/agents/AgentDemo";
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
  visual: "rag-pipeline",
  component: RagDemo,
});

demoRegistry.register({
  id: "agent-orchestration",
  path: "/demos/agent-orchestration",
  aliases: [
    "/demos/agent-orchestration/overview",
    "/demos/agent-orchestration/prepare",
    "/demos/agent-orchestration/route",
    "/demos/agent-orchestration/execute",
    "/demos/agent-orchestration/recover",
    "/demos/agent-orchestration/govern",
    "/demos/agent-orchestration/plan",
    "/demos/agent-orchestration/delegate",
    "/demos/agent-orchestration/adapt",
    "/demos/agent-orchestration/approve",
  ],
  title: "Agent Orchestration",
  shortTitle: "How AI agents work",
  eyebrow: "Route + act + govern",
  description:
    "Trace a CloudOps incident across policy, memory, stateless models, specialist agents, MCP/RAG tools, recovery, and human approval.",
  estimatedMinutes: 8,
  availability: "available",
  accent: "generation",
  visual: "agent-network",
  component: AgentDemo,
});
