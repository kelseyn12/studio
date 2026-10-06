import { getPostAnalytics } from "@/lib/outstand";
import { parseAnalytics } from "@/lib/analytics";
import { handPostTitle, postsWorthSaving, type HandPost } from "@/lib/hand-posts";
import { listHandPosts, listImportJobs, readImport, startImport, type ImportJob } from "@/lib/outstand-import";
import { prisma } from "@/lib/prisma";
import { networkShort } from "@/lib/targets";

const WAIT_MS = 20_000;
const SAVE_CAP = 40;

export type PullResult = { added: number; pending: boolean; accounts: number; more: boolean };

async function knownPostIds(): Promise<Set<string>> {
  const [cards, jobs] = await Promise.all([
    prisma.card.findMany({ where: { outstandPostId: { not: null } }, select: { outstandPostId: true } }),
    prisma.publishJob.findMany({ where: { outstandPostId: { not: null } }, select: { outstandPostId: true } }),
  ]);
  return new Set(
    [...cards.map((card) => card.outstandPostId), ...jobs.map((job) => job.outstandPostId)].filter(
      (id): id is string => Boolean(id),
    ),
  );
}

/** Reuse a pull for this day if one is already running or finished. A new day starts a new pull. */
export async function ensureImport(outstandAccountId: string, since: Date): Promise<ImportJob> {
  const day = since.toISOString().slice(0, 10);
  const jobs = await listImportJobs(outstandAccountId);
  const running = jobs.find((job) => job.since.slice(0, 10) === day && !job.completedAt && job.status !== "failed");
  if (running) return running;
  return startImport(outstandAccountId, since);
}

async function waitFor(outstandAccountId: string, job: ImportJob, deadline: number): Promise<boolean> {
  let current = job;
  while (Date.now() < deadline) {
    if (current.completedAt || current.status === "completed" || current.status === "partial" || current.status === "failed") {
      return current.status !== "failed";
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    current = (await readImport(outstandAccountId, job.id)) ?? current;
  }
  return Boolean(current.completedAt);
}

async function savePost(campaignId: string, post: HandPost, accountId: string): Promise<void> {
  const when = new Date(post.publishedAt as string);
  let views = 0;
  let likes = 0;
  let comments = 0;
  try {
    const stats = parseAnalytics(await getPostAnalytics(post.id));
    views = stats.views;
    likes = stats.likes;
    comments = stats.comments;
  } catch {
    /* The post still lands. Numbers can refresh it later. */
  }
  await prisma.card.create({
    data: {
      title: handPostTitle(post.content, networkShort(post.network), when),
      caption: post.content.trim(),
      status: views > 0 ? "DATA" : "POSTED",
      campaignId,
      accountId,
      accountIds: accountId,
      postedAt: when,
      outstandPostId: post.id,
      referenceUrl: post.url,
      views,
      likes,
      comments,
      cutBy: "SELF",
    },
  });
}

/** Read this deal's pages and save posts Studio did not send. */
export async function pullDealPosts(campaignId: string, since: Date): Promise<PullResult> {
  const accounts = await prisma.socialAccount.findMany({
    where: { campaignId, isActive: true },
    select: { id: true, outstandAccountId: true },
  });
  if (accounts.length === 0) return { added: 0, pending: false, accounts: 0, more: false };
  const jobs = [];
  for (const account of accounts) {
    jobs.push({ account, job: await ensureImport(account.outstandAccountId, since) });
  }
  const deadline = Date.now() + WAIT_MS;
  let pending = false;
  for (const row of jobs) {
    const done = await waitFor(row.account.outstandAccountId, row.job, deadline);
    if (!done) pending = true;
  }
  const byOutstand = new Map(accounts.map((account) => [account.outstandAccountId, account.id]));
  const listed: HandPost[] = [];
  for (const account of accounts) {
    const hands = await listHandPosts(account.outstandAccountId);
    listed.push(...hands.filter((post) => post.outstandAccountId === account.outstandAccountId));
  }
  const fresh = postsWorthSaving(listed, await knownPostIds(), since);
  let added = 0;
  for (const post of fresh.slice(0, SAVE_CAP)) {
    const accountId = byOutstand.get(post.outstandAccountId);
    if (!accountId) continue;
    await savePost(campaignId, post, accountId);
    added += 1;
  }
  return { added, pending: pending && added === 0, accounts: accounts.length, more: fresh.length > SAVE_CAP };
}
