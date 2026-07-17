import {
  Activity,
  Bot,
  Braces,
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  Workflow,
  Zap,
  BookOpenCheck,
} from "lucide-react";

import type { AgentComponentKind } from "./agent-types";

export function AgentNodeIcon({
  kind,
}: {
  readonly kind: AgentComponentKind;
}): React.JSX.Element {
  switch (kind) {
    case "user":
      return <UserRound aria-hidden="true" />;
    case "event":
      return <MessageSquareText aria-hidden="true" />;
    case "gateway":
    case "policy":
      return <ShieldCheck aria-hidden="true" />;
    case "coordinator":
      return <Workflow aria-hidden="true" />;
    case "scheduler":
      return <GitBranch aria-hidden="true" />;
    case "context":
    case "context-manager":
      return <RefreshCw aria-hidden="true" />;
    case "memory":
      return <Database aria-hidden="true" />;
    case "skills":
      return <BookOpenCheck aria-hidden="true" />;
    case "model":
      return <BrainCircuit aria-hidden="true" />;
    case "worker":
      return <Bot aria-hidden="true" />;
    case "function-tool":
      return <Braces aria-hidden="true" />;
    case "retrieval":
      return <Search aria-hidden="true" />;
    case "data":
      return <Server aria-hidden="true" />;
    case "action":
      return <Zap aria-hidden="true" />;
    case "evaluator":
      return <CheckCircle2 aria-hidden="true" />;
    case "approval":
      return <UserRoundCheck aria-hidden="true" />;
    case "publisher":
      return <Send aria-hidden="true" />;
    case "telemetry":
      return <Activity aria-hidden="true" />;
  }
}
