/** Creator-only preview of one editor's Cuts page. An editor never previews someone else. */
export function previewEditorId(role: string, requested: string | undefined, editorIds: readonly string[]): string | null {
  if (role === "EDITOR") return null;
  const id = requested?.trim() ?? "";
  if (!id || !editorIds.includes(id)) return null;
  return id;
}
