# Glossary

- `scoreDeal` — `lib/deals.ts` — ranks a campaign by economics, capacity, operations. Used on campaign list and detail.
- `pickNextAction` — `lib/next-action.ts` — chooses the single Today action. Used on `app/page.tsx`.
- `machineCounts` — `lib/queries.ts` — pipeline and slot totals for Today.
- `createPost` — `lib/outstand.ts` — schedules or publishes through Outstand. Used by `scheduleCard`.
- `concatClips` — `lib/ffmpeg.ts` — builds hook × demo × CTA variations.
- `saveUpload` — `lib/files.ts` — writes raws, voice notes, deliveries under `data/uploads`.
- `requireUser` — `lib/auth.ts` — session gate for pages.
