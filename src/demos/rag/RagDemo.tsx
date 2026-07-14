import {
  ArrowLeft,
  CornerDownLeft,
  Database,
  FileText,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { useScenePlayer } from "../../framework/useScenePlayer";
import { RagControls } from "./RagControls";
import { RagExplanation } from "./RagExplanation";
import { ragSimulationAdapter, simulateRag } from "./rag-simulator";
import { RagStage } from "./RagStage";
import { ragStory } from "./rag-story";
import { RagTimeline } from "./RagTimeline";
import type { RagRuntimeResult } from "./rag-types";

const questionSuggestions = [
  "How does RAG make an answer more trustworthy?",
  "Why are embeddings useful for retrieval?",
  "How does top-k keep model context focused?",
] as const;

export function RagDemo(): React.JSX.Element {
  const [questionInput, setQuestionInput] = useState<string>(
    questionSuggestions[0],
  );
  const [runtimeResult, setRuntimeResult] = useState<RagRuntimeResult>(() =>
    simulateRag(questionSuggestions[0]),
  );
  const [runtimeStatus, setRuntimeStatus] = useState<
    "ready" | "loading" | "error"
  >("ready");
  const player = useScenePlayer(ragStory, { loop: true });

  const runQuestion = async (question: string): Promise<void> => {
    setRuntimeStatus("loading");

    try {
      const nextResult = await ragSimulationAdapter.run(question);
      setRuntimeResult(nextResult);
      setQuestionInput(nextResult.data.question);
      player.controls.goToScene(1, true);
      setRuntimeStatus("ready");
    } catch {
      setRuntimeStatus("error");
    }
  };

  const handleQuestionSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();
    void runQuestion(questionInput);
  };

  return (
    <main className="rag-demo">
      <section className="rag-hero">
        <div>
          <a className="back-link" href="/">
            <ArrowLeft aria-hidden="true" size={18} />
            All demos
          </a>
          <div className="rag-hero__title">
            <p className="eyebrow">Interactive walkthrough</p>
            <h1>See how RAG finds evidence before it answers.</h1>
          </div>
        </div>
        <div className="rag-hero__summary">
          <div aria-hidden="true">
            <FileText />
            <span />
            <Database />
            <span />
            <Sparkles />
          </div>
          <p>
            Follow one question through indexing, retrieval, and a grounded
            answer with visible citations.
          </p>
        </div>
      </section>

      <section className="rag-workspace" aria-label="RAG animation workspace">
        <div className="rag-workspace__progress" aria-hidden="true">
          <span style={{ width: `${player.progressPercent}%` }} />
        </div>

        <RagTimeline
          activeEventIndex={player.state.eventIndex}
          activeSceneIndex={player.state.sceneIndex}
          onSelectScene={(sceneIndex) =>
            player.controls.goToScene(sceneIndex, false)
          }
          scenes={ragStory.scenes}
          status={player.state.status}
        />

        <div className="rag-workspace__main">
          <RagStage
            isComplete={player.state.status === "completed"}
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
          onNext={player.controls.next}
          onPrevious={player.controls.previous}
          onRestart={() => player.controls.restart(false)}
          onSkip={player.controls.skip}
          onSpeedChange={player.controls.setSpeed}
          onToggle={player.controls.toggle}
          speed={player.state.speed}
          status={player.state.status}
        />
      </section>

      <section className="question-lab" aria-labelledby="question-lab-heading">
        <div className="question-lab__heading">
          <div>
            <p className="section-heading__index">Try it</p>
            <h2 id="question-lab-heading">Change the question</h2>
          </div>
          <p>
            The simulation reranks the same knowledge base and starts at
            retrieval.
          </p>
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
        </form>

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
      </section>
    </main>
  );
}
