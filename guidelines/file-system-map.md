# File system map

- `app/` routes: Today, pipeline, plan, calendar, campaigns, cards, Cuts, library, repurposer, transcriber, dms, analytics, connections, team, sign-in/sign-up
- `app/api/` auth, files, assets, Outstand connect/sync, analytics sync, plan move, AI hook, transcribe, repurpose generate
- `components/` shell, nav, pills, action card, studio map, today board, plan board, hook rewrite, refresh stats, batch settings, clip tile, editor need, packet files, calendar board, day slot, post chip, card brief/footage/editor/live
- `lib/` prisma, pipeline, deals, next-action, session, Clerk, R2, Outstand, analytics, formats, rewrite, whisper, script, pull-media, manychat, ffmpeg, variations, combinations, editor-packet, queries, publish, media-url
- `prisma/schema.prisma` studio data model (`CutBy`, `User.clerkId`)
- `data/` SQLite database and local upload fallback
- `Dockerfile` + `fly.toml` always-on host with a `/data` volume
- `guidelines/` conventions, map, glossary, todo
