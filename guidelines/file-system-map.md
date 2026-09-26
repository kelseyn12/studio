# File system map

- `app/` routes: Today, pipeline, plan, calendar, campaigns, cards, Cuts, library, repurposer, transcriber, dms, analytics, connections, team, sign-in/sign-up
- `app/api/` auth, files, assets, Outstand connect/sync, analytics sync, plan move, AI hook, transcribe, repurpose generate
- `components/` shell, nav, pills, action card, studio map, today board, plan board, hook rewrite, refresh stats, batch settings, batch outputs, clip tile, editor need, packet files, calendar board, day slot, post chip, card brief/footage/editor/live, paid button, failed posts, deal edit, storage meter, library deals/file, delete video
- `lib/` prisma, pipeline, deals, next-action, session, Clerk, R2, storage, library-groups, cut-ready, Outstand, analytics, formats, rewrite, whisper, script, pull-media, manychat, ffmpeg, variations, combinations, editor-packet, queries, publish, media-url, render-batch, captions, batch-polish
- `prisma/schema.prisma` studio data model (`CutBy`, `User.clerkId`)
- `data/` local SQLite (CLI + fallback only — runtime uses Turso when TURSO_DATABASE_URL is set) and local upload fallback
- `Dockerfile` + `fly.toml` public host (sleeps when idle). App: https://system-studio.fly.dev
- `guidelines/` conventions, map, glossary, todo
- `README.md` stack, local setup, route overview, deploy notes
