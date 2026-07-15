interface WalkthroughProgressProps {
  readonly progressPercent: number;
}

export function WalkthroughProgress({
  progressPercent,
}: WalkthroughProgressProps): React.JSX.Element {
  return (
    <div className="walkthrough-progress" aria-hidden="true">
      <span style={{ width: `${progressPercent}%` }} />
    </div>
  );
}
