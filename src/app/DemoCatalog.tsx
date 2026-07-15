import {
  ArrowUpRight,
  Bot,
  BookOpenText,
  BrainCircuit,
  Clock3,
  Database,
  FileSearch,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { InternalLink } from "./InternalLink";
import type { DemoVisual } from "./demo-registry";
import { demoRegistry } from "./registry";

const futureDemoTopics = [
  {
    icon: FileSearch,
    title: "Semantic search",
    description: "Explore embeddings, distance, and ranking visually.",
  },
] as const;

function DemoCardVisual({ visual }: { readonly visual: DemoVisual }): React.JSX.Element {
  if (visual === "agent-network") {
    return (
      <div
        className="demo-card__visual demo-card__visual--agents"
        aria-hidden="true"
      >
        <div className="demo-card__agent demo-card__agent--coordinator">
          <BrainCircuit />
          <span>Agent gateway</span>
        </div>
        <div className="demo-card__agent-path">
          <span />
          <span />
          <span />
        </div>
        <div className="demo-card__agent-team">
          <span><Bot /></span>
          <span><Server /></span>
          <span><Database /></span>
          <span><ShieldCheck /></span>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-card__visual" aria-hidden="true">
      <div className="demo-card__document">
        <BookOpenText />
        <span />
        <span />
        <span />
      </div>
      <div className="demo-card__path">
        <span />
        <span />
        <span />
      </div>
      <div className="demo-card__answer">
        <Sparkles />
        <span />
        <span />
      </div>
    </div>
  );
}

export function DemoCatalog(): React.JSX.Element {
  const demos = demoRegistry.list();

  return (
    <main className="catalog">
      <section className="catalog__intro" aria-labelledby="catalog-title">
        <div>
          <p className="eyebrow">AI Demo Lab</p>
          <h1 id="catalog-title">Complex AI, made visible.</h1>
          <p className="catalog__lede">
            Interactive, step-by-step stories that show what happens inside
            modern AI systems.
          </p>
        </div>
        <div className="catalog__mark" aria-hidden="true">
          <Sparkles />
        </div>
      </section>

      <section className="catalog__section" aria-labelledby="featured-heading">
        <div className="section-heading">
          <div>
            <p className="section-heading__index">01</p>
            <h2 id="featured-heading">Featured walkthroughs</h2>
          </div>
          <p>Choose a complete, interactive story and follow every stage.</p>
        </div>

        <div className="demo-grid">
          {demos.map((demo) => (
            <article className="demo-card demo-card--featured" key={demo.id}>
              <DemoCardVisual visual={demo.visual} />

              <div className="demo-card__body">
                <div className="demo-card__meta">
                  <span>{demo.eyebrow}</span>
                  <span>
                    <Clock3 aria-hidden="true" size={15} />
                    {demo.estimatedMinutes} min
                  </span>
                </div>
                <h3>{demo.shortTitle}</h3>
                <p>{demo.description}</p>
                <InternalLink
                  aria-label={`Start ${demo.shortTitle} walkthrough`}
                  className="demo-card__link"
                  href={demo.path}
                >
                  Start walkthrough
                  <ArrowUpRight aria-hidden="true" size={18} />
                </InternalLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="catalog__section catalog__section--future"
        aria-labelledby="future-heading"
      >
        <div className="section-heading">
          <div>
            <p className="section-heading__index">02</p>
            <h2 id="future-heading">Next in the lab</h2>
          </div>
          <p>The studio is ready for more data-driven AI stories.</p>
        </div>
        <div className="future-grid">
          {futureDemoTopics.map((topic) => {
            const TopicIcon = topic.icon;
            return (
              <article className="future-card" key={topic.title}>
                <TopicIcon aria-hidden="true" />
                <div>
                  <div className="future-card__title">
                    <h3>{topic.title}</h3>
                    <span>Coming soon</span>
                  </div>
                  <p>{topic.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
