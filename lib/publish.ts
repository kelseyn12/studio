import { postedAtFromPost, createPost, hasOutstand, uploadMedia, type OutstandPost } from "@/lib/outstand";
import { pickFinished, pickForLook } from "@/lib/card-desk";
import { ensureLocal } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { targetAccounts, targetsByLook } from "@/lib/targets";
import type { Asset, CardStatus, SocialAccount } from "@prisma/client";

export type QueueResult = { ok: true; shipped: boolean } | { ok: false; error: string; scheduled: boolean };

export function parkWrite(input: {
  when: Date;
  accountId: string | null;
  outstandPostId: string | null;
  publishedAt: Date | null;
}): { status: CardStatus; scheduledAt: Date; accountId: string | null; outstandPostId: string | null; postedAt?: Date } {
  const live = Boolean(input.publishedAt);
  return {
    status: live ? "POSTED" : "READY",
    scheduledAt: input.when,
    accountId: input.accountId,
    outstandPostId: input.outstandPostId,
    ...(live && input.publishedAt ? { postedAt: input.publishedAt } : {}),
  };
}

/** Makes sure Outstand can fetch this file; caches the URL on the asset. */
async function shippableUrl(asset: Asset): Promise<string> {
  if (asset.publicUrl) return asset.publicUrl;
  const uploaded = await uploadMedia(await ensureLocal(asset.path), asset.filename || "video.mp4", asset.mime || "video/mp4");
  await prisma.asset.update({ where: { id: asset.id }, data: { publicUrl: uploaded.url } });
  return uploaded.url;
}

/**
 * Schedules a video. Deal videos go to every account on the deal; when the deal spans app looks
 * (IG + TT), each look's file ships to its own accounts as its own Outstand post.
 */
export async function queueCard(cardId: string, when: Date, accountId?: string | null): Promise<QueueResult> {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { assets: true } });
  if (!card) return { ok: false, error: "Missing card", scheduled: false };
  const targets = targetAccounts(await prisma.socialAccount.findMany(), card, accountId);
  const primary = targets[0] ?? null;
  const finished = pickFinished(card.assets);

  const posts: OutstandPost[] = [];
  let error = "";
  try {
    if (!hasOutstand()) {
      /* park only — no posting service */
    } else if (!primary) {
      error = "Pick an account, or put accounts on this deal";
    } else if (!finished) {
      error = "No video file to ship";
    } else {
      for (const group of targetsByLook(targets)) {
        const asset = pickForLook(card.assets, group.look) ?? finished;
        const post = await createPost({
          accounts: group.accounts.map((account: SocialAccount) => account.outstandAccountId),
          content: card.caption || card.title,
          scheduledAt: when.toISOString(),
          media: [{ url: await shippableUrl(asset), filename: asset.filename || "video.mp4" }],
        });
        posts.push(post);
        const publishedAt = postedAtFromPost(post);
        await prisma.publishJob.createMany({
          data: group.accounts.map((account) => ({
            cardId,
            accountId: account.id,
            outstandPostId: post.id,
            status: publishedAt ? "PUBLISHED" : "QUEUED",
            scheduledAt: when,
            publishedAt,
          })),
        });
      }
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Outstand failed";
  }

  const shipped = posts.length > 0;
  if (shipped) {
    await prisma.publishJob.deleteMany({ where: { cardId, status: "FAILED" } });
  } else if (error && primary) {
    await prisma.publishJob.create({
      data: { cardId, accountId: primary.id, status: "FAILED", error, scheduledAt: when },
    });
  }

  const first = posts[0];
  await prisma.card.update({
    where: { id: cardId },
    data: parkWrite({
      when,
      accountId: primary?.id ?? card.accountId,
      outstandPostId: first?.id ?? card.outstandPostId,
      publishedAt: first ? postedAtFromPost(first) : null,
    }),
  });
  if (error) return { ok: false, error, scheduled: true };
  return { ok: true, shipped };
}
