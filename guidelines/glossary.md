# Glossary

- `scoreDeal` — `lib/deals.ts` — ranks a campaign by economics, capacity, operations. Used on campaign list and detail.
- `pickNextAction` — `lib/next-action.ts` — chooses the single Today action. Used on `app/page.tsx`.
- `machineCounts` — `lib/queries.ts` — pipeline and slot totals for Today.
- `createPost` — `lib/outstand.ts` — schedules or publishes through Outstand. Used by `scheduleCard`.
- `editorNeeds` — `lib/editor-packet.ts` — checklist for a CapCut handoff. Used on the card and CapCut in.
- `assembleVideo` — `lib/ffmpeg.ts` — concatenates hook × body × CTA, keeps audio, optional music, applies a per-copy Variation.
- `variationFor` — `lib/variations.ts` — unique speed / light / crop amounts for each copy of a mix.
- `plannedMixes` — `lib/variations.ts` — live mix count from clip piles and the all-combos cap.
- `saveUpload` — `lib/files.ts` — writes raws, voice notes, deliveries under `data/uploads`.
- `requireUser` — `lib/auth.ts` — session gate for pages.
