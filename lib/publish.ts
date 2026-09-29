import { postedAtFromPost, createPost, hasOutstand, safeUploadName, uploadMedia, type OutstandPost } from "@/lib/outstand";
import { pickFinished, pickForLook } from "@/lib/card-desk";
import { ensureLocal } from "@/lib/files";
import { postOptions, wantsCoverUrl } from "@/lib/post-cover";
import { prisma } from "@/lib/prisma";
import { isPublicMediaUrl, r2PublicUrl } from "@/lib/r2";
import { targetAccounts, targetsByLook } from "@/lib/targets";
import { LOOK_TAG, type DrawnStyle } from "@/lib/text-style";
import type { Asset, CardStatus, SocialAccount } from "@prisma/client";

export type QueueResult = { ok: true; shipped: boolean } | { ok: false; error: string; scheduled: boolean };

/**
 * A failed retry must not take the video off its day when another app already published
 * or is still waiting. Only a first attempt that shipped nothing clears the day.
 */
export function shouldClearDay(shipped: boolean, stillLive: boolean): boolean {
  return !shipped && !stillLive;
}

/** Names the video that failed, so IG · FB is not confused with TT · YT. */
export function lookFailure(look: DrawnStyle, message: string): string {
  const tag = LOOK_TAG[look];
  return tag ? `${tag} video · ${message}` : message;
}

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
  if (isPublicMediaUrl(asset.publicUrl)) return asset.publicUrl;
  const uploaded = await uploadMedia(await ensureLocal(asset.path), asset.filename || "video.mp4", asset.mime || "video/mp4");
  await prisma.asset.update({ where: { id: asset.id }, data: { publicUrl: uploaded.url } });
  return uploaded.url;
}

/**
 * A public JPEG URL of the saved cover frame for apps that take one (IG, YT). "" when the video
 * has no cover, no app in the group wants an image, or the file cannot be reached — the post
 * still ships, Instagram just falls back to the frame offset.
 */
async function shippableCoverUrl(asset: Asset, networks: string[]): Promise<string> {
  if (!asset.coverPath || !wantsCoverUrl(networks)) return "";
  const fromR2 = r2PublicUrl(asset.coverPath);
  if (isPublicMediaUrl(fromR2)) return fromR2;
  try {
    const uploaded = await uploadMedia(await ensureLocal(asset.coverPath), `cover-${asset.id}.jpg`, "image/jpeg");
    return uploaded.url;
  } catch {
    return "";
  }
}

/**
 * Schedules a video. Deal videos go to every account on the deal; when the deal spans app looks
 * (IG + TT), each look's file ships to its own accounts as its own Outstand post.
 */
export async function queueCard(cardId: string, when: Date, accountId?: string | string[] | null): Promise<QueueResult> {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { assets: true } });
  if (!card) return { ok: false, error: "Missing card", scheduled: false };
  const targets = targetAccounts(await prisma.socialAccount.findMany(), card, accountId);
  const primary = targets[0] ?? null;
  const finished = pickFinished(card.assets);

  const posts: OutstandPost[] = [];
  const failures: Array<{ accountId: string; error: string }> = [];
  let error = "";
  try {
    if (!hasOutstand()) {
      /* park only — no posting service */
    } else if (!primary) {
      error = "Pick an account, or put accounts on this deal";
    } else if (!finished) {
      error = "No video file to ship";
    } else {
      await prisma.publishJob.deleteMany({
        where: { cardId, status: "FAILED", accountId: { in: targets.map((account) => account.id) } },
      });
      for (const group of targetsByLook(targets)) {
        try {
          const asset = pickForLook(card.assets, group.look) ?? finished;
          const networks = group.accounts.map((account) => account.network);
          const post = await createPost({
            accounts: group.accounts.map((account: SocialAccount) => account.outstandAccountId),
            content: card.caption || card.title,
            scheduledAt: when.toISOString(),
            media: [{ url: await shippableUrl(asset), filename: safeUploadName(asset.filename || "video.mp4") }],
            options: postOptions(networks, asset, await shippableCoverUrl(asset, networks)),
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
        } catch (caught) {
          const message = lookFailure(group.look, caught instanceof Error ? caught.message : "Outstand failed");
          error = message;
          for (const account of group.accounts) failures.push({ accountId: account.id, error: message });
        }
      }
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Outstand failed";
  }

  if (failures.length === 0 && error && primary) failures.push({ accountId: primary.id, error });
  if (failures.length) {
    await prisma.publishJob.createMany({
      data: failures.map((row) => ({
        cardId,
        accountId: row.accountId,
        status: "FAILED" as const,
        error: row.error,
        scheduledAt: when,
      })),
    });
  }

  const shipped = posts.length > 0;
  if (!shipped && error) {
    const stillLive = await prisma.publishJob.count({
      where: { cardId, status: { in: ["QUEUED", "PUBLISHED"] } },
    });
    if (shouldClearDay(false, stillLive > 0)) {
      await prisma.card.update({ where: { id: cardId }, data: { scheduledAt: null } });
      return { ok: false, error, scheduled: false };
    }
    return { ok: false, error, scheduled: true };
  }

  const first = posts[0];
  await prisma.card.update({
    where: { id: cardId },
    data: parkWrite({
      when: card.scheduledAt ?? when,
      accountId: primary?.id ?? card.accountId,
      outstandPostId: card.outstandPostId ?? first?.id ?? null,
      publishedAt: first ? postedAtFromPost(first) : null,
    }),
  });
  if (error) return { ok: false, error, scheduled: true };
  return { ok: true, shipped };
}
