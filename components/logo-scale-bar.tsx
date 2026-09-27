export function LogoScaleBar({
  onSmaller,
  onMatch,
  onBigger,
}: {
  onSmaller: () => void;
  onMatch: () => void;
  onBigger: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button type="button" onClick={onSmaller} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
          Smaller
        </button>
        <button type="button" onClick={onMatch} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
          Match type
        </button>
        <button type="button" onClick={onBigger} className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mute">
          Bigger
        </button>
      </div>
      <p className="text-[11px] text-mute">Type is locked to TT/IG size. Tap a logo, Match type, then Bigger/Smaller if it still shouts.</p>
    </div>
  );
}
