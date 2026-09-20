# Glossary

- `scoreDeal` — `lib/deals.ts` — ranks a campaign by economics, capacity, operations. Used on campaign list and detail.
- `pickNextAction` — `lib/next-action.ts` — chooses the single Today action. Used on `app/page.tsx`.
- `machineCounts` — `lib/queries.ts` — pipeline and slot totals for Today.
- `uploadMedia` — `lib/outstand.ts` — PUT the mp4 into Outstand storage, returns the public URL.
- `queueCard` — `lib/publish.ts` — schedule a card and ship the file through Outstand. Used by card schedule, Calendar **Add slot**, and Calendar bulk.
- `canVisit` — `lib/access.ts` — rooms a role may open. Used by middleware and nav.
- `assembleVideo` — `lib/ffmpeg.ts` — concatenates hook × body × CTA, keeps audio, optional music, applies a per-copy Variation.
- `variationFor` — `lib/variations.ts` — unique speed / light / crop amounts for each copy of a mix.
- `plannedMixes` — `lib/variations.ts` — live mix count from clip piles and the all-combos cap.
- `saveUpload` — `lib/files.ts` — writes raws, voice notes, deliveries under `data/uploads`.
- `requireUser` — `lib/auth.ts` — session gate for pages.
