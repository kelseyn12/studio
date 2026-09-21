# Conventions

- Next.js App Router. Server components by default. Client components only for recorders and forms that need the browser.
- Prisma + SQLite locally. Postgres can replace the datasource later without changing page code.
- Roles: CREATOR films and reviews. EDITOR cuts. OPERATOR schedules through Outstand.
- `cutBy` is SELF (you cut) or EDITOR (VA). Clips has I’ll cut this vs Send to editor. Today respects that split.
- Cards move through IDEA → SCRIPTED → FILMED → EDITING → REVIEW → READY → POSTED → DATA.
- On screen: say **video** not card. **Approve** not Looks good. **Schedule** not Park. **Account** not Post as. **Clips** not Footage. **Film days** not Plan month. **Finished video** not 1080. **Files** not packet.
- The video steps are Write → Clips → Editor → Schedule. Film days books a film day. Live is the posting calendar.
- Voice, phone clips, and finished videos live on Cloudflare R2. This Mac only holds them if R2 keys are missing. ffmpeg scratch uses temp files. 4K days stay a Drive folder link.
- Auth is Clerk when keys are set (PIN is off). PIN 4242 is local-only until then. Do not put this app on a public URL with the shared PIN.
- Host on Fly.io (disk + ffmpeg). Not Vercel. The machine sleeps when nobody is using it so the bill stays near zero; first open can take ~30 seconds.
- Deals are TECH (canvas / volume) or UGC (traditional fee + video count). Money lives on Today and Deals, not a third tracker.
- No fake dashboard numbers. Empty states tell the next action.
- Palette is warm charcoal + honey, not neon yellow. Status colors stay muted.
- The person cutting uses their own editor. Studio takes the finished video and ships.
- Files stay under 300 lines. Split a page when it grows.
- Money is stored as integer cents.
- Outstand account IDs are stored exactly as returned. Never invent them.
