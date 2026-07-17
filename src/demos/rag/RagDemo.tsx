import {
  ArrowLeft,
  CornerDownLeft,
  Database,
  FileText,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { InternalLink } from "../../app/InternalLink";
import { useScenePlayer } from "../../framework/useScenePlayer";
import { WalkthroughProgress } from "../../framework/WalkthroughProgress";
import { RagControls } from "./RagControls";
import { RagExplanation } from "./RagExplanation";
import { ragPhaseLabels, ragPhases, getRagPhaseFromPath, navigateToRagPhase, type RagPhase } from "./rag-routing";
import { ragSimulationAdapter, simulateRag } from "./rag-simulator";
import { RagStage } from "./RagStage";
import { ragPhaseStories } from "./rag-story";
import { RagTimeline } from "./RagTimeline";
import type { RagRuntimeResult } from "./rag-types";

const questionSuggestions = [
  "How does RAG make an answer more trustworthy?",
  "Why are embeddings useful for retrieval?",
  "How does top-k keep model context focused?",
] as const;

function getQuestionFromLocation(): string {
  return new URLSearchParams(window.location.search).get("question") ?? questionSuggestions[0];
}

interface RagPhaseWorkspaceProps {
  readonly activePhase: RagPhase;
  readonly runtimeResult: RagRuntimeResult;
  readonly onNextPhase: () => void;
}

function RagPhaseWorkspace({
  activePhase,
  runtimeResult,
  onNextPhase,
}: RagPhaseWorkspaceProps): React.JSX.Element {
  const player = useScenePlayer(ragPhaseStories[activePhase], {
    endBehavior: "loop",
  });
  const currentPhaseIndex = ragPhases.indexOf(activePhase);
  const nextPhase = ragPhases[currentPhaseIndex + 1];
  const nextPhaseLabel = nextPhase
    ? `Next: ${ragPhaseLabels[nextPhase]}`
    : "Restart walkthrough";

  return (
    <>
      <WalkthroughProgress progressPercent={player.progressPercent} />
      <div className="walkthrough-workspace__main">
        <RagStage
          isComplete={player.state.status === "completed"}
          onEmbeddingModelOpen={() => player.controls.pause()}
          phase={activePhase}
          onVectorDbOpen={() => player.controls.pause()}
          playbackStatus={player.state.status}
          position={player.position}
          simulation={runtimeResult.data}
        />
        <RagExplanation
          adapterMode={runtimeResult.adapterMode}
          event={player.position.event}
        />
      </div>
      <RagControls
        canGoNext={player.canGoNext}
        canGoPrevious={player.canGoPrevious}
        nextPhaseLabel={nextPhaseLabel}
        onNext={player.controls.next}
        onNextPhase={onNextPhase}
        onPrevious={player.controls.previous}
        onRestart={() => player.controls.restart(false)}
        onSkip={player.controls.skip}
        onSpeedChange={player.controls.setSpeed}
        onToggle={player.controls.toggle}
        speed={player.state.speed}
        status={player.state.status}
      />
    </>
  );
}

export function RagDemo(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<RagPhase>(() =>
    getRagPhaseFromPath(window.location.pathname),
  );
  const [questionInput, setQuestionInput] = useState<string>(getQuestionFromLocation);
  const [runtimeResult, setRuntimeResult] = useState<RagRuntimeResult>(() =>
    simulateRag(getQuestionFromLocation()),
  );
  const [runtimeStatus, setRuntimeStatus] = useState<"ready" | "loading" | "error">("ready");

  useEffect(() => {
    const handleHistoryChange = (): void => {
      setActivePhase(getRagPhaseFromPath(window.location.pathname));
      const nextQuestion = getQuestionFromLocation();
      setQuestionInput(nextQuestion);
      setRuntimeResult(simulateRag(nextQuestion));
      setRuntimeStatus("ready");
    };

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, []);

  const currentPhaseIndex = ragPhases.indexOf(activePhase);
  const nextPhase = ragPhases[currentPhaseIndex + 1];

  const selectPhase = (phase: RagPhase): void => {
    navigateToRagPhase(phase, runtimeResult.data.question);
  };

  const handleNextPhase = (): void => {
    if (nextPhase) {
      navigateToRagPhase(nextPhase, runtimeResult.data.question);
      return;
    }

    navigateToRagPhase("index", undefined, true);
  };

  const runQuestion = async (question: string): Promise<void> => {
    setRuntimeStatus("loading");

    try {
      const nextResult = await ragSimulationAdapter.run(question);
      setRuntimeResult(nextResult);
      setQuestionInput(nextResult.data.question);
      setRuntimeStatus("ready");
      navigateToRagPhase("retrieve", nextResult.data.question, true);
    } catch {
      setRuntimeStatus("error");
    }
  };

  const handleQuestionSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void runQuestion(questionInput);
  };

  return (
    <main className="walkthrough-demo rag-demo">
      <section className="walkthrough-hero">
        <div>
          <InternalLink className="back-link" href="/">
            <ArrowLeft aria-hidden="true" size={18} />
            All demos
          </InternalLink>
          <div className="walkthrough-hero__title">
            <p className="eyebrow">Interactive walkthrough</p>
            <h1>See how RAG finds evidence before it answers.</h1>
          </div>
        </div>
        <div className="walkthrough-hero__summary">
          <div aria-hidden="true">
            <FileText />
            <span />
            <Database />
            <span />
            <Sparkles />
          </div>
          <p>
            Follow one phase at a time. Each page loops its own animation until you
            choose to continue.
          </p>
        </div>
      </section>

      <section className="walkthrough-workspace" aria-label="RAG animation workspace">
        <RagTimeline activePhase={activePhase} onSelectPhase={selectPhase} />

        {activePhase === "retrieve" && (
          <section className="question-bar" aria-labelledby="question-bar-heading">
            <div className="question-bar__heading">
              <p className="section-heading__index">Try it</p>
              <h2 id="question-bar-heading">Change the question</h2>
              <p>The same knowledge base is reranked, then the page loops retrieval.</p>
            </div>
            <form className="question-form" onSubmit={handleQuestionSubmit}>
              <label htmlFor="rag-question">Your question</label>
              <div className="question-form__field">
                <input
                  id="rag-question"
                  maxLength={140}
                  onChange={(event) => setQuestionInput(event.target.value)}
                  placeholder="Ask about RAG, embeddings, or retrieval"
                  type="text"
                  value={questionInput}
                />
                <button disabled={runtimeStatus === "loading"} type="submit">
                  {runtimeStatus === "loading" ? "Reranking…" : "Run question"}
                  <CornerDownLeft aria-hidden="true" />
                </button>
              </div>
              {runtimeStatus === "error" && (
                <p className="question-form__error" role="alert">
                  The question could not be simulated. Please try again.
                </p>
              )}
              <div className="question-suggestions" aria-label="Suggested questions">
                {questionSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void runQuestion(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </section>
        )}

        <RagPhaseWorkspace
          activePhase={activePhase}
          key={`${activePhase}:${runtimeResult.data.question}`}
          onNextPhase={handleNextPhase}
          runtimeResult={runtimeResult}
        />
      </section>
    </main>
  );
}
