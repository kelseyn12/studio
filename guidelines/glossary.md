# Glossary

- `pickNextAction` — `lib/next-action.ts` — chooses the single Today action. Used on `app/page.tsx`.
- `machineCounts` — `lib/queries.ts` — pipeline and slot totals for Today.
- `uploadMedia` — `lib/outstand.ts` — PUT the mp4 into Outstand storage, returns the public URL.
- `scoreDeal` — `lib/deals.ts` — TECH scores volume; UGC scores fee per video. Used on Deals and deal detail.
- `studioSnapshot` — `lib/queries.ts` — money + active deals by kind + CapCut counts. Used on Today, Deals, Numbers.
- `transcribeFile` — `lib/whisper.ts` — Whisper a voice or video file. Used by Transcribe and card voice notes.
- `pingStudio` — `lib/manychat.ts` — optional DM when a job is sent or parked. Recipes live on `/dms`.
- `deskStage` — `lib/card-desk.ts` — maps pipeline status to Brief / Footage / Editor / Live. Used on the card page.
- `cardPatch` — `lib/card-patch.ts` — writes only fields present on the form so a Brief save cannot wipe editor notes.
- `queueCard` — `lib/publish.ts` — schedule a card and ship the file through Outstand. Used by card Live, Live **Add slot**, and Live bulk.
- `canVisit` — `lib/access.ts` — rooms a role may open. Used by middleware and nav.
- `assembleVideo` — `lib/ffmpeg.ts` — concatenates hook × body × CTA, keeps audio, optional music, applies a per-copy Variation.
- `variationFor` — `lib/variations.ts` — unique speed / light / crop amounts for each copy of a mix.
- `plannedMixes` — `lib/variations.ts` — live mix count from clip piles and the all-combos cap.
- `saveUpload` — `lib/files.ts` — writes raws, voice notes, deliveries under `data/uploads`.
- `requireUser` — `lib/auth.ts` — session gate for pages.
- `rewriteHook` — `lib/rewrite.ts` — gpt-4o-mini hook rewrite. Used by `/api/ai/hook` and the Brief Rewrite hook button.
- `parseAnalytics` — `lib/analytics.ts` — maps Outstand stats onto card views/likes/comments. Used by `/api/analytics/sync`.
