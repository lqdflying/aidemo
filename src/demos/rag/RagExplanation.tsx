import { WalkthroughExplanation } from "../../framework/WalkthroughExplanation";
import type { SceneEvent } from "../../framework/types";
import type { RagEventKind } from "./rag-types";

interface RagExplanationProps {
  readonly event: SceneEvent<RagEventKind>;
  readonly adapterMode: "simulation" | "live";
}

export function RagExplanation({
  event,
  adapterMode,
}: RagExplanationProps): React.JSX.Element {
  return (
    <WalkthroughExplanation adapterMode={adapterMode} event={event} />
  );
}
