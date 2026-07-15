import { ArrowLeft, CodeXml, FlaskConical, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import versionMetadata from "../../version.json";
import { DemoCatalog } from "./DemoCatalog";
import { APP_NAVIGATION_EVENT, InternalLink } from "./InternalLink";
import { demoRegistry } from "./registry";

const SOURCE_REPOSITORY_URL = "https://github.com/lqdflying/aidemo";

function getCurrentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function SiteBrand(): React.JSX.Element {
  return (
    <InternalLink
      aria-label="CloudOps AI Demo Lab home"
      className="brand"
      href="/"
    >
      <span className="brand__icon">
        <FlaskConical aria-hidden="true" size={17} />
      </span>
      <span className="brand__copy">
        <strong>CloudOps AI Demo Lab</strong>
        <span className="brand__meta">
          <small>Visual explanations</small>
          <small className="brand__version">v{versionMetadata.version}</small>
        </span>
      </span>
    </InternalLink>
  );
}

export function App(): React.JSX.Element {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(getCurrentPath);

  useEffect(() => {
    const handleHistoryChange = (): void => {
      setCurrentPath(getCurrentPath());
    };

    window.addEventListener("popstate", handleHistoryChange);
    window.addEventListener(APP_NAVIGATION_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener("popstate", handleHistoryChange);
      window.removeEventListener(APP_NAVIGATION_EVENT, handleHistoryChange);
    };
  }, []);

  const currentDemo = demoRegistry.getByPath(currentPath);

  if (currentDemo) {
    const CurrentDemo = currentDemo.component;
    return (
      <div className="app-shell">
        <header className="site-header">
          <SiteBrand />
          <InternalLink className="header-link" href="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Back to lab
          </InternalLink>
        </header>
        <CurrentDemo />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <SiteBrand />
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
          <a
            aria-label="Source on GitHub"
            href={SOURCE_REPOSITORY_URL}
            rel="noreferrer"
            target="_blank"
          >
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
