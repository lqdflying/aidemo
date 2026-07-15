import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSearch,
  MessageSquareText,
  RefreshCw,
  Server,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import type { ArchitectureNodeKind } from "./agent-types";

export function AgentNodeIcon({
  kind,
}: {
  readonly kind: ArchitectureNodeKind;
}): React.JSX.Element {
  switch (kind) {
    case "channel":
      return <MessageSquareText aria-hidden="true" />;
    case "gateway":
      return <ShieldCheck aria-hidden="true" />;
    case "orchestrator":
    case "model":
      return <BrainCircuit aria-hidden="true" />;
    case "memory":
      return <Database aria-hidden="true" />;
    case "skill":
    case "rag":
      return <FileSearch aria-hidden="true" />;
    case "compactor":
      return <RefreshCw aria-hidden="true" />;
    case "agent":
      return <Bot aria-hidden="true" />;
    case "mcp":
      return <Server aria-hidden="true" />;
    case "hook":
      return <ShieldCheck aria-hidden="true" />;
    case "approval":
      return <UserRoundCheck aria-hidden="true" />;
    case "outcome":
      return <CheckCircle2 aria-hidden="true" />;
  }
}
