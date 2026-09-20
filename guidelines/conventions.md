# Conventions

- Next.js App Router. Server components by default. Client components only for recorders and forms that need the browser.
- Prisma + SQLite locally. Postgres can replace the datasource later without changing page code.
- Roles: CREATOR films and reviews. EDITOR cuts. OPERATOR schedules through Outstand.
- `cutBy` is SELF (you cut) or EDITOR (VA). Footage has I’ll cut this vs Send to editor. Today respects that split.
- Cards move through IDEA → SCRIPTED → FILMED → EDITING → REVIEW → READY → POSTED → DATA.
- The card desk is Brief → Footage → Cut/Editor → Live. Plan month books a film day. Live is the only publish room.
- Voice, phone clips, and 1080 exports go to Cloudflare R2 when keys are set; local `data/uploads` is the ffmpeg/dev fallback. 4K days stay a Drive folder link.
- Auth is Clerk when keys are set (PIN is off). PIN 4242 is local-only until then. Do not put this app on a public URL with the shared PIN.
- Host on Fly.io (disk + ffmpeg). Not Vercel.
- Deals are TECH (canvas / volume) or UGC (traditional fee + video count). Money lives on Today and Deals, not a third tracker.
- No fake dashboard numbers. Empty states tell the next action.
- Palette is warm charcoal + honey, not neon yellow. Status colors stay muted.
- CapCut is the editor. Studio takes the export and ships.
- Files stay under 300 lines. Split a page when it grows.
- Money is stored as integer cents.
- Outstand account IDs are stored exactly as returned. Never invent them.
