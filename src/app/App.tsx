import { ArrowLeft, CodeXml, FlaskConical, Menu, X } from "lucide-react";
import { useState } from "react";

import { DemoCatalog } from "./DemoCatalog";
import { demoRegistry } from "./registry";

function getCurrentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export function App(): React.JSX.Element {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const currentPath = getCurrentPath();
  const currentDemo = demoRegistry.getByPath(currentPath);

  if (currentDemo) {
    const CurrentDemo = currentDemo.component;
    return (
      <div className="app-shell">
        <header className="site-header">
          <a className="brand" href="/" aria-label="AI Demo Lab home">
            <span className="brand__icon">
              <FlaskConical aria-hidden="true" size={17} />
            </span>
            <span>
              <strong>AI Demo Lab</strong>
              <small>Visual explanations</small>
            </span>
          </a>
          <a className="header-link" href="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Back to lab
          </a>
        </header>
        <CurrentDemo />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="AI Demo Lab home">
          <span className="brand__icon">
            <FlaskConical aria-hidden="true" size={17} />
          </span>
          <span>
            <strong>AI Demo Lab</strong>
            <small>Visual explanations</small>
          </span>
        </a>
        <nav
          className={`site-nav${isNavigationOpen ? " site-nav--open" : ""}`}
          aria-label="Primary navigation"
        >
          <a href="#featured-heading" onClick={() => setIsNavigationOpen(false)}>
            Explore demos
          </a>
          <a href="#future-heading" onClick={() => setIsNavigationOpen(false)}>
            Framework
          </a>
          <a href="https://github.com" rel="noreferrer" target="_blank">
            <CodeXml aria-hidden="true" size={17} />
            Source
          </a>
        </nav>
        <button
          aria-expanded={isNavigationOpen}
          aria-label={isNavigationOpen ? "Close navigation" : "Open navigation"}
          className="menu-button"
          onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isNavigationOpen ? (
            <X aria-hidden="true" size={21} />
          ) : (
            <Menu aria-hidden="true" size={21} />
          )}
        </button>
      </header>
      <DemoCatalog />
      <footer className="site-footer">
        <span>AI Demo Lab / 2026</span>
        <span>Built for clarity, designed for curiosity.</span>
      </footer>
    </div>
  );
}
