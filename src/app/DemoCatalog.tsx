import {
  ArrowUpRight,
  BookOpenText,
  Boxes,
  Clock3,
  FileSearch,
  Sparkles,
} from "lucide-react";

import { demoRegistry } from "./registry";

const futureDemoTopics = [
  {
    icon: Boxes,
    title: "Agent orchestration",
    description: "See how tools, memory, and planning work together.",
  },
  {
    icon: FileSearch,
    title: "Semantic search",
    description: "Explore embeddings, distance, and ranking visually.",
  },
] as const;

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
            <h2 id="featured-heading">Featured walkthrough</h2>
          </div>
          <p>Start with a complete story in about three minutes.</p>
        </div>

        <div className="demo-grid">
          {demos.map((demo) => (
            <article className="demo-card demo-card--featured" key={demo.id}>
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
                <a className="demo-card__link" href={demo.path}>
                  Start walkthrough
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>
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
