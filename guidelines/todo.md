# To-do

- [X] Scaffold studio app, schema, ADHD shell
  First cut of System Studio is in the repo: pipeline cards, deals, calendars, editor handoff, Outstand hooks.
  Today picks one next action so the creator is not staring at a dashboard.

- [X] Pipeline, campaigns, calendars, card handoff
  Cards carry script, reference, raws, voice note, deadline, and schedule.
  Deals score hourly rate and daily slots, not just base pay.

- [ ] Paste Outstand API key and org id
  Add OUTSTAND_API_KEY and OUTSTAND_ORG_ID to `.env`, restart, then Sync existing on Accounts.
  Instagram @kelseynocekugc should appear after sync.

- [ ] Clerk or managed auth for production
  Studio PIN is a local lock so the machine can run today.
  Replace it before this is on the public internet.

- [ ] Outstand webhooks for publish + analytics
  Polling can wait. Wire `post.published` when the key is in.

- [X] Volume pass: repurposer, library, bulk calendar, calmer palette
  Hooks × demos × CTAs now keep audio, optional music, hook text, and land as Ready cards.
  Skipped students and an in-app editor. CapCut stays the cutter.

- [ ] Screenshot-parity pass
  Still open: live Outstand posting, URL download/transcribe, month calendar filters.
