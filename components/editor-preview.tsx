import Link from "next/link";

/** My page, or one editor's page. Only shown to the creator. */
export function EditorPreview({
  editors,
  activeId,
  mineHref,
  hrefFor,
  note,
}: {
  editors: Array<{ id: string; name: string }>;
  activeId: string | null;
  mineHref: string;
  hrefFor: (editorId: string) => string;
  note?: string;
}) {
  if (editors.length === 0) return null;
  const activeName = editors.find((person) => person.id === activeId)?.name;
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <Link href={mineHref} className={chip(activeId === null)}>
          My page
        </Link>
        {editors.map((person) => (
          <Link key={person.id} href={hrefFor(person.id)} className={chip(activeId === person.id)}>
            {`${person.name}'s page`}
          </Link>
        ))}
      </div>
      {activeName ? (
        <p className="mt-2 text-sm text-mute">{note ?? `This is ${activeName}'s page. His menu is only Cuts.`}</p>
      ) : null}
    </div>
  );
}

function chip(on: boolean): string {
  return on
    ? "rounded-xl bg-sun px-4 py-2 text-sm font-semibold text-ink"
    : "rounded-xl border border-line px-4 py-2 text-sm";
}
