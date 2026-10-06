import { capcutHref } from "@/lib/capcut";

/** His CapCut project. He pastes the link. She opens it. */
export function CapcutLink({ url, editable }: { url: string; editable: boolean }) {
  const href = capcutHref(url);
  if (!editable && !href) return null;
  return (
    <div className="space-y-2">
      {editable ? (
        <label className="block text-sm">
          Your CapCut link
          <input
            name="capcutUrl"
            defaultValue={url}
            placeholder="https://www.capcut.com/…"
            className="field mt-1"
          />
        </label>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink"
        >
          Open in CapCut
        </a>
      ) : null}
    </div>
  );
}
