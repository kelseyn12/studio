import type { Prisma } from "@prisma/client";
import { parseLocalDate } from "@/lib/dates";
import { isPipelineStatus } from "@/lib/pipeline";

function text(form: FormData, key: string): string | undefined {
  if (!form.has(key)) return undefined;
  return String(form.get(key) || "");
}

function idOrNull(form: FormData, key: string): string | null | undefined {
  if (!form.has(key)) return undefined;
  return String(form.get(key) || "") || null;
}

export function cardPatch(form: FormData): Prisma.CardUncheckedUpdateInput {
  const data: Prisma.CardUncheckedUpdateInput = {};
  const title = text(form, "title");
  if (title !== undefined) data.title = title || "Untitled";
  const status = text(form, "status");
  if (status && isPipelineStatus(status)) data.status = status;
  const campaignId = idOrNull(form, "campaignId");
  if (campaignId !== undefined) data.campaignId = campaignId;
  const formatId = idOrNull(form, "formatId");
  if (formatId !== undefined) data.formatId = formatId;
  const accountId = idOrNull(form, "accountId");
  if (accountId !== undefined) data.accountId = accountId;
  const editorId = idOrNull(form, "editorId");
  if (editorId !== undefined) data.editorId = editorId;
  const premise = text(form, "premise");
  if (premise !== undefined) data.premise = premise;
  const hook = text(form, "hook");
  if (hook !== undefined) data.hook = hook;
  const body = text(form, "body");
  if (body !== undefined) data.body = body;
  const plug = text(form, "plug");
  if (plug !== undefined) data.plug = plug;
  const script = text(form, "script");
  if (script !== undefined) data.script = script;
  const caption = text(form, "caption");
  if (caption !== undefined) data.caption = caption;
  const referenceUrl = text(form, "referenceUrl");
  if (referenceUrl !== undefined) data.referenceUrl = referenceUrl;
  const rawsUrl = text(form, "rawsUrl");
  if (rawsUrl !== undefined) data.rawsUrl = rawsUrl;
  const editorNote = text(form, "editorNote");
  if (editorNote !== undefined) data.editorNote = editorNote;
  if (form.has("plannedDate")) {
    const raw = String(form.get("plannedDate") || "");
    data.plannedDate = raw ? parseLocalDate(raw) : null;
  }
  if (form.has("deadlineAt")) {
    const raw = String(form.get("deadlineAt") || "");
    data.deadlineAt = raw ? parseLocalDate(raw) : null;
  }
  return data;
}
