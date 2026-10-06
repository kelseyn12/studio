export type HandPost = {
  id: string;
  content: string;
  publishedAt: string | null;
  network: string;
  url: string;
  outstandAccountId: string;
};

/** What the deal page says after a pull. */
export function pullMessage(pull: string | undefined, more: boolean): string {
  if (pull === "none") return "This deal has no accounts yet. Put them on it in Accounts.";
  if (pull === "wait") return "Still reading the pages. Press the button again in a minute.";
  if (pull === "fail") return "Could not read the pages. Try again.";
  const count = Number(pull);
  if (pull && count > 0) {
    return `Brought in ${count} post${count === 1 ? "" : "s"} from the apps.${more ? " Press again for the rest." : " Numbers includes them."}`;
  }
  if (pull === "0") return "Nothing new since that date.";
  return "";
}

/** The date box on a deal. Ninety days back covers a brand month without pulling a whole archive. */
export function defaultPullSince(now = new Date()): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - 90);
  return date.toISOString().slice(0, 10);
}

/** A `YYYY-MM-DD` from the form, or the default. Invalid text falls back to the default. */
export function pullSince(raw: string, now = new Date()): Date {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : defaultPullSince(now);
  return new Date(`${day}T00:00:00.000Z`);
}

/** First line of the caption. A blank caption still gets a name from the app and the day. */
export function handPostTitle(content: string, networkLabel: string, publishedAt: Date | null): string {
  const line = content.trim().split("\n")[0]?.replace(/\s+/g, " ") ?? "";
  if (line) return line.slice(0, 90);
  const day = publishedAt
    ? publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : "no date";
  return `${networkLabel} · ${day}`;
}

/**
 * Posts from the apps that Studio does not already have. Same Outstand id twice in one pull
 * is kept once. Anything unpublished, or older than `since`, is left out.
 */
export function postsWorthSaving<T extends { id: string; publishedAt: string | null }>(
  posts: T[],
  knownIds: ReadonlySet<string>,
  since: Date,
): T[] {
  const seen = new Set(knownIds);
  const kept: T[] = [];
  for (const post of posts) {
    if (!post.id || seen.has(post.id) || !post.publishedAt) continue;
    const when = new Date(post.publishedAt);
    if (Number.isNaN(when.getTime()) || when < since) continue;
    seen.add(post.id);
    kept.push(post);
  }
  return kept;
}
