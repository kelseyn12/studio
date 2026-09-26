import { postedAtFromPost, createPost, hasOutstand, uploadMedia, type OutstandPost } from "@/lib/outstand";
import { pickFinished } from "@/lib/card-desk";
import { ensureLocal } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { targetAccounts } from "@/lib/targets";
import type { CardStatus } from "@prisma/client";

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

export async function queueCard(
  cardId: string,
  when: Date,
  accountId?: string | null,
): Promise<QueueResult> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { account: true, assets: true },
  });
  if (!card) return { ok: false, error: "Missing card", scheduled: false };
  // Deal videos ship to every account on the deal; personal ones to the picked account.
  const targets = targetAccounts(await prisma.socialAccount.findMany(), card, accountId);
  const account = targets[0] ?? null;
  const edited = pickFinished(card.assets);

  let publicUrl = edited?.publicUrl || "";
  let outstandPost: OutstandPost | null = null;
  let shipped = false;
  let error = "";

  try {
    if (edited && !publicUrl && hasOutstand()) {
      const uploaded = await uploadMedia(
        await ensureLocal(edited.path),
        edited.filename || "video.mp4",
        edited.mime || "video/mp4",
      );
      publicUrl = uploaded.url;
      await prisma.asset.update({ where: { id: edited.id }, data: { publicUrl } });
    }
    if (hasOutstand() && account && publicUrl) {
      const post = await createPost({
        accounts: targets.map((target) => target.outstandAccountId),
        content: card.caption || card.title,
        scheduledAt: when.toISOString(),
        media: [{ url: publicUrl, filename: edited?.filename || "video.mp4" }],
      });
      outstandPost = post;
      shipped = true;
      const publishedAt = postedAtFromPost(post);
      await prisma.publishJob.createMany({
        data: targets.map((target) => ({
          cardId,
          accountId: target.id,
          outstandPostId: post.id,
          status: publishedAt ? "PUBLISHED" : "QUEUED",
          scheduledAt: when,
          publishedAt,
        })),
      });
    } else if (hasOutstand() && account && !publicUrl) {
      error = "No video file to ship";
    } else if (hasOutstand() && !account) {
      error = "Pick an account, or put accounts on this deal";
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Outstand failed";
  }

  if (shipped) {
    await prisma.publishJob.deleteMany({ where: { cardId, status: "FAILED" } });
  } else if (error && account) {
    await prisma.publishJob.create({
      data: {
        cardId,
        accountId: account.id,
        status: "FAILED",
        error,
        scheduledAt: when,
      },
    });
  }

  await prisma.card.update({
    where: { id: cardId },
    data: parkWrite({
      when,
      accountId: account?.id ?? card.accountId,
      outstandPostId: outstandPost?.id ?? card.outstandPostId,
      publishedAt: outstandPost ? postedAtFromPost(outstandPost) : null,
    }),
  });
  if (error) return { ok: false, error, scheduled: true };
  return { ok: true, shipped };
}
