# Conventions

- Next.js App Router. Server components by default. Client components only for recorders and forms that need the browser.
- Prisma + SQLite locally. Postgres can replace the datasource later without changing page code.
- Roles: CREATOR films and reviews. EDITOR cuts. OPERATOR schedules through Outstand.
- Cards move through IDEA → SCRIPTED → FILMED → EDITING → REVIEW → READY → POSTED → DATA.
- The card desk is Brief → Footage → Editor → Live. Plan month books a film day. Live is the only publish room.
- Deals are TECH (canvas / volume) or UGC (traditional fee + video count). Money lives on Today and Deals, not a third tracker.
- No fake dashboard numbers. Empty states tell the next action.
- Palette is warm charcoal + honey, not neon yellow. Status colors stay muted.
- CapCut is the editor. Studio takes the export and ships.
- Files stay under 300 lines. Split a page when it grows.
- Money is stored as integer cents.
- Outstand account IDs are stored exactly as returned. Never invent them.
