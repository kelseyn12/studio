import { startOfDay } from "@/lib/dates";
import { absoluteUpload } from "@/lib/files";
import { createPost, hasOutstand, uploadMedia } from "@/lib/outstand";
import { prisma } from "@/lib/prisma";

export type QueueResult = { ok: true; shipped: boolean } | { ok: false; error: string; scheduled: boolean };

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
  const account = accountId
    ? await prisma.socialAccount.findUnique({ where: { id: accountId } })
    : card.account;
  const edited = card.assets.find((asset) => asset.kind === "EDITED" || asset.kind === "GENERATED");

  let publicUrl = edited?.publicUrl || "";
  let outstandPostId = card.outstandPostId;
  let shipped = false;
  let error = "";

  try {
    if (edited && !publicUrl && hasOutstand()) {
      const uploaded = await uploadMedia(
        absoluteUpload(edited.path),
        edited.filename || "video.mp4",
        edited.mime || "video/mp4",
      );
      publicUrl = uploaded.url;
      await prisma.asset.update({ where: { id: edited.id }, data: { publicUrl } });
    }
    if (hasOutstand() && account && publicUrl) {
      const post = await createPost({
        accounts: [account.outstandAccountId],
        content: card.caption || card.title,
        scheduledAt: when.toISOString(),
        media: [{ url: publicUrl, filename: edited?.filename || "video.mp4" }],
      });
      outstandPostId = post.id;
      shipped = true;
      await prisma.publishJob.create({
        data: {
          cardId,
          accountId: account.id,
          outstandPostId: post.id,
          status: "QUEUED",
          scheduledAt: when,
        },
      });
    } else if (hasOutstand() && account && !publicUrl) {
      error = "No video file to ship";
    } else if (hasOutstand() && !account) {
      error = "Pick an account";
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Outstand failed";
  }

  await prisma.card.update({
    where: { id: cardId },
    data: {
      status: "READY",
      scheduledAt: when,
      plannedDate: startOfDay(when),
      accountId: account?.id ?? card.accountId,
      outstandPostId,
    },
  });
  if (error) return { ok: false, error, scheduled: true };
  return { ok: true, shipped };
}
