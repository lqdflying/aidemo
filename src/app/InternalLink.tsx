import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

export const APP_NAVIGATION_EVENT = "app:navigate";

interface InternalLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  readonly children: ReactNode;
  readonly href: string;
}

function shouldUseBrowserNavigation(
  event: MouseEvent<HTMLAnchorElement>,
): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function navigateWithinApp(destination: string): void {
  const currentDestination = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (destination === currentDestination) {
    return;
  }

  window.history.pushState({}, "", destination);
  window.dispatchEvent(new Event(APP_NAVIGATION_EVENT));
}

export function InternalLink({
  children,
  href,
  onClick,
  target,
  ...anchorProps
}: InternalLinkProps): React.JSX.Element {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      target === "_blank" ||
      shouldUseBrowserNavigation(event)
    ) {
      return;
    }

    event.preventDefault();
    navigateWithinApp(href);
  };

  return (
    <a {...anchorProps} href={href} onClick={handleClick} target={target}>
      {children}
    </a>
  );
}
