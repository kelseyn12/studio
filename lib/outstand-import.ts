import type { HandPost } from "@/lib/hand-posts";
import { outstand } from "@/lib/outstand";

export type ImportJob = {
  id: string;
  status: string;
  since: string;
  completedAt: string | null;
  error: string | null;
};

const PAGE = 100;
const PAGE_CAP = 3;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function parseImportJob(body: unknown): ImportJob | null {
  const record = asRecord(body);
  const data = asRecord(record?.import) || asRecord(record?.data) || record;
  if (!data || typeof data.id !== "string") return null;
  return {
    id: data.id,
    status: String(data.status || ""),
    since: typeof data.since === "string" ? data.since : "",
    completedAt: typeof data.completedAt === "string" ? data.completedAt : null,
    error: typeof data.error === "string" ? data.error : null,
  };
}

export function parseImportJobs(body: unknown): ImportJob[] {
  const record = asRecord(body);
  const rows = Array.isArray(body)
    ? body
    : Array.isArray(record?.imports)
      ? record.imports
      : Array.isArray(record?.data)
        ? record.data
        : [];
  return rows.map(parseImportJob).filter((job): job is ImportJob => Boolean(job));
}

/** One row per published account on a post. A cross-post can mention several accounts. */
export function parseHandPosts(body: unknown): HandPost[] {
  const record = asRecord(body);
  const posts = Array.isArray(record?.posts) ? record.posts : [];
  const hands: HandPost[] = [];
  for (const item of posts) {
    const post = asRecord(item);
    if (!post || typeof post.id !== "string" || post.isDraft === true) continue;
    const containers = Array.isArray(post.containers) ? post.containers : [];
    const content = String(asRecord(containers[0])?.content || "");
    const accounts = Array.isArray(post.socialAccounts) ? post.socialAccounts : [];
    for (const entry of accounts) {
      const account = asRecord(entry);
      if (!account || typeof account.id !== "string") continue;
      const status = String(account.status || "").toLowerCase();
      if (status && status !== "published") continue;
      hands.push({
        id: post.id,
        content,
        publishedAt: typeof account.publishedAt === "string" ? account.publishedAt : typeof post.publishedAt === "string" ? post.publishedAt : null,
        network: String(account.network || ""),
        url: typeof account.platformPostUrl === "string" ? account.platformPostUrl : "",
        outstandAccountId: account.id,
      });
    }
  }
  return hands;
}

export async function listImportJobs(outstandAccountId: string): Promise<ImportJob[]> {
  const body = await outstand<unknown>(`/social-accounts/${outstandAccountId}/imports`);
  return parseImportJobs(body);
}

export async function startImport(outstandAccountId: string, since: Date): Promise<ImportJob> {
  const body = await outstand<unknown>(`/social-accounts/${outstandAccountId}/imports`, {
    method: "POST",
    body: JSON.stringify({ since: since.toISOString(), limit: 200 }),
  });
  const job = parseImportJob(body);
  if (!job) throw new Error("Outstand did not start a pull");
  return job;
}

export async function readImport(outstandAccountId: string, importId: string): Promise<ImportJob | null> {
  const body = await outstand<unknown>(`/social-accounts/${outstandAccountId}/imports/${importId}`);
  return parseImportJob(body);
}

export async function listHandPosts(outstandAccountId: string): Promise<HandPost[]> {
  const hands: HandPost[] = [];
  for (let page = 0; page < PAGE_CAP; page += 1) {
    const body = await outstand<Record<string, unknown>>(
      `/posts?social_account_id=${encodeURIComponent(outstandAccountId)}&limit=${PAGE}&offset=${page * PAGE}`,
    );
    hands.push(...parseHandPosts(body));
    const total = Number(asRecord(body.pagination)?.total ?? hands.length);
    if (hands.length >= total || hands.length >= PAGE * PAGE_CAP) break;
  }
  return hands;
}
